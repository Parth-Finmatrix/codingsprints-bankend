import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PipelineStage, Types } from 'mongoose';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';
import { Technology, TechnologyDocument } from './schema/technology.schema';
import { rpcBadRequest, rpcInternal, rpcNotFound } from '@app/rpc';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import { ErrorCode } from '@app/rpc/constants/error-code.enum';
import { RpcException } from '@nestjs/microservices';
import { logger } from 'apps/authentication/src/common/utils/logger';
import { handleMongoRpcError } from '@app/rpc/exceptions/mongo-error.handler';
import { TechnologyQueryDto } from './dto/technology-query.dto';

@Injectable()
export class TechnologiesService {
  constructor(
    @InjectModel(Technology.name)
    private readonly techModel: Model<TechnologyDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  // ✅ Create Technology
  async create(dto: CreateTechnologyDto) {
    console.log('tech DTO ->', dto);

    try {
      // 1️⃣ Category existence check (business rule)
      const category = await this.categoryModel.findById(dto.category);

      if (!category) {
        throw rpcNotFound('Category not found', ErrorCode.RESOURCE_NOT_FOUND);
      }

      // 2️⃣ Create technology
      const technology = await this.techModel.create({
        ...dto,
        categoryId: category._id,
      });

      // 3️⃣ Populate category
      const populatedTechnology = await technology.populate({
        path: 'categoryId',
        select: '_id title slug',
      });

      return {
        technologyDto: populatedTechnology,
        message: 'Technology created successfully!!',
        code: 201,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to create technology');
    }
  }

  // ✅ Get All Technologies (Fast Text Search + Production Ranking)
  async findAll(query: TechnologyQueryDto) {
    try {
      /* ───────── PAGINATION ───────── */

      const isPagination =
        query?.page &&
        query?.limit &&
        query?.page !== undefined &&
        query?.limit !== undefined;

      let page = 1;
      let limit = 0;
      let skip = 0;

      if (isPagination) {
        page = Math.max(Number(query.page) || 1, 1);
        limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
        skip = (page - 1) * limit;
      }

      const search = query.search?.trim() || '';
      const categorySlug = query.categorySlug?.trim();

      const pipeline: PipelineStage[] = [];

      /* ───────── CATEGORY FILTER ───────── */
      if (categorySlug) {
        const category = await this.categoryModel
          .findOne({ slug: categorySlug })
          .select('_id')
          .lean();

        if (!category) {
          return {
            data: {
              technologyDto: [],
              pagination: { page, limit, totalPages: 0, totalCount: 0 },
            },
            message: 'No technologies found.',
          };
        }

        pipeline.push({ $match: { categoryId: category._id } });
      }

      /* ───────── TEXT SEARCH WITH $TEXT + BOOSTING ───────── */
      if (search) {
        // 🔹 Match text index
        pipeline.push({
          $match: { $text: { $search: search } },
        });

        // 🔹 Add textScore + custom boosts
        pipeline.push({
          $addFields: {
            textScore: { $meta: 'textScore' },

            /* Exact match boosts */
            exactTitleBoost: { $cond: [{ $eq: ['$title', search] }, 50, 0] },
            exactSlugBoost: { $cond: [{ $eq: ['$slug', search] }, 40, 0] },

            /* Prefix boost */
            prefixTitleBoost: {
              $cond: [
                {
                  $regexMatch: {
                    input: '$title',
                    regex: `^${search}`,
                    options: 'i',
                  },
                },
                20,
                0,
              ],
            },

            /* Recency boost (newer = higher) */
            recencyBoost: {
              $divide: [
                30,
                {
                  $add: [
                    {
                      $divide: [
                        { $subtract: [new Date(), '$createdAt'] },
                        1000 * 60 * 60 * 24,
                      ],
                    },
                    1,
                  ],
                },
              ],
            },

            /* Type boost (business logic) */
            typeBoost: { $cond: [{ $eq: ['$type', 'course'] }, 5, 0] },

            /* Popularity boost (optional) */
            popularityBoost: {
              $cond: [
                { $ifNull: ['$views', false] },
                { $log10: { $add: ['$views', 1] } },
                0,
              ],
            },

            /* Rating boost (optional) */
            ratingBoost: {
              $cond: [
                { $ifNull: ['$averageRating', false] },
                { $multiply: ['$averageRating', 2] },
                0,
              ],
            },
          },
        });

        // 🔹 Final score calculation
        pipeline.push({
          $addFields: {
            finalScore: {
              $add: [
                { $multiply: ['$textScore', 5] }, // Weight textScore
                '$exactTitleBoost',
                '$exactSlugBoost',
                '$prefixTitleBoost',
                '$recencyBoost',
                '$typeBoost',
                '$popularityBoost',
                '$ratingBoost',
              ],
            },
          },
        });

        pipeline.push({ $sort: { finalScore: -1 } });
      } else {
        // 🔹 Fallback sort if no search
        const allowedSortFields = ['createdAt', 'title', 'slug'];
        const requestedSortBy = query.sortBy ?? 'createdAt';
        const sortBy = allowedSortFields.includes(requestedSortBy)
          ? requestedSortBy
          : 'createdAt';
        const sortOrder: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
        pipeline.push({ $sort: { [sortBy]: sortOrder } });
      }

      /* ───────── LOOKUP CATEGORY ───────── */
      pipeline.push(
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: { path: '$category', preserveNullAndEmptyArrays: true },
        },
      );

      /* ───────── FACET FOR PAGINATION ───────── */
      if (isPagination) {
        pipeline.push({
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  title: 1,
                  slug: 1,
                  description: 1,
                  type: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  imageUrl: 1,
                  categoryId: '$category._id',
                  categoryTitle: '$category.title',
                  categorySlug: '$category.slug',
                  categoryImageUrl: '$category.imageUrl',
                  textScore: 1, // <-- show MongoDB textScore
                  finalScore: 1, // <-- show your combined ranking score
                },
              },
            ],
            totalCount: [{ $count: 'count' }],
          },
        });

        const result = await this.techModel.aggregate(pipeline);

        const data = result[0]?.data || [];
        const totalCount = result[0]?.totalCount?.[0]?.count || 0;

        return {
          message: 'Technologies fetched successfully.',
          technologyDto: data,
          pagination: {
            page,
            limit,
            totalPages: totalCount ? Math.ceil(totalCount / limit) : 0,
            totalCount,
          },
        };
      }
      /* ───────── WITHOUT PAGINATION ───────── */
      pipeline.push({
        $project: {
          title: 1,
          slug: 1,
          description: 1,
          type: 1,
          createdAt: 1,
          updatedAt: 1,
          imageUrl: 1,
          categoryId: '$category._id',
          categoryTitle: '$category.title',
          categorySlug: '$category.slug',
          categoryImageUrl: '$category.imageUrl',
          textScore: 1,
          finalScore: 1,
        },
      });

      const data = await this.techModel.aggregate(pipeline);

      return {
        message: 'Technologies fetched successfully.',
        technologyDto: data,
        code: 200,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to Fetch technologies');
    }
  }

  // ✅ Get by Slug
  async findBySlug(slug: string) {
    try {
      const result = await this.techModel.aggregate([
        { $match: { slug } },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $project: {
            title: 1,
            slug: 1,
            description: 1,
            content: 1,
            type: 1,
            createdAt: 1,
            imageUrl: 1,
            categoryId: '$category._id',
            categoryTitle: '$category.title',
            categorySlug: '$category.slug',
            categoryImageUrl: '$category.imageUrl',
            // categoryDescription: '$category.description',
            // category: {
            //   _id: 1,
            //   title: 1,
            //   slug: 1,
            //   description: 1,
            // },
          },
        },
      ]);

      if (!result.length) {
        throw rpcNotFound('Technology not found');
      }

      const details = {
        technologyDto: result[0],
      };

      return {
        data: details,
        message: 'Technology fetched successfully!!',
        code: 200,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to Fetch technology');
    }
  }

  // ✅ Update by Slug
  async update(slug: string, dto: UpdateTechnologyDto) {
    try {
      const category = await this.categoryModel.findById(dto.category);

      if (!category) {
        throw rpcNotFound('Category not found', ErrorCode.RESOURCE_NOT_FOUND);
      }

      const updated = await this.techModel.findOneAndUpdate(
        { slug },
        {
          ...dto,
          ...(dto.category && {
            categoryId: category._id,
          }),
        },
        { new: true, runValidators: true },
      );

      if (!updated) {
        throw rpcNotFound('Technology not found');
      }

      const details = {
        technologyDto: updated,
      };
      return {
        data: details,
        message: 'Technology updated successfully!!',
        code: 200,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to update technology');
    }
  }

  // ✅ Delete by Slug
  async remove(slug: string) {
    try {
      const deleted = await this.techModel.findOneAndDelete({ slug });

      if (!deleted) {
        throw rpcNotFound('Technology not found');
      }

      const details = {
        technologyDto: deleted,
      };

      return {
        data: details,
        message: 'Technology deleted successfully!!',
        code: 200,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to delete technology');
    }
  }
}

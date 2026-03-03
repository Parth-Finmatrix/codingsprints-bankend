import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { rpcBadRequest, rpcNotFound, rpcInternal } from '@app/rpc';
import { Category, CategoryDocument } from './schemas/category.schema';
import { ErrorCode } from '@app/rpc/constants/error-code.enum';
import { RpcException } from '@nestjs/microservices';
import { logger } from 'apps/authentication/src/common/utils/logger';
import { handleMongoRpcError } from '@app/rpc/exceptions/mongo-error.handler';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  // async getAll(query: QueryCategoryDto) {
  //   try {
  //     const page = Math.max(Number(query.page) || 1, 1);
  //     const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  //     const skip = (page - 1) * limit;
  //     const search = query.search?.trim() || '';

  //     const pipeline: any[] = [];

  //     /* ───────── TEXT SEARCH WITH BOOSTING ───────── */
  //     if (search) {
  //       pipeline.push({
  //         $match: { $text: { $search: search } },
  //       });

  //       pipeline.push({
  //         $addFields: {
  //           textScore: { $meta: 'textScore' },
  //           exactTitleBoost: { $cond: [{ $eq: ['$title', search] }, 50, 0] },
  //           exactSlugBoost: { $cond: [{ $eq: ['$slug', search] }, 40, 0] },
  //           prefixTitleBoost: {
  //             $cond: [
  //               {
  //                 $regexMatch: {
  //                   input: '$title',
  //                   regex: `^${search}`,
  //                   options: 'i',
  //                 },
  //               },
  //               20,
  //               0,
  //             ],
  //           },
  //           recencyBoost: {
  //             $divide: [
  //               30,
  //               {
  //                 $add: [
  //                   {
  //                     $divide: [
  //                       { $subtract: [new Date(), '$createdAt'] },
  //                       1000 * 60 * 60 * 24,
  //                     ],
  //                   },
  //                   1,
  //                 ],
  //               },
  //             ],
  //           },

  //           /* Type boost (business logic) */
  //           typeBoost: { $cond: [{ $eq: ['$type', 'course'] }, 5, 0] },

  //           /* Popularity boost (optional) */
  //           popularityBoost: {
  //             $cond: [
  //               { $ifNull: ['$views', false] },
  //               { $log10: { $add: ['$views', 1] } },
  //               0,
  //             ],
  //           },

  //           /* Rating boost (optional) */
  //           ratingBoost: {
  //             $cond: [
  //               { $ifNull: ['$averageRating', false] },
  //               { $multiply: ['$averageRating', 2] },
  //               0,
  //             ],
  //           },
  //         },
  //       });

  //       pipeline.push({
  //         $addFields: {
  //           finalScore: {
  //             $add: [
  //               { $multiply: ['$textScore', 5] },
  //               '$exactTitleBoost',
  //               '$exactSlugBoost',
  //               '$prefixTitleBoost',
  //               '$recencyBoost',
  //               '$typeBoost',
  //               '$popularityBoost',
  //               '$ratingBoost',
  //             ],
  //           },
  //         },
  //       });

  //       pipeline.push({ $sort: { finalScore: -1 } });
  //     } else {
  //       // fallback sort
  //       const allowedSortFields = ['createdAt', 'title', 'slug'];
  //       const requestedSortBy = query.sortBy ?? 'createdAt';
  //       const sortBy = allowedSortFields.includes(requestedSortBy)
  //         ? requestedSortBy
  //         : 'createdAt';
  //       const sortOrder: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
  //       pipeline.push({ $sort: { [sortBy]: sortOrder } });
  //     }

  //     /* ───────── FACET FOR PAGINATION ───────── */
  //     pipeline.push({
  //       $facet: {
  //         data: [
  //           { $skip: skip },
  //           { $limit: limit },
  //           {
  //             $project: {
  //               title: 1,
  //               slug: 1,
  //               description: 1,
  //               createdAt: 1,
  //               updatedAt: 1,
  //               textScore: 1,
  //               finalScore: 1,
  //             },
  //           },
  //         ],
  //         totalCount: [{ $count: 'count' }],
  //       },
  //     });

  //     const result = await this.categoryModel
  //       .aggregate(pipeline)
  //       .allowDiskUse(true);

  //     const data = result[0]?.data || [];
  //     const totalCount = result[0]?.totalCount?.[0]?.count || 0;

  //     return {
  //       message: 'Categories fetched successfully.',
  //       categoryDto: data,
  //       pagination: {
  //         page,
  //         limit,
  //         totalPages: totalCount ? Math.ceil(totalCount / limit) : 0,
  //         totalCount,
  //       },
  //     };
  //   } catch (error) {
  //     handleMongoRpcError(error, 'Failed to fetch categories');
  //   }
  // }

  async getAll(query: QueryCategoryDto) {
    console.log('category query =>', query);

    try {
      const isPagination =
        query?.page &&
        query?.limit &&
        query?.page !== undefined &&
        query?.limit !== undefined;

      let page = 1;
      let limit = 0;
      let skip = 0;

      if (isPagination) {
        page = Math.max(Number(query?.page), 1);
        limit = Math.min(Math.max(Number(query?.limit), 1), 100);
        skip = (page - 1) * limit;
      }

      const search = query?.search?.trim() || '';
      const pipeline: PipelineStage[] = [];

      /* ───────── SEARCH & SORT ───────── */
      if (search) {
        pipeline.push({ $match: { $text: { $search: search } } });

        pipeline.push({
          $addFields: {
            textScore: { $meta: 'textScore' },
            exactTitleBoost: { $cond: [{ $eq: ['$title', search] }, 50, 0] },
            exactSlugBoost: { $cond: [{ $eq: ['$slug', search] }, 40, 0] },
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

        pipeline.push({
          $addFields: {
            finalScore: {
              $add: [
                { $multiply: ['$textScore', 5] },
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
        // fallback sort
        const allowedSortFields = ['createdAt', 'title', 'slug'];
        const requestedSortBy = query.sortBy ?? 'createdAt';
        const sortBy = allowedSortFields.includes(requestedSortBy)
          ? requestedSortBy
          : 'createdAt';
        const sortOrder: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
        pipeline.push({ $sort: { [sortBy]: sortOrder } });
      }

      /* ───────── PAGINATION LOGIC ───────── */
      if (isPagination) {
        pipeline.push({
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  slug: 1,
                  imageUrl: 1,
                  description: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  textScore: 1,
                  finalScore: 1,
                },
              },
            ],
            totalCount: [{ $count: 'count' }],
          },
        });

        const result = await this.categoryModel.aggregate(pipeline);

        const data = result[0]?.data || [];
        const totalCount = result[0]?.totalCount?.[0]?.count || 0;

        return {
          message: 'Categories fetched successfully.',
          categoryDto: data,
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
          _id: 1,
          title: 1,
          slug: 1,
          imageUrl: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          textScore: 1,
          finalScore: 1,
        },
      });

      const data = await this.categoryModel
        .aggregate(pipeline)
        .allowDiskUse(true);

      return {
        message: 'Categories fetched successfully.',
        categoryDto: data,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to fetch categories');
    }
  }

  async getBySlug(slug: string) {
    try {
      const category = await this.categoryModel.findOne({ slug }).lean();

      if (!category) {
        throw rpcNotFound('Category not found', ErrorCode.AUTH_NOT_FOUND);
      }

      const details = { categoryDto: category };

      return {
        data: details,
        message: 'Fetch Category Successfully!!',
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to fetch category');
    }
  }

  async create(dto: CreateCategoryDto) {
    try {
      const created = await this.categoryModel.create(dto);
      const details = { categoryDto: created };
      return {
        data: details,
        message: 'Create Category Successfully!!',
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to create category');
    }
  }

  async update(slug: string, dto: UpdateCategoryDto) {
    try {
      const updated = await this.categoryModel.findOneAndUpdate({ slug }, dto, {
        new: true,
      });

      if (!updated) {
        throw rpcNotFound('Category not found', ErrorCode.RESOURCE_NOT_FOUND);
      }

      const details = { categoryDto: updated };
      return {
        data: details,
        message: 'Update Category Successfully!!',
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to update category');
    }
  }

  async delete(slug: string) {
    try {
      const deleted = await this.categoryModel.findOneAndDelete({ slug });

      if (!deleted) {
        throw rpcNotFound('Category not found', ErrorCode.RESOURCE_NOT_FOUND);
      }

      const details = { categoryDto: deleted };
      return {
        data: details,
        message: 'Delete Category Successfully!!',
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to delete category');
    }
  }
}

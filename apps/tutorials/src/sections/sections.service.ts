import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PipelineStage, Types } from 'mongoose';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { rpcBadRequest, rpcInternal, rpcNotFound } from '@app/rpc';
import { Section, SectionDocument } from './schema/section.schema';
import { SectionQueryDto } from './dto/section-query.dto';
import {
  Technology,
  TechnologyDocument,
} from '../technologies/schema/technology.schema';
import { ErrorCode } from '@app/rpc/constants/error-code.enum';
import { RpcException } from '@nestjs/microservices';
import { logger } from 'apps/authentication/src/common/utils/logger';
import { handleMongoRpcError } from '@app/rpc/exceptions/mongo-error.handler';

@Injectable()
export class SectionsService {
  constructor(
    @InjectModel(Section.name)
    private readonly sectionModel: Model<SectionDocument>,
    @InjectModel(Technology.name) private techModel: Model<TechnologyDocument>, // ✅ Inject Technology model
  ) {}

  async create(dto: CreateSectionDto) {
    try {
      const technology = await this.techModel.findById(dto.technology);

      if (!technology) {
        throw rpcNotFound('Technology not found', ErrorCode.RESOURCE_NOT_FOUND);
      }

      const section = await this.sectionModel.create({
        ...dto,
        technologyId: technology?._id,
      });

      return {
        data: { sectionDto: section },
        message: 'Section created successfully!!',
        code: 201,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to Create Sections');
    }
  }

  // async findAll(query: SectionQueryDto) {
  //   try {
  //     const page = Number(query.page || 1);
  //     const limit = Number(query.limit || 10);
  //     const search = query.search || '';
  //     const technologySlug = query.technology;
  //     const sortBy = query.sortBy || 'createdAt';
  //     const sortOrder = query.sortOrder === 'desc' ? -1 : 1;

  //     const match: any = {};

  //     if (search) {
  //       match.$or = [
  //         { title: { $regex: search, $options: 'i' } },
  //         { slug: { $regex: search, $options: 'i' } },
  //       ];
  //     }

  //     const pipeline: PipelineStage[] = [
  //       {
  //         $lookup: {
  //           from: 'technologies',
  //           localField: 'technologyId',
  //           foreignField: '_id',
  //           as: 'technology',
  //         },
  //       },
  //       { $unwind: '$technology' },

  //       ...(technologySlug
  //         ? [{ $match: { 'technology.slug': technologySlug } }]
  //         : []),

  //       {
  //         $lookup: {
  //           from: 'categories',
  //           localField: 'technology.categoryId',
  //           foreignField: '_id',
  //           as: 'category',
  //         },
  //       },
  //       { $unwind: '$category' },

  //       {
  //         $lookup: {
  //           from: 'topics',
  //           localField: '_id',
  //           foreignField: 'sectionId',
  //           as: 'topics',
  //         },
  //       },

  //       { $match: match },

  //       {
  //         $project: {
  //           section: {
  //             _id: '$_id',
  //             title: '$title',
  //             slug: '$slug',
  //             createdAt: '$createdAt',
  //             topics: '$topics',
  //           },
  //           technology: {
  //             _id: '$technology._id',
  //             title: '$technology.title',
  //             slug: '$technology.slug',
  //             type: '$technology.type',
  //           },
  //           category: {
  //             _id: '$category._id',
  //             title: '$category.title',
  //             slug: '$category.slug',
  //           },
  //         },
  //       },

  //       { $sort: { [sortBy]: sortOrder } },
  //       { $skip: (page - 1) * limit },
  //       { $limit: limit },
  //     ];

  //     const data = await this.sectionModel.aggregate(pipeline);
  //     const totalCount = await this.sectionModel.countDocuments(match);

  //     return {
  //       data: {
  //         sectionDto: data,
  //         pagination: {
  //           page,
  //           limit,
  //           totalPages: Math.ceil(totalCount / limit),
  //           totalCount,
  //         },
  //       },
  //       message: 'Fetch Sections Successfully!!',
  //     };
  //   } catch (error) {
  //     if (error?.code === 404) rpcNotFound(error);
  //     rpcInternal('Failed to fetch sections');
  //   }
  // }

  async findAll(query: SectionQueryDto) {
    try {
      const isPagination =
        query.page !== undefined &&
        query.limit !== undefined &&
        query.page &&
        query.limit;

      const page = isPagination ? Math.max(Number(query.page), 1) : 1;
      const limit = isPagination
        ? Math.min(Math.max(Number(query.limit), 1), 100)
        : 0;
      const skip = isPagination ? (page - 1) * limit : 0;

      const search = query.search?.trim();
      const technologySlug = query.technologySlug?.trim();
      const categorySlug = query.categorySlug?.trim();

      const sortBy = query.sortBy || 'createdAt';
      const sortOrder: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;

      const pipeline: PipelineStage[] = [];

      /* ───────── SEARCH (title + slug only) ───────── */
      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { slug: { $regex: search, $options: 'i' } },
            ],
          },
        });
      }

      /* ───────── SORT ───────── */
      pipeline.push({ $sort: { [sortBy]: sortOrder } });

      /* ───────── LOOKUPS ───────── */
      pipeline.push(
        {
          $lookup: {
            from: 'technologies',
            localField: 'technologyId',
            foreignField: '_id',
            as: 'technology',
          },
        },
        { $unwind: '$technology' },

        // 🔥 technologySlug filter
        ...(technologySlug
          ? [{ $match: { 'technology.slug': technologySlug } }]
          : []),

        {
          $lookup: {
            from: 'categories',
            localField: 'technology.categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },

        // 🔥 categorySlug filter
        ...(categorySlug
          ? [{ $match: { 'category.slug': categorySlug } }]
          : []),

        {
          $lookup: {
            from: 'topics',
            localField: '_id',
            foreignField: 'sectionId',
            as: 'topics',
          },
        },
      );

      /* ───────── PAGINATION ───────── */
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
                  order: 1,
                  createdAt: 1,
                  topics: 1,
                  imageUrl: 1,

                  technologyId: '$technology._id',
                  technologyTitle: '$technology.title',
                  technologySlug: '$technology.slug',
                  technologyImageUrl: '$technology.imageUrl',

                  categoryId: '$category._id',
                  categoryTitle: '$category.title',
                  categorySlug: '$category.slug',
                  categoryImageUrl: '$category.imageUrl',
                },
              },
            ],
            totalCount: [{ $count: 'count' }],
          },
        });

        const result = await this.sectionModel.aggregate(pipeline);

        const data = result[0]?.data || [];
        const totalCount = result[0]?.totalCount?.[0]?.count || 0;

        return {
          message: 'Sections fetched successfully',
          data: {
            sectionDto: data,
            pagination: {
              page,
              limit,
              totalPages: Math.ceil(totalCount / limit),
              totalCount,
            },
          },
          code: 200,
        };
      }

      /* ───────── NO PAGINATION → RETURN ALL ───────── */
      pipeline.push({
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          order: 1,
          createdAt: 1,
          topics: 1,
          imageUrl: 1,

          technologyId: '$technology._id',
          technologyTitle: '$technology.title',
          technologySlug: '$technology.slug',
          technologyImageUrl: '$technology.imageUrl',

          categoryId: '$category._id',
          categoryTitle: '$category.title',
          categorySlug: '$category.slug',
          categoryImageUrl: '$category.imageUrl',
        },
      });

      const data = await this.sectionModel.aggregate(pipeline);

      return {
        message: 'Sections fetched successfully',
        data: { sectionDto: data },
        code: 200,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to fetch sections');
    }
  }

  async findBySlug(slug: string) {
    try {
      const result = await this.sectionModel.aggregate([
        { $match: { slug } },
        {
          $lookup: {
            from: 'technologies',
            localField: 'technologyId',
            foreignField: '_id',
            as: 'technology',
          },
        },
        { $unwind: '$technology' },
        {
          $lookup: {
            from: 'categories',
            localField: 'technology.categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $lookup: {
            from: 'topics',
            localField: '_id',
            foreignField: 'sectionId',
            as: 'topics',
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            slug: 1,
            order: 1,
            createdAt: 1,
            topics: 1,
            imageUrl: 1,

            technologyId: '$technology._id',
            technologyTitle: '$technology.title',
            technologySlug: '$technology.slug',
            technologyImageUrl: '$technology.imageUrl',

            categoryId: '$category._id',
            categoryTitle: '$category.title',
            categorySlug: '$category.slug',
            categoryImageUrl: '$category.imageUrl',
          },
        },
      ]);

      if (!result.length) throw rpcNotFound('Section not found');

      return {
        data: { sectionDto: result[0] },
        message: 'Section fetched successfully!!',
        code: 200,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to fetch section');
    }
  }

  async update(slug: string, dto: UpdateSectionDto) {
    try {
      const technology = await this.techModel.findById(dto.technology);

      if (!technology) {
        throw rpcNotFound('Technology not found', ErrorCode.RESOURCE_NOT_FOUND);
      }

      const updated = await this.sectionModel.findOneAndUpdate(
        { slug },
        {
          ...dto,
          ...(dto.technology && {
            technologyId: technology._id,
          }),
        },
        { new: true },
      );

      if (!updated) throw rpcNotFound('Section not found');

      return {
        data: { sectionDto: updated },
        message: 'Section updated successfully!!',
        code: 200,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to update Sections');
    }
  }

  async remove(slug: string) {
    try {
      const deleted = await this.sectionModel.findOneAndDelete({ slug });

      if (!deleted) throw rpcNotFound('Section not found');

      return {
        data: { sectionDto: deleted },
        message: 'Section deleted successfully!!',
        code: 200,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to delete Sections');
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PipelineStage, Types } from 'mongoose';
import { Topic, TopicDocument } from './schema/topic.schema';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { rpcBadRequest, rpcInternal, rpcNotFound } from '@app/rpc';
import { ErrorCode } from '@app/rpc/constants/error-code.enum';
import { RpcException } from '@nestjs/microservices';
import { logger } from 'apps/authentication/src/common/utils/logger';
import { handleMongoRpcError } from '@app/rpc/exceptions/mongo-error.handler';
import { TopicsQueryDto } from './dto/topics-query.dto';
import { Section, SectionDocument } from '../sections/schema/section.schema';

@Injectable()
export class TopicsService {
  constructor(
    @InjectModel(Topic.name)
    private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Section.name)
    private readonly SectionModel: Model<SectionDocument>,
  ) {}

  // ✅ Create Topic
  async create(dto: CreateTopicDto) {
    try {
      const section = await this.SectionModel.findById(dto.section);

      if (!section) {
        throw rpcNotFound('Section not found', ErrorCode.RESOURCE_NOT_FOUND);
      }

      const topic = await this.topicModel.create({
        ...dto,
        sectionId: section._id,
      });

      return {
        data: { topicDto: topic },
        message: 'Topic created successfully!!',
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to create topic');
    }
  }

  // ✅ Get All Topics
  // async findAll(query: any) {
  //   try {
  //     const page = Number(query.page || 1);
  //     const limit = Number(query.limit || 10);
  //     const search = query.search || '';
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
  //       { $match: match },

  //       {
  //         $lookup: {
  //           from: 'sections',
  //           localField: 'sectionId',
  //           foreignField: '_id',
  //           as: 'section',
  //         },
  //       },
  //       { $unwind: '$section' },

  //       {
  //         $lookup: {
  //           from: 'technologies',
  //           localField: 'section.technologyId',
  //           foreignField: '_id',
  //           as: 'technology',
  //         },
  //       },
  //       { $unwind: '$technology' },

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
  //         $project: {
  //           title: 1,
  //           slug: 1,
  //           tags: 1,
  //           status: 1,
  //           createdAt: 1,
  //           section: { title: '$section.title' },
  //           technology: { title: '$technology.title' },
  //           category: { title: '$category.title' },
  //         },
  //       },

  //       { $sort: { [sortBy]: sortOrder } },
  //       { $skip: (page - 1) * limit },
  //       { $limit: limit },
  //     ];

  //     const data = await this.topicModel.aggregate(pipeline);
  //     const totalCount = await this.topicModel.countDocuments(match);

  //     return {
  //       data: {
  //         topicDto: {
  //           data,
  //           pagination: {
  //             page,
  //             limit,
  //             totalPages: Math.ceil(totalCount / limit),
  //             totalCount,
  //           },
  //         },
  //       },
  //       message: 'Fetch Topics Successfully!!',
  //     };
  //   } catch (error) {
  //     if (error?.code === 404) rpcNotFound(error);
  //     rpcInternal('Failed to fetch topics');
  //   }
  // }

  async findAll(query: TopicsQueryDto) {
    try {
      const isPagination =
        query.page &&
        query.limit &&
        query.page !== undefined &&
        query.limit !== undefined;

      const page = isPagination ? Math.max(Number(query.page), 1) : 1;
      const limit = isPagination
        ? Math.min(Math.max(Number(query.limit), 1), 100)
        : 0;
      const skip = isPagination ? (page - 1) * limit : 0;

      const search = query.search?.trim() || '';
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;

      const categorySlug = query.categorySlug;
      const technologySlug = query.technologySlug;
      const sectionSlug = query.sectionSlug;

      const pipeline: any[] = [];

      /* ───────── TEXT SEARCH + BOOSTING ───────── */
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

            typeBoost: { $cond: [{ $eq: ['$type', 'course'] }, 5, 0] },

            popularityBoost: {
              $cond: [
                { $ifNull: ['$views', false] },
                { $log10: { $add: ['$views', 1] } },
                0,
              ],
            },

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
        pipeline.push({ $sort: { [sortBy]: sortOrder } });
      }

      /* ───────── LOOKUPS ───────── */
      pipeline.push(
        {
          $lookup: {
            from: 'sections',
            localField: 'sectionId',
            foreignField: '_id',
            as: 'section',
          },
        },
        { $unwind: '$section' },

        // ✅ sectionSlug filter
        ...(sectionSlug ? [{ $match: { 'section.slug': sectionSlug } }] : []),

        {
          $lookup: {
            from: 'technologies',
            localField: 'section.technologyId',
            foreignField: '_id',
            as: 'technology',
          },
        },
        { $unwind: '$technology' },

        // ✅ technologySlug filter
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

        // ✅ categorySlug filter
        ...(categorySlug
          ? [{ $match: { 'category.slug': categorySlug } }]
          : []),
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
                  tags: 1,
                  status: 1,
                  order: 1,
                  content: 1,
                  createdAt: 1,
                  imageUrl: 1,

                  sectionId: '$section._id',
                  sectionTitle: '$section.title',
                  sectionSlug: '$section.slug',
                  sectionImageUrl: '$section.imageUrl',

                  technologyId: '$technology._id',
                  technologyTitle: '$technology.title',
                  technologySlug: '$technology.slug',
                  technologyImageUrl: '$technology.imageUrl',

                  categoryId: '$category._id',
                  categoryTitle: '$category.title',
                  categorySlug: '$category.slug',
                  categoryImageUrl: '$category.imageUrl',

                  textScore: 1,
                  finalScore: 1,
                },
              },
            ],
            totalCount: [{ $count: 'count' }],
          },
        });

        const result = await this.topicModel
          .aggregate(pipeline)
          .allowDiskUse(true);

        const data = result[0]?.data || [];
        const totalCount = result[0]?.totalCount?.[0]?.count || 0;

        return {
          message: 'Topics fetched successfully.',
          topicDto: data,
          pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
          },
          code: 200,
        };
      }

      /* ───────── WITHOUT PAGINATION ───────── */
      pipeline.push({
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          tags: 1,
          status: 1,
          order: 1,
          content: 1,
          createdAt: 1,
          imageUrl: 1,

          sectionId: '$section._id',
          sectionTitle: '$section.title',
          sectionSlug: '$section.slug',
          sectionImageUrl: '$section.imageUrl',

          technologyId: '$technology._id',
          technologyTitle: '$technology.title',
          technologySlug: '$technology.slug',
          technologyImageUrl: '$technology.imageUrl',

          categoryId: '$category._id',
          categoryTitle: '$category.title',
          categorySlug: '$category.slug',
          categoryImageUrl: '$category.imageUrl',

          textScore: 1,
          finalScore: 1,
        },
      });

      const data = await this.topicModel.aggregate(pipeline).allowDiskUse(true);

      return {
        message: 'Topics fetched successfully.',
        topicDto: data,
        code: 200,
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to fetch topics');
    }
  }

  // ✅ Get Topic by Slug
  async findBySlug(slug: string) {
    try {
      /* ───────── 1️⃣ GET CURRENT TOPIC ───────── */
      const current = await this.topicModel.aggregate([
        { $match: { slug } },

        {
          $lookup: {
            from: 'sections',
            localField: 'sectionId',
            foreignField: '_id',
            as: 'section',
          },
        },
        { $unwind: '$section' },

        {
          $lookup: {
            from: 'technologies',
            localField: 'section.technologyId',
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
      ]);

      if (!current.length) {
        throw rpcNotFound('Topic not found');
      }

      const topic = current[0];

      /* ───────── 2️⃣ GET ALL TOPICS (Same Tech + Category) ───────── */
      const allTopics = await this.topicModel.aggregate([
        {
          $lookup: {
            from: 'sections',
            localField: 'sectionId',
            foreignField: '_id',
            as: 'section',
          },
        },
        { $unwind: '$section' },

        {
          $lookup: {
            from: 'technologies',
            localField: 'section.technologyId',
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
          $match: {
            'technology._id': topic.technology._id,
            'category._id': topic.category._id,
            status: 'DRAFT',
          },
        },

        { $sort: { createdAt: 1 } }, // 🔥 change to { order: 1 } if needed

        {
          $project: {
            title: 1,
            slug: 1,
            createdAt: 1,
          },
        },
      ]);

      /* ───────── 3️⃣ FIND INDEX ───────── */
      const index = allTopics.findIndex((t) => t.slug === slug);

      const previous = index > 0 ? allTopics[index - 1] : null;
      const next = index < allTopics.length - 1 ? allTopics[index + 1] : null;

      /* ───────── 4️⃣ FINAL DTO ───────── */
      const topicDto = {
        _id: topic._id,
        tags: topic.tags,
        title: topic.title,
        slug: topic.slug,
        order: topic.order,
        content: topic.content,
        status: topic.status,
        imageUrl: topic.imageUrl,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,

        sectionId: topic.section._id,
        sectionTitle: topic.section.title,
        sectionSlug: topic.section.slug,
        sectionImageUrl: topic.section.imageUrl,

        technologyId: topic.technology._id,
        technologyTitle: topic.technology.title,
        technologySlug: topic.technology.slug,
        technologyImageUrl: topic.technology.imageUrl,

        categoryId: topic.category._id,
        categoryTitle: topic.category.title,
        categorySlug: topic.category.slug,
        categoryImageUrl: topic.category.imageUrl,
      };

      return {
        data: {
          topicDto,
          navigation: {
            previous,
            next,
          },
        },
        message: 'Topic fetched successfully!!',
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to fetch topic');
    }
  }

  // ✅ Update Topic
  async update(slug: string, dto: UpdateTopicDto) {
    try {
      const section = await this.SectionModel.findById(dto.section);

      if (!section) {
        throw rpcNotFound('Section not found', ErrorCode.RESOURCE_NOT_FOUND);
      }

      const updated = await this.topicModel.findOneAndUpdate(
        { slug },
        {
          ...dto,
          ...(dto.section && {
            sectionId: section._id,
          }),
        },
        { new: true, runValidators: true },
      );

      if (!updated) throw rpcNotFound('Topic not found');

      return {
        data: { topicDto: updated },
        message: 'Topic updated successfully!!',
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to update topic');
    }
  }

  // ✅ Delete Topic
  async remove(slug: string) {
    try {
      const deleted = await this.topicModel.findOneAndDelete({ slug });

      if (!deleted) throw rpcNotFound('Topic not found');

      return {
        data: { topicDto: deleted },
        message: 'Topic deleted successfully!!',
      };
    } catch (error) {
      handleMongoRpcError(error, 'Failed to delete topic');
    }
  }
}

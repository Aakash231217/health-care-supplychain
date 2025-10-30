import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const productRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(1000).default(1000),
        cursor: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'ON_HOLD', 'DISCONTINUED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, category, status } = input;
      
      const products = await ctx.db.product.findMany({
        take: limit + 1,
        where: {
          ...(category && { category }),
          ...(status && { status }),
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
      });

      let nextCursor: string | undefined = undefined;
      if (products.length > limit) {
        const nextItem = products.pop();
        nextCursor = nextItem!.id;
      }

      return {
        products,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          qualityChecks: {
            orderBy: { performedAt: 'desc' },
            take: 5,
          },
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        sku: z.string(),
        name: z.string(),
        description: z.string().optional(),
        category: z.string(),
        subCategory: z.string().optional(),
        unitOfMeasure: z.string(),
        reorderPoint: z.number().optional(),
        leadTime: z.number().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.product.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          subCategory: z.string().optional(),
          unitOfMeasure: z.string().optional(),
          reorderPoint: z.number().optional(),
          leadTime: z.number().optional(),
          status: z.enum(['ACTIVE', 'INACTIVE', 'ON_HOLD', 'DISCONTINUED']).optional(),
          complianceStatus: z.enum(['PENDING', 'COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW']).optional(),
          metadata: z.any().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.product.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.product.delete({
        where: { id: input.id },
      });
    }),

  bulkUpload: publicProcedure
    .input(
      z.object({
        products: z.array(
          z.object({
            sku: z.string(),
            name: z.string(),
            description: z.string().optional(),
            category: z.string(),
            subCategory: z.string().optional(),
            unitOfMeasure: z.string(),
            reorderPoint: z.number().optional(),
            leadTime: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.product.createMany({
        data: input.products,
        skipDuplicates: true,
      });
    }),
});

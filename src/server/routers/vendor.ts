import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const vendorRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED', 'UNDER_REVIEW']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status } = input;
      
      const vendors = await ctx.db.vendor.findMany({
        take: limit + 1,
        where: {
          ...(status && { status }),
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
      });

      let nextCursor: string | undefined = undefined;
      if (vendors.length > limit) {
        const nextItem = vendors.pop();
        nextCursor = nextItem!.id;
      }

      return {
        vendors,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.vendor.findUnique({
        where: { id: input.id },
        include: {
          purchaseOrders: {
            orderBy: { orderDate: 'desc' },
            take: 10,
          },
          vendorPerformance: {
            orderBy: { month: 'desc' },
            take: 6,
          },
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        contactPerson: z.string().optional(),
        specializations: z.any().optional(),
        certifications: z.any().optional(),
        paymentTerms: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.vendor.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          contactPerson: z.string().optional(),
          status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED', 'UNDER_REVIEW']).optional(),
          performanceRating: z.number().optional(),
          qualityScore: z.number().optional(),
          responsivenessScore: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.vendor.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.vendor.delete({
        where: { id: input.id },
      });
    }),

  getPerformanceStats: publicProcedure
    .input(z.object({ vendorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const performance = await ctx.db.vendorPerformance.findMany({
        where: { vendorId: input.vendorId },
        orderBy: { month: 'desc' },
        take: 12,
      });

      const avgOnTimeDelivery = performance.reduce((acc, p) => acc + p.onTimeDelivery, 0) / performance.length;
      const avgQualityRating = performance.reduce((acc, p) => acc + p.qualityRating, 0) / performance.length;
      const totalOrders = performance.reduce((acc, p) => acc + p.totalOrders, 0);

      return {
        performance,
        stats: {
          avgOnTimeDelivery: avgOnTimeDelivery || 0,
          avgQualityRating: avgQualityRating || 0,
          totalOrders,
        },
      };
    }),
});

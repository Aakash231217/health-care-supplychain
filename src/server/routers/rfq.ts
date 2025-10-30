import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const rfqRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        status: z.enum(['DRAFT', 'ISSUED', 'RESPONSES_RECEIVED', 'EVALUATION', 'CLOSED', 'CANCELLED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status } = input;
      
      const rfqs = await ctx.db.rFQ.findMany({
        take: limit + 1,
        where: {
          ...(status && { status }),
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          vendors: {
            include: {
              vendor: true,
            },
          },
          quotes: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (rfqs.length > limit) {
        const nextItem = rfqs.pop();
        nextCursor = nextItem!.id;
      }

      return {
        rfqs,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.rFQ.findUnique({
        where: { id: input.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          vendors: {
            include: {
              vendor: true,
            },
          },
          quotes: {
            include: {
              vendor: true,
              product: true,
            },
          },
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.date(),
        specialRequirements: z.string().optional(),
        termsAndConditions: z.string().optional(),
        createdById: z.string(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number(),
            targetPrice: z.number().optional(),
            notes: z.string().optional(),
          })
        ),
        vendorIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { items, vendorIds, ...rfqData } = input;

      // Generate RFQ number
      const count = await ctx.db.rFQ.count();
      const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      const rfq = await ctx.db.rFQ.create({
        data: {
          ...rfqData,
          rfqNumber,
          items: {
            create: items,
          },
          vendors: {
            create: vendorIds.map((vendorId) => ({
              vendorId,
            })),
          },
        },
        include: {
          items: true,
          vendors: true,
        },
      });

      return rfq;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          dueDate: z.date().optional(),
          status: z.enum(['DRAFT', 'ISSUED', 'RESPONSES_RECEIVED', 'EVALUATION', 'CLOSED', 'CANCELLED']).optional(),
          specialRequirements: z.string().optional(),
          termsAndConditions: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.rFQ.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.rFQ.delete({
        where: { id: input.id },
      });
    }),

  getStats: publicProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.rFQ.count();
    const open = await ctx.db.rFQ.count({ where: { status: 'ISSUED' } });
    const evaluation = await ctx.db.rFQ.count({ where: { status: 'EVALUATION' } });
    const closed = await ctx.db.rFQ.count({ where: { status: 'CLOSED' } });

    return {
      total,
      open,
      evaluation,
      closed,
    };
  }),
});

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const shipmentRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        status: z.enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'CANCELLED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status } = input;
      
      const shipments = await ctx.db.shipment.findMany({
        take: limit + 1,
        where: {
          ...(status && { status }),
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          purchaseOrder: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          vendor: true,
          items: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (shipments.length > limit) {
        const nextItem = shipments.pop();
        nextCursor = nextItem!.id;
      }

      return {
        shipments,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.shipment.findUnique({
        where: { id: input.id },
        include: {
          purchaseOrder: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          vendor: true,
          items: true,
          trackingLogs: {
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        poId: z.string(),
        vendorId: z.string(),
        trackingNumber: z.string().optional(),
        carrier: z.string().optional(),
        estimatedDeliveryDate: z.date().optional(),
        items: z.array(
          z.object({
            sku: z.string(),
            quantity: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { items, ...shipmentData } = input;

      // Generate shipment number
      const count = await ctx.db.shipment.count();
      const shipmentNumber = `SH-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      return await ctx.db.shipment.create({
        data: {
          ...shipmentData,
          shipmentNumber,
          items: {
            create: items,
          },
        },
        include: {
          items: true,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          status: z.enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'CANCELLED']).optional(),
          trackingNumber: z.string().optional(),
          carrier: z.string().optional(),
          shippedDate: z.date().optional(),
          estimatedDeliveryDate: z.date().optional(),
          actualDeliveryDate: z.date().optional(),
          location: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.shipment.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  addTrackingLog: publicProcedure
    .input(
      z.object({
        shipmentId: z.string(),
        status: z.string(),
        location: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.shipmentTracking.create({
        data: input,
      });
    }),

  getStats: publicProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.shipment.count();
    const inTransit = await ctx.db.shipment.count({ where: { status: 'IN_TRANSIT' } });
    const outForDelivery = await ctx.db.shipment.count({ where: { status: 'OUT_FOR_DELIVERY' } });
    const deliveredToday = await ctx.db.shipment.count({
      where: {
        status: 'DELIVERED',
        actualDeliveryDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return {
      total,
      inTransit,
      outForDelivery,
      deliveredToday,
    };
  }),
});

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { VendorResearcher } from '@/lib/vendor-researcher';
import { TRPCError } from '@trpc/server';

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
        include: {
          purchaseOrders: true,
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

  // Vendor Intelligence & Research
  researchVendor: publicProcedure
    .input(
      z.object({
        vendorId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get vendor details
        const vendor = await ctx.db.vendor.findUnique({
          where: { id: input.vendorId },
        });

        if (!vendor) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vendor not found',
          });
        }

        // Check if research already exists and is recent (< 30 days)
        const existingIntelligence = await ctx.db.vendorIntelligence.findUnique({
          where: { vendorId: input.vendorId },
        });

        if (
          existingIntelligence &&
          existingIntelligence.researchStatus === 'COMPLETED' &&
          existingIntelligence.lastResearchedAt &&
          Date.now() - existingIntelligence.lastResearchedAt.getTime() < 30 * 24 * 60 * 60 * 1000
        ) {
          return {
            intelligence: existingIntelligence,
            message: 'Using cached research data (< 30 days old)',
          };
        }

        // Update status to IN_PROGRESS
        await ctx.db.vendorIntelligence.upsert({
          where: { vendorId: input.vendorId },
          create: {
            vendorId: input.vendorId,
            researchStatus: 'IN_PROGRESS',
          },
          update: {
            researchStatus: 'IN_PROGRESS',
            researchError: null,
          },
        });

        // Perform research
        const researcher = new VendorResearcher();
        const intelligenceData = await researcher.researchVendor({
          vendorName: vendor.name,
          existingWebsite: vendor.address || undefined,
          existingEmail: vendor.email,
        });

        // Save intelligence to database
        const intelligence = await ctx.db.vendorIntelligence.upsert({
          where: { vendorId: input.vendorId },
          create: {
            vendorId: input.vendorId,
            ...intelligenceData,
            researchStatus: 'COMPLETED',
            lastResearchedAt: new Date(),
          },
          update: {
            ...intelligenceData,
            researchStatus: 'COMPLETED',
            lastResearchedAt: new Date(),
            researchError: null,
          },
        });

        return {
          intelligence,
          message: 'Vendor research completed successfully',
        };
      } catch (error) {
        // Save error status
        await ctx.db.vendorIntelligence.upsert({
          where: { vendorId: input.vendorId },
          create: {
            vendorId: input.vendorId,
            researchStatus: 'FAILED',
            researchError: error instanceof Error ? error.message : 'Unknown error',
          },
          update: {
            researchStatus: 'FAILED',
            researchError: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Vendor research failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  getVendorIntelligence: publicProcedure
    .input(z.object({ vendorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const intelligence = await ctx.db.vendorIntelligence.findUnique({
        where: { vendorId: input.vendorId },
        include: {
          vendor: {
            select: {
              name: true,
              email: true,
              address: true,
            },
          },
        },
      });

      return intelligence;
    }),

  // Batch research multiple vendors
  batchResearchVendors: publicProcedure
    .input(
      z.object({
        vendorIds: z.array(z.string()).max(10), // Limit to 10 at a time
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = [];

      for (const vendorId of input.vendorIds) {
        try {
          const vendor = await ctx.db.vendor.findUnique({
            where: { id: vendorId },
          });

          if (!vendor) continue;

          const researcher = new VendorResearcher();
          const intelligenceData = await researcher.researchVendor({
            vendorName: vendor.name,
            existingEmail: vendor.email,
          });

          const intelligence = await ctx.db.vendorIntelligence.upsert({
            where: { vendorId },
            create: {
              vendorId,
              ...intelligenceData,
              researchStatus: 'COMPLETED',
              lastResearchedAt: new Date(),
            },
            update: {
              ...intelligenceData,
              researchStatus: 'COMPLETED',
              lastResearchedAt: new Date(),
            },
          });

          results.push({
            vendorId,
            vendorName: vendor.name,
            status: 'SUCCESS',
            classification: intelligence.supplierClassification,
          });
        } catch (error) {
          results.push({
            vendorId,
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        total: input.vendorIds.length,
        successful: results.filter((r) => r.status === 'SUCCESS').length,
        failed: results.filter((r) => r.status === 'FAILED').length,
        results,
      };
    }),
});

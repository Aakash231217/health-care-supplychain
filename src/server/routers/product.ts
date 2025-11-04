import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { MedicineVendorSearcher } from '@/lib/medicine-vendor-searcher';
import { AIAggregator } from '@/lib/ai-aggregator';
import { TRPCError } from '@trpc/server';

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

  // New pagination endpoint
  getAllPaginated: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(1000).default(100),
        search: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'ON_HOLD', 'DISCONTINUED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, category, status } = input;
      const skip = (page - 1) * limit;
      
      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { sku: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(category && { category }),
        ...(status && { status }),
      };
      
      // Get total count
      const totalCount = await ctx.db.product.count({ where });
      
      // Get paginated products
      const products = await ctx.db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalPages = Math.ceil(totalCount / limit);

      return {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
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
            // Pharmaceutical fields
            activeSubstance: z.string().optional(),
            pharmaceuticalForm: z.string().optional(),
            concentration: z.string().optional(),
            quantityRequired: z.number().optional(),
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

  searchVendorsForProduct: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        country: z.string().optional(),
        searchDepth: z.number().min(1).max(5).default(3),
        useAIAggregation: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get product details
      const product = await ctx.db.product.findUnique({
        where: { id: input.productId },
      });

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      // Construct medicine name with details
      const medicineName = product.name;
      const dosage = product.concentration || undefined;

      // Use AI aggregator if enabled (combines ChatGPT, Google, Bing results)
      if (input.useAIAggregation) {
        const aggregator = new AIAggregator();
        const result = await aggregator.aggregateVendorSearch({
          medicineName,
          dosage,
          country: input.country,
          searchDepth: input.searchDepth,
        });

        // Convert aggregated result to match expected format
        return {
          medicineName: result.medicineName,
          searchQuery: result.searchQuery,
          vendorsFound: result.totalVendorsFound,
          vendors: {
            wholesalers: result.uniqueVendors.filter(v => v.businessType === 'Wholesaler'),
            distributors: result.uniqueVendors.filter(v => v.businessType === 'Distributor'),
            retailers: result.uniqueVendors.filter(v => v.businessType === 'Retailer'),
            manufacturers: result.uniqueVendors.filter(v => v.businessType === 'Manufacturer'),
            uncategorized: result.uniqueVendors.filter(v => v.businessType === 'Unknown'),
          },
          searchMetadata: {
            ...result.searchMetadata,
            aiInsights: result.aiInsights,
            vendorsBySource: result.vendorsBySource,
          },
        };
      }

      // Fall back to original searcher
      const searcher = new MedicineVendorSearcher();
      const result = await searcher.searchVendorsForMedicine({
        medicineName,
        dosage,
        country: input.country,
        searchDepth: input.searchDepth,
      });

      return result;
    }),

  searchVendorsByMedicineName: publicProcedure
    .input(
      z.object({
        medicineName: z.string(),
        dosage: z.string().optional(),
        country: z.string().optional(),
        searchDepth: z.number().min(1).max(5).default(3),
        useAIAggregation: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use AI aggregator if enabled (combines ChatGPT, Google, Bing results)
      if (input.useAIAggregation) {
        const aggregator = new AIAggregator();
        const result = await aggregator.aggregateVendorSearch({
          medicineName: input.medicineName,
          dosage: input.dosage,
          country: input.country,
          searchDepth: input.searchDepth,
        });

        // Convert aggregated result to match expected format
        return {
          medicineName: result.medicineName,
          searchQuery: result.searchQuery,
          vendorsFound: result.totalVendorsFound,
          vendors: {
            wholesalers: result.uniqueVendors.filter(v => v.businessType === 'Wholesaler'),
            distributors: result.uniqueVendors.filter(v => v.businessType === 'Distributor'),
            retailers: result.uniqueVendors.filter(v => v.businessType === 'Retailer'),
            manufacturers: result.uniqueVendors.filter(v => v.businessType === 'Manufacturer'),
            uncategorized: result.uniqueVendors.filter(v => v.businessType === 'Unknown'),
          },
          searchMetadata: {
            ...result.searchMetadata,
            aiInsights: result.aiInsights,
            vendorsBySource: result.vendorsBySource,
          },
        };
      }

      // Fall back to original searcher
      const searcher = new MedicineVendorSearcher();
      const result = await searcher.searchVendorsForMedicine({
        medicineName: input.medicineName,
        dosage: input.dosage,
        country: input.country,
        searchDepth: input.searchDepth,
      });

      return result;
    }),

  searchVendorsWithAI: publicProcedure
    .input(
      z.object({
        medicineName: z.string(),
        dosage: z.string().optional(),
        country: z.string().optional(),
        searchDepth: z.number().min(1).max(5).default(3),
        sources: z.array(z.enum(['ChatGPT', 'Google', 'Bing'])).optional(),
        includeMarketAnalysis: z.boolean().default(true),
        includeRecommendations: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const aggregator = new AIAggregator();
      
      const result = await aggregator.aggregateVendorSearch({
        medicineName: input.medicineName,
        dosage: input.dosage,
        country: input.country,
        searchDepth: input.searchDepth,
      });

      return {
        medicineName: result.medicineName,
        searchQuery: result.searchQuery,
        vendorsFound: result.totalVendorsFound,
        vendors: {
          all: result.uniqueVendors,
          wholesalers: result.uniqueVendors.filter(v => v.businessType === 'Wholesaler'),
          distributors: result.uniqueVendors.filter(v => v.businessType === 'Distributor'),
          retailers: result.uniqueVendors.filter(v => v.businessType === 'Retailer'),
          manufacturers: result.uniqueVendors.filter(v => v.businessType === 'Manufacturer'),
          uncategorized: result.uniqueVendors.filter(v => v.businessType === 'Unknown'),
        },
        vendorsBySource: result.vendorsBySource,
        aiInsights: {
          ...(input.includeMarketAnalysis && { marketAnalysis: result.aiInsights.marketAnalysis }),
          ...(input.includeRecommendations && { recommendations: result.aiInsights.recommendations }),
          summary: result.aiInsights.summary,
          warnings: result.aiInsights.warnings,
          nextSteps: (result.aiInsights as any).nextSteps,
        },
        searchMetadata: result.searchMetadata,
      };
    }),

  saveDiscoveredVendor: publicProcedure
    .input(
      z.object({
        companyName: z.string(),
        website: z.string().optional(),
        businessType: z.string().optional(),
        contactInfo: z.object({
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
        }).optional(),
        certifications: z.array(z.string()).optional(),
        productId: z.string().optional(), // Link to specific product
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if vendor already exists
      const existingVendor = await ctx.db.vendor.findFirst({
        where: {
          name: input.companyName,
        },
      });

      if (existingVendor) {
        return { vendor: existingVendor, created: false };
      }

      // Create new vendor
      const newVendor = await ctx.db.vendor.create({
        data: {
          name: input.companyName,
          email: input.contactInfo?.email || '',
          phone: input.contactInfo?.phone,
          address: input.contactInfo?.address,
          certifications: input.certifications as any || [],
          status: 'UNDER_REVIEW',
        },
      });

      // If product ID provided, create a vendor price record
      if (input.productId) {
        await ctx.db.vendorPrice.create({
          data: {
            productId: input.productId,
            vendorId: newVendor.id,
            price: 0, // To be updated later
            rank: 999, // Unknown rank
          },
        });
      }

      return { vendor: newVendor, created: true };
    }),
});

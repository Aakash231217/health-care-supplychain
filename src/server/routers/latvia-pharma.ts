import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { LatviaPharmaScraperPuppeteer } from '@/lib/latvia-pharma-scraper-puppeteer';
import { VendorResearcher } from '@/lib/vendor-researcher';
import { TRPCError } from '@trpc/server';

export const latviaPharmaRouter = router({
  // Scrape and sync data from Latvia registry
  syncLatviaData: publicProcedure
    .input(
      z.object({
        pageSize: z.number().min(10).max(100).optional().default(50),
        maxPages: z.number().min(1).max(100).optional().default(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Use Puppeteer scraper for dynamic content
        console.log('🚀 Using PUPPETEER scraper for dynamic content');
        const scraper = new LatviaPharmaScraperPuppeteer();

        console.log(`Starting Latvia pharma data sync with Puppeteer`);

        // Use the browser-based scraper
        const result = await scraper.scrapeWithBrowser();
        
        console.log(`✅ Puppeteer scraper completed: ${result.totalRecords} records found`);

        // Batch upsert data to database
        const batchSize = 50;
        let upsertedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < result.data.length; i += batchSize) {
          const batch = result.data.slice(i, i + batchSize);
          
          try {
            // Use transaction for batch operations
            await ctx.db.$transaction(
              batch.map((drug) =>
                ctx.db.latviaPharmaRegistry.upsert({
                  where: { registrationNumber: drug.registrationNumber },
                  update: {
                    drugName: drug.drugName,
                    dosageForm: drug.dosageForm,
                    activeIngredient: drug.activeIngredient,
                    manufacturerName: drug.manufacturerName,
                    manufacturerCountry: drug.manufacturerCountry,
                    atcCode: drug.atcCode,
                    issuanceProcedure: drug.issuanceProcedure,
                    wholesalerName: drug.wholesalerName,
                    wholesalerAddress: drug.wholesalerAddress,
                    wholesalerLicense: drug.wholesalerLicense,
                    permitValidity: drug.permitValidity,
                    lastUpdated: new Date(),
                  },
                  create: {
                    drugName: drug.drugName,
                    dosageForm: drug.dosageForm,
                    registrationNumber: drug.registrationNumber,
                    activeIngredient: drug.activeIngredient,
                    manufacturerName: drug.manufacturerName,
                    manufacturerCountry: drug.manufacturerCountry,
                    atcCode: drug.atcCode,
                    issuanceProcedure: drug.issuanceProcedure,
                    wholesalerName: drug.wholesalerName,
                    wholesalerAddress: drug.wholesalerAddress,
                    wholesalerLicense: drug.wholesalerLicense,
                    permitValidity: drug.permitValidity,
                  },
                })
              )
            );
            upsertedCount += batch.length;
          } catch (error) {
            console.error(`Error upserting batch: ${error}`);
            errorCount += batch.length;
          }
        }

        return {
          success: true,
          totalRecords: result.totalRecords,
          syncedRecords: upsertedCount,
          failedRecords: errorCount,
          errors: result.errors,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to sync Latvia data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Search Latvia registry data
  searchLatviaRegistry: publicProcedure
    .input(
      z.object({
        query: z.string().default(''),
        searchType: z.enum(['all', 'drugName', 'atcCode', 'manufacturer', 'wholesaler']).default('all'),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause = input.query ? {
        OR: [] as any[],
      } : {};

      if (input.query) {
        switch (input.searchType) {
          case 'drugName':
            whereClause.OR!.push({ drugName: { contains: input.query, mode: 'insensitive' } });
            break;
          case 'atcCode':
            whereClause.OR!.push({ atcCode: { contains: input.query, mode: 'insensitive' } });
            break;
          case 'manufacturer':
            whereClause.OR!.push({ manufacturerName: { contains: input.query, mode: 'insensitive' } });
            break;
          case 'wholesaler':
            whereClause.OR!.push({ wholesalerName: { contains: input.query, mode: 'insensitive' } });
            break;
          default:
            whereClause.OR = [
              { drugName: { contains: input.query, mode: 'insensitive' } },
              { activeIngredient: { contains: input.query, mode: 'insensitive' } },
              { atcCode: { contains: input.query, mode: 'insensitive' } },
              { manufacturerName: { contains: input.query, mode: 'insensitive' } },
              { wholesalerName: { contains: input.query, mode: 'insensitive' } },
            ];
        }
      }

      const [results, total] = await Promise.all([
        ctx.db.latviaPharmaRegistry.findMany({
          where: whereClause,
          skip: input.offset,
          take: input.limit,
          orderBy: { drugName: 'asc' },
        }),
        ctx.db.latviaPharmaRegistry.count({ where: whereClause }),
      ]);

      return {
        results,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Get statistics about Latvia registry data
  getLatviaStats: publicProcedure.query(async ({ ctx }) => {
    const [
      totalDrugs,
      manufacturers,
      wholesalers,
      atcCategories,
      lastUpdate,
    ] = await Promise.all([
      ctx.db.latviaPharmaRegistry.count(),
      ctx.db.latviaPharmaRegistry.groupBy({
        by: ['manufacturerName'],
        _count: true,
      }),
      ctx.db.latviaPharmaRegistry.groupBy({
        by: ['wholesalerName'],
        _count: true,
      }),
      ctx.db.$queryRaw<{ atc_prefix: string; count: bigint }[]>`
        SELECT LEFT(atc_code, 1) as atc_prefix, COUNT(*) as count
        FROM "LatviaPharmaRegistry"
        GROUP BY LEFT(atc_code, 1)
        ORDER BY atc_prefix
      `,
      ctx.db.latviaPharmaRegistry.findFirst({
        orderBy: { lastUpdated: 'desc' },
        select: { lastUpdated: true },
      }),
    ]);

    return {
      totalDrugs,
      totalManufacturers: manufacturers.length,
      totalWholesalers: wholesalers.length,
      topManufacturers: manufacturers
        .sort((a: any, b: any) => b._count - a._count)
        .slice(0, 10)
        .map((m: any) => ({
          name: m.manufacturerName,
          count: m._count,
        })),
      topWholesalers: wholesalers
        .sort((a: any, b: any) => b._count - a._count)
        .slice(0, 10)
        .map((w: any) => ({
          name: w.wholesalerName,
          count: w._count,
        })),
      atcDistribution: atcCategories.map((cat: any) => ({
        category: cat.atc_prefix,
        count: Number(cat.count),
        name: getATCCategoryName(cat.atc_prefix),
      })),
      lastUpdated: lastUpdate?.lastUpdated || null,
    };
  }),

  // Get drug details by registration number
  getDrugByRegistration: publicProcedure
    .input(
      z.object({
        registrationNumber: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const drug = await ctx.db.latviaPharmaRegistry.findUnique({
        where: { registrationNumber: input.registrationNumber },
      });

      if (!drug) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Drug not found',
        });
      }

      return drug;
    }),

  // Find suppliers for products from Excel sheet
  findSuppliersForProduct: publicProcedure
    .input(
      z.object({
        activeSubstance: z.string(),
        pharmaceuticalForm: z.string().optional(),
        concentration: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Build search criteria
      const whereConditions: Array<any> = [
        // Exact match on active ingredient
        { activeIngredient: { equals: input.activeSubstance, mode: 'insensitive' as const } },
        // Partial match on active ingredient
        { activeIngredient: { contains: input.activeSubstance, mode: 'insensitive' as const } },
      ];

      // If pharmaceutical form is provided, add it to search
      if (input.pharmaceuticalForm) {
        whereConditions.push({
          AND: [
            { activeIngredient: { contains: input.activeSubstance, mode: 'insensitive' as const } },
            { dosageForm: { contains: input.pharmaceuticalForm, mode: 'insensitive' as const } }
          ]
        });
      }

      // Search Latvia registry
      const matches = await ctx.db.latviaPharmaRegistry.findMany({
        where: { OR: whereConditions },
        take: 20,
        orderBy: [
          // Prioritize exact matches
          { activeIngredient: 'asc' },
          { drugName: 'asc' }
        ],
      });

      // Group by supplier to avoid duplicates
      const supplierMap = new Map<string, {
        wholesalerName: string;
        wholesalerAddress: string;
        wholesalerLicense: string;
        manufacturerName: string;
        manufacturerCountry: string;
        products: Array<{
          drugName: string;
          dosageForm: string;
          concentration: string;
          registrationNumber: string;
          atcCode: string;
        }>;
      }>();
      
      matches.forEach((match: any) => {
        const key = `${match.wholesalerName}-${match.wholesalerAddress}`;
        if (!supplierMap.has(key)) {
          supplierMap.set(key, {
            wholesalerName: match.wholesalerName,
            wholesalerAddress: match.wholesalerAddress,
            wholesalerLicense: match.wholesalerLicense,
            manufacturerName: match.manufacturerName,
            manufacturerCountry: match.manufacturerCountry,
            products: []
          });
        }
        
        supplierMap.get(key)!.products.push({
          drugName: match.drugName,
          dosageForm: match.dosageForm,
          concentration: extractConcentration(match.drugName),
          registrationNumber: match.registrationNumber,
          atcCode: match.atcCode,
        });
      });

      return {
        suppliers: Array.from(supplierMap.values()),
        totalMatches: matches.length,
      };
    }),

  // Match multiple products from Excel with Latvia registry
  matchExcelProductsWithSuppliers: publicProcedure
    .input(
      z.object({
        products: z.array(z.object({
          sku: z.string(),
          activeSubstance: z.string(),
          pharmaceuticalForm: z.string().optional(),
          concentration: z.string().optional(),
        })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = [];
      
      for (const product of input.products) {
        // Search for matches
        const matches = await ctx.db.latviaPharmaRegistry.findMany({
          where: {
            OR: [
              { activeIngredient: { equals: product.activeSubstance, mode: 'insensitive' } },
              { activeIngredient: { contains: product.activeSubstance, mode: 'insensitive' } },
            ]
          },
          take: 10,
        });

        // Extract unique suppliers and get their email from vendor table
        const suppliers = new Map<string, any>();
        
        for (const match of matches) {
          const key = match.wholesalerName;
          if (!suppliers.has(key)) {
            // Clean the wholesaler name - remove quotes if present
            const cleanWholesalerName = match.wholesalerName
              .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
              .trim();
            
            // Debug log
            console.log(`Looking up vendor for: "${cleanWholesalerName}" (original: "${match.wholesalerName}")`);
            
            // Look up vendor by name to get email - prefer vendors with real emails
            let vendor = await ctx.db.vendor.findFirst({
              where: {
                AND: [
                  {
                    OR: [
                      { name: { equals: cleanWholesalerName } },
                      { name: { equals: match.wholesalerName } },
                      { name: { equals: cleanWholesalerName, mode: 'insensitive' } }, // Add case-insensitive exact match
                      { name: { contains: cleanWholesalerName, mode: 'insensitive' } },
                      { name: { startsWith: cleanWholesalerName, mode: 'insensitive' } },
                    ],
                  },
                  {
                    NOT: {
                      email: { endsWith: '@pharma.lv' }
                    }
                  }
                ]
              },
              select: {
                email: true,
                name: true,
              },
            });

            // If no match, try with cleaned name (remove quotes, special chars)
            if (!vendor) {
              const cleanName = match.wholesalerName
                .replace(/['"]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
              
              // Also try with underscore instead of space (Magnum_Medical pattern)
              const underscoreName = cleanName.replace(/\s+/g, '_');
              
              vendor = await ctx.db.vendor.findFirst({
                where: {
                  AND: [
                    {
                      OR: [
                        { name: { contains: cleanName, mode: 'insensitive' } },
                        { name: { equals: underscoreName, mode: 'insensitive' } },
                        { name: { contains: cleanName.split(' ')[0], mode: 'insensitive' } },
                      ],
                    },
                    {
                      NOT: {
                        email: { endsWith: '@pharma.lv' }
                      }
                    }
                  ]
                },
                select: {
                  email: true,
                  name: true,
                },
              });
              
              // If still no vendor with real email, try to get any vendor
              if (!vendor) {
                vendor = await ctx.db.vendor.findFirst({
                  where: {
                    OR: [
                      { name: { contains: cleanName, mode: 'insensitive' } },
                      { name: { equals: underscoreName, mode: 'insensitive' } },
                      { name: { contains: cleanName.split(' ')[0], mode: 'insensitive' } },
                    ],
                  },
                  orderBy: {
                    email: 'desc' // This will prioritize non-pharma.lv emails
                  },
                  select: {
                    email: true,
                    name: true,
                  },
                });
              }
            }
            
            // Debug log result
            if (vendor) {
              console.log(`Found vendor: ${vendor.name} with email: ${vendor.email}`);
            } else {
              console.log(`No vendor found for: "${match.wholesalerName}"`);
            }
            
            suppliers.set(key, {
              name: match.wholesalerName,
              address: match.wholesalerAddress,
              license: match.wholesalerLicense,
              email: vendor?.email || undefined,
              matchedProducts: []
            });
          }
          suppliers.get(key)!.matchedProducts.push({
            drugName: match.drugName,
            registrationNumber: match.registrationNumber,
          });
        }

        results.push({
          sku: product.sku,
          activeSubstance: product.activeSubstance,
          matchesFound: matches.length,
          suppliers: Array.from(suppliers.values()),
        });
      }

      return {
        processedProducts: results.length,
        results,
      };
    }),

  // Get all products (simple query for debugging)
  getAllProducts: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const products = await ctx.db.latviaPharmaRegistry.findMany({
          take: 100,
          orderBy: { drugName: 'asc' },
        });
        
        return {
          products,
          total: products.length,
        };
      } catch (error) {
        console.error('Error fetching products:', error);
        return {
          products: [],
          total: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Get all products supplied by a specific wholesaler
  getProductsByWholesaler: publicProcedure
    .input(
      z.object({
        wholesalerName: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.latviaPharmaRegistry.findMany({
        where: {
          wholesalerName: input.wholesalerName,
        },
        orderBy: [
          { atcCode: 'asc' },
          { drugName: 'asc' },
        ],
      });

      return {
        products,
        total: products.length,
      };
    }),

  // Research a wholesaler from Latvia registry
  researchLatviaWholesaler: publicProcedure
    .input(
      z.object({
        wholesalerName: z.string(),
        wholesalerAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`🔍 Researching Latvia wholesaler: ${input.wholesalerName}`);

        // Check if this wholesaler already exists as a vendor
        let vendor = await ctx.db.vendor.findFirst({
          where: {
            name: {
              contains: input.wholesalerName,
              mode: 'insensitive',
            },
          },
        });

        // If not exists, create vendor from Latvia data
        if (!vendor) {
          console.log('  → Creating new vendor from Latvia data...');
          
          // Get sample product to extract more info
          const sampleProduct = await ctx.db.latviaPharmaRegistry.findFirst({
            where: { wholesalerName: input.wholesalerName },
          });

          vendor = await ctx.db.vendor.create({
            data: {
              name: input.wholesalerName,
              email: `contact@${input.wholesalerName.toLowerCase().replace(/\s+/g, '')}.com`, // Placeholder
              address: input.wholesalerAddress || sampleProduct?.wholesalerAddress,
              status: 'ACTIVE',
              specializations: ['Pharmaceutical Wholesale'],
              certifications: sampleProduct?.wholesalerLicense ? [sampleProduct.wholesalerLicense] : [],
            },
          });
        }

        // Perform research
        const researcher = new VendorResearcher();
        const intelligenceData = await researcher.researchVendor({
          vendorName: input.wholesalerName,
          country: 'Latvia',
          existingWebsite: undefined,
        });

        // Save intelligence
        const intelligence = await ctx.db.vendorIntelligence.upsert({
          where: { vendorId: vendor.id },
          create: {
            vendorId: vendor.id,
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

        // Get product count for this wholesaler
        const productCount = await ctx.db.latviaPharmaRegistry.count({
          where: { wholesalerName: input.wholesalerName },
        });

        return {
          vendor,
          intelligence,
          productCount,
          message: 'Wholesaler research completed',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to research wholesaler: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Get unique wholesalers from Latvia registry with stats
  getWholesalersList: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get wholesalers grouped with product counts
      const wholesalers = await ctx.db.latviaPharmaRegistry.groupBy({
        by: ['wholesalerName', 'wholesalerAddress', 'wholesalerLicense'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        skip: input.offset,
        take: input.limit,
      });

      const total = await ctx.db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT wholesaler_name) as count
        FROM "LatviaPharmaRegistry"
      `;

      // Check which wholesalers have been researched
      const wholesalersWithIntelligence = await Promise.all(
        wholesalers.map(async (w) => {
          // Try to find existing vendor
          const vendor = await ctx.db.vendor.findFirst({
            where: {
              name: {
                contains: w.wholesalerName,
                mode: 'insensitive',
              },
            },
            include: {
              intelligence: true,
            },
          });

          return {
            wholesalerName: w.wholesalerName,
            wholesalerAddress: w.wholesalerAddress,
            wholesalerLicense: w.wholesalerLicense,
            productCount: w._count.id,
            vendor: vendor
              ? {
                  id: vendor.id,
                  name: vendor.name,
                  status: vendor.status,
                }
              : null,
            intelligence: vendor?.intelligence || null,
            hasBeenResearched: !!vendor?.intelligence,
          };
        })
      );

      return {
        wholesalers: wholesalersWithIntelligence,
        total: Number(total[0].count),
        hasMore: input.offset + input.limit < Number(total[0].count),
      };
    }),
});

// Helper function to extract concentration from drug name
function extractConcentration(drugName: string): string {
  // Common concentration patterns
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:mg|mcg|μg|g|ml|l|iu|u)(?:\/\d*(?:\.\d+)?\s*(?:mg|ml|l))?/gi,
    /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*(?:mg|ml|l)/gi,
    /(\d+(?:\.\d+)?)\s*%/gi,
    /(\d+(?:\.\d+)?)\s*(?:mg|mcg|μg)\/\d*(?:\.\d+)?\s*ml/gi,
  ];

  for (const pattern of patterns) {
    const match = drugName.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return '';
}

function getATCCategoryName(code: string): string {
  const categories: Record<string, string> = {
    A: 'Alimentary tract and metabolism',
    B: 'Blood and blood forming organs',
    C: 'Cardiovascular system',
    D: 'Dermatologicals',
    G: 'Genito-urinary system and sex hormones',
    H: 'Systemic hormonal preparations',
    J: 'Antiinfectives for systemic use',
    L: 'Antineoplastic and immunomodulating agents',
    M: 'Musculo-skeletal system',
    N: 'Nervous system',
    P: 'Antiparasitic products',
    R: 'Respiratory system',
    S: 'Sensory organs',
    V: 'Various',
  };

  return categories[code] || 'Unknown';
}

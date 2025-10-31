import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { PharmaceuticalExcelParser } from '@/lib/pharma-excel-parser';
import path from 'path';
import fs from 'fs';
import { ImportType, ImportStatus } from '@prisma/client';

export const importRouter = router({
  uploadPharmaceuticalExcel: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileContent: z.string(), // Base64 encoded file content
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create import batch record
      const importBatch = await ctx.db.importBatch.create({
        data: {
          fileName: input.fileName,
          importType: ImportType.PHARMACEUTICAL_EXCEL,
          totalRecords: 0,
          successRecords: 0,
          failedRecords: 0,
          importedBy: 'system', // In a real app, this would be the current user
          status: ImportStatus.PROCESSING,
        },
      });

      try {
        // Save file temporarily in /tmp directory (writable in serverless)
        const tempDir = '/tmp';
        // Create a subdirectory for our uploads if it doesn't exist
        const uploadDir = path.join(tempDir, 'healthcare-uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const tempFilePath = path.join(uploadDir, `upload_${Date.now()}_${input.fileName}`);
        const fileBuffer = Buffer.from(input.fileContent, 'base64');
        fs.writeFileSync(tempFilePath, fileBuffer);

        // Check if file needs chunked processing
        const parser = new PharmaceuticalExcelParser(tempFilePath);
        const fileInfo = await parser.needsChunkedProcessing();
        
        console.log(`Processing file: ${input.fileName}, Size: ${fileInfo.fileSize.toFixed(2)}MB, Estimated rows: ${fileInfo.estimatedRows}`);
        
        let successCount = 0;
        let failureCount = 0;
        let totalErrors: string[] = [];
        
        // Process file based on size
        if (fileInfo.recommendChunking) {
          // Process large files in chunks
          console.log('Using chunked processing for large file');
          
          await parser.parseChunked(async (chunk) => {
            console.log(`Processing chunk: ${chunk.products.length} products, Progress: ${chunk.progress.toFixed(1)}%`);
            totalErrors.push(...chunk.errors);
            
            // Process products in this chunk with batch operations
            const batchSize = 10; // Process 10 products at a time
            for (let i = 0; i < chunk.products.length; i += batchSize) {
              const batch = chunk.products.slice(i, i + batchSize);
              
              // Process batch in parallel
              const results = await Promise.all(
                batch.map(async (product, idx) => {
                  try {
                    return await processProduct(ctx, product, importBatch.id, i + idx);
                  } catch (error) {
                    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
                  }
                })
              );
              
              // Count successes and failures
              results.forEach(result => {
                if (result.success) {
                  successCount++;
                } else {
                  failureCount++;
                }
              });
            }
            
            // Update progress periodically
            if (chunk.progress % 10 === 0) {
              await ctx.db.importBatch.update({
                where: { id: importBatch.id },
                data: {
                  totalRecords: fileInfo.estimatedRows,
                  successRecords: successCount,
                  failedRecords: failureCount,
                },
              });
            }
          });
        } else {
          // Process smaller files normally
          const { transformedProducts, errors } = await parser.parse();
          totalErrors = errors;
          
          // Process each product
          for (let i = 0; i < transformedProducts.length; i++) {
            const product = transformedProducts[i];
          
          try {
            // Check if product already exists
            const existingProduct = await ctx.db.product.findUnique({
              where: { sku: product.sku },
            });

            if (existingProduct) {
              // Update existing product
              const updatedProduct = await ctx.db.product.update({
                where: { sku: product.sku },
                data: {
                  name: product.name,
                  description: product.description,
                  category: product.category,
                  unitOfMeasure: product.unitOfMeasure,
                  activeSubstance: product.activeSubstance,
                  pharmaceuticalForm: product.pharmaceuticalForm,
                  concentration: product.concentration,
                  quantityRequired: product.quantityRequired,
                  updatedAt: new Date(),
                },
              });

              // Update vendor prices
              await updateVendorPrices(ctx.db, updatedProduct.id, product.vendors);
              
              await ctx.db.importedProduct.create({
                data: {
                  batchId: importBatch.id,
                  productId: updatedProduct.id,
                  rowNumber: i + 2,
                  rawData: product as any,
                  status: 'UPDATED',
                },
              });
              
              successCount++;
            } else {
              // Create new product
              const newProduct = await ctx.db.product.create({
                data: {
                  sku: product.sku,
                  name: product.name,
                  description: product.description,
                  category: product.category,
                  unitOfMeasure: product.unitOfMeasure,
                  activeSubstance: product.activeSubstance,
                  pharmaceuticalForm: product.pharmaceuticalForm,
                  concentration: product.concentration,
                  quantityRequired: product.quantityRequired,
                  status: 'ACTIVE',
                },
              });

              // Create vendor prices
              await updateVendorPrices(ctx.db, newProduct.id, product.vendors);
              
              await ctx.db.importedProduct.create({
                data: {
                  batchId: importBatch.id,
                  productId: newProduct.id,
                  rowNumber: i + 2,
                  rawData: product as any,
                  status: 'SUCCESS',
                },
              });
              
              successCount++;
            }
          } catch (error) {
            failureCount++;
            await ctx.db.importedProduct.create({
              data: {
                batchId: importBatch.id,
                rowNumber: i + 2,
                rawData: product as any,
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            });
          }
          }
        }
        
        // Update import batch with results
        await ctx.db.importBatch.update({
          where: { id: importBatch.id },
          data: {
            totalRecords: successCount + failureCount,
            successRecords: successCount,
            failedRecords: failureCount,
            errors: totalErrors.length > 0 ? totalErrors : undefined,
            status: ImportStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        return {
          success: true,
          batchId: importBatch.id,
          totalRecords: successCount + failureCount,
          successRecords: successCount,
          failedRecords: failureCount,
          errors: totalErrors.slice(0, 10), // Return first 10 errors
        };
        
      } catch (error) {
        // Update import batch with error
        await ctx.db.importBatch.update({
          where: { id: importBatch.id },
          data: {
            status: ImportStatus.FAILED,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            completedAt: new Date(),
          },
        });

        throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  getImportHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const [batches, total] = await Promise.all([
        ctx.db.importBatch.findMany({
          orderBy: { startedAt: 'desc' },
          skip: input.offset,
          take: input.limit,
          include: {
            _count: {
              select: { importedProducts: true },
            },
          },
        }),
        ctx.db.importBatch.count(),
      ]);

      return {
        batches,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  getImportDetails: publicProcedure
    .input(
      z.object({
        batchId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const batch = await ctx.db.importBatch.findUnique({
        where: { id: input.batchId },
        include: {
          importedProducts: {
            include: {
              product: true,
            },
            orderBy: { rowNumber: 'asc' },
          },
        },
      });

      if (!batch) {
        throw new Error('Import batch not found');
      }

      return batch;
    }),
});

// Helper function to process a single product
async function processProduct(
  ctx: any,
  product: any,
  batchId: string,
  rowNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if product already exists
    const existingProduct = await ctx.db.product.findUnique({
      where: { sku: product.sku },
    });

    if (existingProduct) {
      // Update existing product
      const updatedProduct = await ctx.db.product.update({
        where: { sku: product.sku },
        data: {
          name: product.name,
          description: product.description,
          category: product.category,
          unitOfMeasure: product.unitOfMeasure,
          activeSubstance: product.activeSubstance,
          pharmaceuticalForm: product.pharmaceuticalForm,
          concentration: product.concentration,
          quantityRequired: product.quantityRequired,
          updatedAt: new Date(),
        },
      });

      // Update vendor prices
      await updateVendorPrices(ctx.db, updatedProduct.id, product.vendors);
      
      await ctx.db.importedProduct.create({
        data: {
          batchId,
          productId: updatedProduct.id,
          rowNumber: rowNumber + 2,
          rawData: product as any,
          status: 'UPDATED',
        },
      });
      
      return { success: true };
    } else {
      // Create new product
      const newProduct = await ctx.db.product.create({
        data: {
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: product.category,
          unitOfMeasure: product.unitOfMeasure,
          activeSubstance: product.activeSubstance,
          pharmaceuticalForm: product.pharmaceuticalForm,
          concentration: product.concentration,
          quantityRequired: product.quantityRequired,
          status: 'ACTIVE',
        },
      });

      // Create vendor prices
      await updateVendorPrices(ctx.db, newProduct.id, product.vendors);
      
      await ctx.db.importedProduct.create({
        data: {
          batchId,
          productId: newProduct.id,
          rowNumber: rowNumber + 2,
          rawData: product as any,
          status: 'SUCCESS',
        },
      });
      
      return { success: true };
    }
  } catch (error) {
    await ctx.db.importedProduct.create({
      data: {
        batchId,
        rowNumber: rowNumber + 2,
        rawData: product as any,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper function to update vendor prices
async function updateVendorPrices(
  db: any,
  productId: string,
  vendors: Array<{ name: string; price: number; rank: number }>
) {
  // Process each vendor
  for (const vendorInfo of vendors) {
    // Find or create vendor
    let vendor = await db.vendor.findFirst({
      where: { name: vendorInfo.name },
    });

    if (!vendor) {
      // Create vendor with minimal info
      vendor = await db.vendor.create({
        data: {
          name: vendorInfo.name,
          email: `${vendorInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}@vendor.com`,
          status: 'ACTIVE',
        },
      });
    }

    // Check if vendor price already exists
    const existingPrice = await db.vendorPrice.findUnique({
      where: {
        productId_vendorId_rank: {
          productId,
          vendorId: vendor.id,
          rank: vendorInfo.rank,
        },
      },
    });

    if (existingPrice) {
      // Update existing price if different
      if (existingPrice.price !== vendorInfo.price) {
        // Mark old price as expired
        await db.vendorPrice.update({
          where: { id: existingPrice.id },
          data: { validTo: new Date() },
        });

        // Create new price record
        await db.vendorPrice.create({
          data: {
            productId,
            vendorId: vendor.id,
            price: vendorInfo.price,
            rank: vendorInfo.rank,
          },
        });
      }
    } else {
      // Create new vendor price
      await db.vendorPrice.create({
        data: {
          productId,
          vendorId: vendor.id,
          price: vendorInfo.price,
          rank: vendorInfo.rank,
        },
      });
    }
  }
}

import * as XLSX from 'xlsx';
import { z } from 'zod';
import fs from 'fs';

// Configuration for chunked processing
const CHUNK_SIZE = 100; // Process 100 rows at a time
const MAX_COLUMNS_TO_PROCESS = 50; // Only process first 50 columns for performance

// Define the schema for pharmaceutical product data - more flexible for large files
export const PharmaceuticalProductSchema = z.object({
  'Nr.p.k.': z.number().optional(),
  'Active substance': z.string().optional(),
  'Pharmaceutical form': z.string().optional(),
  'Concentration': z.string().optional(),
  'Unit': z.string().optional(),
  'Quantity for 3 years': z.number().optional(),
  'Wogen_Pharm': z.number().optional(),
  '1. First hand': z.string().optional(),
  '1. price ': z.number().optional(),
  '2. Second hand': z.string().optional(),
  '2. price': z.number().optional(),
  '3. Third hand': z.string().optional(),
  '3. price': z.number().optional(),
}).passthrough(); // Allow additional columns without validation errors

export type PharmaceuticalProduct = z.infer<typeof PharmaceuticalProductSchema>;

// Transformed product format for database
export interface TransformedProduct {
  sku: string;
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  unitOfMeasure: string;
  activeSubstance: string;
  pharmaceuticalForm: string;
  concentration: string;
  quantityRequired: number;
  vendors: VendorInfo[];
}

export interface VendorInfo {
  name: string;
  price: number;
  rank: number;
}

export interface ParseOptions {
  chunkSize?: number;
  startRow?: number;
  endRow?: number;
  maxColumns?: number;
}

export class PharmaceuticalExcelParser {
  private filePath: string;
  private chunkSize: number;

  constructor(filePath: string, chunkSize: number = CHUNK_SIZE) {
    this.filePath = filePath;
    this.chunkSize = chunkSize;
  }

  /**
   * Parse pharmaceutical Excel file with chunking for large files
   */
  async parse(options?: ParseOptions): Promise<{
    rawProducts: PharmaceuticalProduct[];
    transformedProducts: TransformedProduct[];
    errors: string[];
    totalRows: number;
    processedRows: number;
  }> {
    const errors: string[] = [];
    const rawProducts: PharmaceuticalProduct[] = [];
    const startRow = options?.startRow || 0;
    const endRow = options?.endRow;
    
    try {
      const fileBuffer = fs.readFileSync(this.filePath);
      // Use streaming mode for large files
      const workbook = XLSX.read(fileBuffer, { 
        type: 'buffer',
        sheetStubs: true, // Include empty cells
        cellDates: true
      });
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get sheet range for total row count
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const totalRows = range.e.r + 1; // End row + 1
      
      // Convert to JSON with chunking
      const effectiveEndRow = endRow || Math.min(startRow + this.chunkSize, totalRows);
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        range: startRow,
        header: 1, // Use array format first to handle many columns
        defval: '', // Default value for empty cells
      });
      
      // Get headers from first row if starting from beginning
      let headers: string[] = [];
      if (startRow === 0 && rawData.length > 0) {
        headers = (rawData[0] as any[]).slice(0, options?.maxColumns || MAX_COLUMNS_TO_PROCESS);
        rawData.shift(); // Remove header row
      }
      
      // Process rows in current chunk
      const rowsToProcess = rawData.slice(0, effectiveEndRow - startRow);
      
      rowsToProcess.forEach((row: any, index: number) => {
        try {
          // Convert array to object using headers
          const rowObj: any = {};
          if (headers.length > 0) {
            headers.forEach((header, colIndex) => {
              if (header && row[colIndex] !== undefined) {
                rowObj[header] = row[colIndex];
              }
            });
          }
          
          // Only validate if we have required fields
          if (rowObj['Active substance'] || rowObj['Pharmaceutical form']) {
            const parsedProduct = PharmaceuticalProductSchema.parse(rowObj);
            rawProducts.push(parsedProduct);
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            const rowErrors = error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
            errors.push(`Row ${startRow + index + 2}: ${rowErrors}`);
          }
        }
      });
      
      // Transform products to our database format
      const transformedProducts = this.transformProducts(rawProducts);
      
      return {
        rawProducts,
        transformedProducts,
        errors,
        totalRows: totalRows - 1, // Exclude header
        processedRows: effectiveEndRow - startRow
      };
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform raw pharmaceutical data to database format
   */
  private transformProducts(rawProducts: PharmaceuticalProduct[]): TransformedProduct[] {
    return rawProducts
      .filter(raw => raw['Active substance'] || raw['Pharmaceutical form']) // Filter out empty rows
      .map((raw, index) => {
      // Generate SKU from row number and active substance
      const sku = `PHARMA-${String(raw['Nr.p.k.'] || index + 1).padStart(4, '0')}`;
      
      // Create name from active substance and form (handle optional fields)
      const activeSubstance = raw['Active substance'] || 'Unknown';
      const pharmaForm = raw['Pharmaceutical form'] || 'Unknown Form';
      const name = `${activeSubstance.trim()} - ${pharmaForm}`;
      
      // Build description
      const concentration = raw['Concentration'] || '';
      const description = `${activeSubstance} ${concentration} - ${pharmaForm}`.trim();
      
      // Determine category based on pharmaceutical form
      const category = this.categorizeByForm(pharmaForm);
      
      // Extract vendor information
      const vendors: VendorInfo[] = [];
      
      if (raw['1. First hand'] && raw['1. price ']) {
        vendors.push({
          name: raw['1. First hand'],
          price: raw['1. price '],
          rank: 1
        });
      }
      
      if (raw['2. Second hand'] && raw['2. price']) {
        vendors.push({
          name: raw['2. Second hand'],
          price: raw['2. price'],
          rank: 2
        });
      }
      
      if (raw['3. Third hand'] && raw['3. price']) {
        vendors.push({
          name: raw['3. Third hand'],
          price: raw['3. price'],
          rank: 3
        });
      }
      
      return {
        sku,
        name,
        description,
        category,
        unitOfMeasure: raw['Unit'] || 'unit',
        activeSubstance: activeSubstance,
        pharmaceuticalForm: pharmaForm,
        concentration: concentration || 'N/A',
        quantityRequired: raw['Quantity for 3 years'] || 0,
        vendors
      };
    });
  }

  /**
   * Categorize products based on pharmaceutical form
   */
  private categorizeByForm(form: string): string {
    const formLower = form.toLowerCase();
    
    if (formLower.includes('tabletes') || formLower.includes('kapsulas')) {
      return 'Solid Dosage Forms';
    } else if (formLower.includes('šķīdums') || formLower.includes('sīrups')) {
      return 'Liquid Dosage Forms';
    } else if (formLower.includes('gēls') || formLower.includes('ziede') || formLower.includes('krēms')) {
      return 'Semi-Solid Dosage Forms';
    } else if (formLower.includes('injekcija')) {
      return 'Injectable Forms';
    } else if (formLower.includes('aerosols') || formLower.includes('izsmidzin')) {
      return 'Inhalation Forms';
    } else {
      return 'Other Dosage Forms';
    }
  }

  /**
   * Get summary statistics
   */
  async getSummary(): Promise<{
    totalProducts: number;
    categories: { [key: string]: number };
    vendors: string[];
    totalQuantityRequired: number;
    priceRange: { min: number; max: number };
  }> {
    const { transformedProducts } = await this.parse();
    
    const categories: { [key: string]: number } = {};
    const vendorsSet = new Set<string>();
    let totalQuantity = 0;
    let minPrice = Infinity;
    let maxPrice = 0;
    
    transformedProducts.forEach(product => {
      // Count by category
      categories[product.category] = (categories[product.category] || 0) + 1;
      
      // Collect vendors
      product.vendors.forEach(v => vendorsSet.add(v.name));
      
      // Sum quantities
      totalQuantity += product.quantityRequired;
      
      // Track price range
      product.vendors.forEach(v => {
        if (v.price < minPrice) minPrice = v.price;
        if (v.price > maxPrice) maxPrice = v.price;
      });
    });
    
    return {
      totalProducts: transformedProducts.length,
      categories,
      vendors: Array.from(vendorsSet),
      totalQuantityRequired: totalQuantity,
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice
      }
    };
  }

  /**
   * Check if file needs chunked processing
   */
  async needsChunkedProcessing(): Promise<{
    fileSize: number;
    estimatedRows: number;
    recommendChunking: boolean;
  }> {
    const stats = fs.statSync(this.filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    // Quick peek at the file to estimate rows
    const fileBuffer = fs.readFileSync(this.filePath);
    const workbook = XLSX.read(fileBuffer, { 
      type: 'buffer',
      sheetStubs: true,
      sheetRows: 5 // Only read first 5 rows for estimation
    });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const estimatedRows = range.e.r + 1;
    
    // Recommend chunking for files > 10MB or > 1000 rows
    const recommendChunking = fileSizeMB > 10 || estimatedRows > 1000;
    
    return {
      fileSize: fileSizeMB,
      estimatedRows,
      recommendChunking
    };
  }

  /**
   * Parse large files in chunks with callback
   */
  async parseChunked(
    onChunkProcessed: (chunk: {
      products: TransformedProduct[];
      errors: string[];
      progress: number;
    }) => Promise<void>
  ): Promise<{
    totalProducts: number;
    totalErrors: number;
  }> {
    const fileInfo = await this.needsChunkedProcessing();
    let currentRow = 0;
    let totalProducts = 0;
    let totalErrors = 0;
    
    while (currentRow < fileInfo.estimatedRows) {
      const result = await this.parse({
        startRow: currentRow,
        endRow: currentRow + this.chunkSize
      });
      
      totalProducts += result.transformedProducts.length;
      totalErrors += result.errors.length;
      
      const progress = Math.min(100, (currentRow / fileInfo.estimatedRows) * 100);
      
      await onChunkProcessed({
        products: result.transformedProducts,
        errors: result.errors,
        progress
      });
      
      currentRow += this.chunkSize;
      
      // Add small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return {
      totalProducts,
      totalErrors
    };
  }
}

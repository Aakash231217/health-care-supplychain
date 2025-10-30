import * as XLSX from 'xlsx';
import { z } from 'zod';
import fs from 'fs';

// Define the schema for pharmaceutical product data
export const PharmaceuticalProductSchema = z.object({
  'Nr.p.k.': z.number().optional(),
  'Active substance': z.string(),
  'Pharmaceutical form': z.string(),
  'Concentration': z.string(),
  'Unit': z.string(),
  'Quantity for 3 years': z.number(),
  'Wogen_Pharm': z.number().optional(),
  '1. First hand': z.string().optional(),
  '1. price ': z.number().optional(),
  '2. Second hand': z.string().optional(),
  '2. price': z.number().optional(),
  '3. Third hand': z.string().optional(),
  '3. price': z.number().optional(),
});

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

export class PharmaceuticalExcelParser {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Parse pharmaceutical Excel file
   */
  async parse(): Promise<{
    rawProducts: PharmaceuticalProduct[];
    transformedProducts: TransformedProduct[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const rawProducts: PharmaceuticalProduct[] = [];
    
    try {
      const fileBuffer = fs.readFileSync(this.filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      
      // Parse each row
      rawData.forEach((row: any, index: number) => {
        try {
          const parsedProduct = PharmaceuticalProductSchema.parse(row);
          rawProducts.push(parsedProduct);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const rowErrors = error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
            errors.push(`Row ${index + 2}: ${rowErrors}`);
          }
        }
      });
      
      // Transform products to our database format
      const transformedProducts = this.transformProducts(rawProducts);
      
      return {
        rawProducts,
        transformedProducts,
        errors
      };
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform raw pharmaceutical data to database format
   */
  private transformProducts(rawProducts: PharmaceuticalProduct[]): TransformedProduct[] {
    return rawProducts.map((raw, index) => {
      // Generate SKU from row number and active substance
      const sku = `PHARMA-${String(raw['Nr.p.k.'] || index + 1).padStart(4, '0')}`;
      
      // Create name from active substance and form
      const name = `${raw['Active substance'].trim()} - ${raw['Pharmaceutical form']}`;
      
      // Build description
      const description = `${raw['Active substance']} ${raw['Concentration']} - ${raw['Pharmaceutical form']}`;
      
      // Determine category based on pharmaceutical form
      const category = this.categorizeByForm(raw['Pharmaceutical form']);
      
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
        unitOfMeasure: raw['Unit'],
        activeSubstance: raw['Active substance'],
        pharmaceuticalForm: raw['Pharmaceutical form'],
        concentration: raw['Concentration'],
        quantityRequired: raw['Quantity for 3 years'],
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
}

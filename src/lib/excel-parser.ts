import * as XLSX from 'xlsx';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Define the expected schema for product data from Excel
export const ExcelProductSchema = z.object({
  SKU: z.union([z.string(), z.number()]).transform(val => String(val)),
  Name: z.string(),
  Description: z.string().optional().default(''),
  Category: z.string(),
  SubCategory: z.string().optional(),
  UnitOfMeasure: z.string().default('EA'),
  ReorderPoint: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  LeadTime: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  Price: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  Vendor: z.string().optional(),
});

export type ExcelProduct = z.infer<typeof ExcelProductSchema>;

export class ExcelParser {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Parse Excel file and return structured data
   */
  async parse(): Promise<{
    products: ExcelProduct[];
    rawData: any[];
    errors: string[];
    sheetNames: string[];
  }> {
    const errors: string[] = [];
    const products: ExcelProduct[] = [];
    
    try {
      // Read the Excel file
      const fileBuffer = fs.readFileSync(this.filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      // Get sheet names
      const sheetNames = workbook.SheetNames;
      
      // Process the first sheet by default
      const worksheet = workbook.Sheets[sheetNames[0]];
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      
      // Parse and validate each row
      rawData.forEach((row: any, index: number) => {
        try {
          const parsedProduct = ExcelProductSchema.parse(row);
          products.push(parsedProduct);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`Row ${index + 2}: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
          }
        }
      });
      
      return {
        products,
        rawData,
        errors,
        sheetNames
      };
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a preview of the Excel file structure
   */
  async preview(): Promise<{
    sheetNames: string[];
    sheetsData: { [key: string]: any[] };
    headers: { [key: string]: string[] };
  }> {
    try {
      const fileBuffer = fs.readFileSync(this.filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      const sheetNames = workbook.SheetNames;
      const sheetsData: { [key: string]: any[] } = {};
      const headers: { [key: string]: string[] } = {};
      
      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        sheetsData[sheetName] = jsonData.slice(0, 5); // Get first 5 rows for preview
        
        // Get headers
        if (jsonData.length > 0 && jsonData[0] && typeof jsonData[0] === 'object') {
          headers[sheetName] = Object.keys(jsonData[0] as Record<string, any>);
        }
      });
      
      return {
        sheetNames,
        sheetsData,
        headers
      };
    } catch (error) {
      throw new Error(`Failed to preview Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert parsed data to format suitable for database insertion
   */
  static toDbFormat(products: ExcelProduct[]) {
    return products.map(product => ({
      sku: product.SKU,
      name: product.Name,
      description: product.Description,
      category: product.Category,
      subCategory: product.SubCategory,
      unitOfMeasure: product.UnitOfMeasure,
      reorderPoint: product.ReorderPoint,
      leadTime: product.LeadTime,
      metadata: {
        price: product.Price,
        vendor: product.Vendor,
      }
    }));
  }
}

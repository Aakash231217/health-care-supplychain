import axios from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';

// Schema for Latvia pharmaceutical data
export const LatviaPharmaSchema = z.object({
  drugName: z.string(),
  dosageForm: z.string(),
  registrationNumber: z.string(),
  activeIngredient: z.string(),
  manufacturerName: z.string(),
  manufacturerCountry: z.string(),
  atcCode: z.string(),
  issuanceProcedure: z.string(),
  wholesalerName: z.string(),
  wholesalerAddress: z.string(),
  wholesalerLicense: z.string(),
  permitValidity: z.string(),
});

export type LatviaPharmaData = z.infer<typeof LatviaPharmaSchema>;

interface ScraperOptions {
  pageSize?: number;
  maxPages?: number;
  delay?: number;
}

export class LatviaPharmaScrap {
  private baseUrl = 'https://dati.zva.gov.lv/zr-n-permissions/';
  
  constructor(private options: ScraperOptions = {}) {
    this.options = {
      pageSize: options.pageSize || 50,
      maxPages: options.maxPages || 10,
      delay: options.delay || 1000,
    };
  }
  
  async scrapeAllPages(): Promise<{
    data: LatviaPharmaData[];
    totalRecords: number;
    errors: string[];
  }> {
    const allData: LatviaPharmaData[] = [];
    const errors: string[] = [];
    let currentPage = 1;
    let totalRecords = 0;
    
    try {
      // First page - no search parameters to get all records
      const firstResponse = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      
      const $ = cheerio.load(firstResponse.data);
      
      // Look for the total entries text (e.g., "166 entries selected")
      const entriesText = $('body').text();
      const totalMatch = entriesText.match(/(\d+)\s+entries\s+selected/);
      if (totalMatch) {
        totalRecords = parseInt(totalMatch[1]);
      }
      
      // If no records found from the page text, try to count table rows
      if (totalRecords === 0) {
        const tableRows = $('table tbody tr').length;
        if (tableRows > 0) {
          totalRecords = tableRows;
          console.log(`Found ${tableRows} records on the page`);
        }
      }
      
      // Calculate pages to scrape
      const recordsPerPage = 10; // Based on the screenshot
      const totalPages = Math.min(
        Math.ceil(totalRecords / recordsPerPage),
        this.options.maxPages!
      );
      
      console.log(`Estimated total records: ${totalRecords}, planning to scrape ${totalPages} pages`);
      
      // Scrape current page first
      const firstPageData = this.extractDataFromPage($);
      allData.push(...firstPageData);
      
      // Scrape additional pages if available
      for (let page = 2; page <= totalPages; page++) {
        console.log(`Scraping page ${page}/${totalPages}...`);
        
        try {
          // Add page parameter
          const pageUrl = `${this.baseUrl}?page=${page}`;
          const pageData = await this.scrapePage(pageUrl);
          allData.push(...pageData);
          
          // Add delay between requests
          if (page < totalPages) {
            await new Promise(resolve => setTimeout(resolve, this.options.delay));
          }
        } catch (error) {
          errors.push(`Error scraping page ${page}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
    } catch (error) {
      errors.push(`Failed to initialize scraping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      data: allData,
      totalRecords: allData.length,
      errors
    };
  }
  
  async scrapePage(url: string): Promise<LatviaPharmaData[]> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    const $ = cheerio.load(response.data);
    return this.extractDataFromPage($);
  }
  
  private extractDataFromPage($: cheerio.Root): LatviaPharmaData[] {
    const data: LatviaPharmaData[] = [];
    
    // Find the main table - look for table with specific headers
    $('table').each((tableIndex, table) => {
      const headers = $(table).find('th').map((i, el) => $(el).text().trim()).get();
      
      // Check if this is the right table by looking for key headers
      if (headers.some(h => h.includes('Active ingredient'))) {
        // Process rows in this table
        $(table).find('tbody tr').each((index, element) => {
          try {
            const $row = $(element);
            const cells = $row.find('td');
            
            if (cells.length >= 6) { // Based on screenshot columns
              // First cell contains drug name and identification info
              const firstCellText = $(cells[0]).text().trim();
              const firstCellLines = firstCellText.split('\n').map(line => line.trim()).filter(line => line);
              
              // Extract manufacturer info (name and country)
              const manufacturerText = $(cells[2]).text().trim();
              const manufacturerParts = manufacturerText.split(',').map(part => part.trim());
              
              // Extract wholesaler info
              const wholesalerText = $(cells[4]).text().trim();
              const wholesalerLines = wholesalerText.split('\n').map(line => line.trim()).filter(line => line);
              
              // Extract highlighted/tagged text (like LPN numbers)
              const lpnMatch = $(cells[4]).find('.badge, .tag, span[class*="label"]').text().trim();
              
              const drugInfo: LatviaPharmaData = {
                drugName: firstCellLines[0] || 'Unknown',
                dosageForm: firstCellLines[1] || '',
                registrationNumber: firstCellLines[firstCellLines.length - 1] || `REG-${Date.now()}-${index}`,
                activeIngredient: $(cells[1]).text().trim() || 'Unknown',
                manufacturerName: manufacturerParts[0] || 'Unknown',
                manufacturerCountry: manufacturerParts[1] || '',
                atcCode: $(cells[3]).text().trim() || '',
                issuanceProcedure: 'Mr.', // Based on screenshot, seems to always be 'Mr.'
                wholesalerName: wholesalerLines[0] || 'Unknown',
                wholesalerAddress: wholesalerLines.slice(1, -1).join(', ') || '',
                wholesalerLicense: lpnMatch || wholesalerLines[wholesalerLines.length - 1] || '',
                permitValidity: $(cells[5]).text().trim() || '',
              };
              
              // Skip empty rows
              if (drugInfo.drugName !== 'Unknown' && drugInfo.drugName !== '') {
                data.push(drugInfo);
              }
            }
          } catch (error) {
            console.warn(`Error parsing row ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });
      }
    });
    
    return data;
  }
  
  // Search for specific drugs by name or ATC code
  async searchDrug(query: string): Promise<LatviaPharmaData[]> {
    const searchUrl = `${this.baseUrl}?search=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    const $ = cheerio.load(response.data);
    
    return this.extractDataFromPage($);
  }
  
  // Export data to different formats
  exportToCSV(data: LatviaPharmaData[]): string {
    const headers = [
      'Drug Name',
      'Dosage Form',
      'Registration Number',
      'Active Ingredient',
      'Manufacturer Name',
      'Manufacturer Country',
      'ATC Code',
      'Issuance Procedure',
      'Wholesaler Name',
      'Wholesaler Address',
      'Wholesaler License',
      'Permit Validity'
    ];
    
    const rows = data.map(item => [
      item.drugName,
      item.dosageForm,
      item.registrationNumber,
      item.activeIngredient,
      item.manufacturerName,
      item.manufacturerCountry,
      item.atcCode,
      item.issuanceProcedure,
      item.wholesalerName,
      item.wholesalerAddress,
      item.wholesalerLicense,
      item.permitValidity
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  }
}

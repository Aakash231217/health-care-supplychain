import puppeteer from 'puppeteer';
import { z } from 'zod';
import { translateCountry, translateDosageForm, translateCompanyName, translateIssuance } from './latvia-translations';
import { LatviaPharmaSchema, LatviaPharmaData } from './latvia-pharma-scraper';

export class LatviaPharmaScraperPuppeteer {
  private baseUrl = 'https://dati.zva.gov.lv/zr-n-permissions/';
  
  // Helper function to add delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async scrapeWithBrowser(): Promise<{
    data: LatviaPharmaData[];
    totalRecords: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    const allData: LatviaPharmaData[] = [];
    let browser;
    
    try {
      console.log('🚀 Launching browser...');
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Enable console output from the page
      page.on('console', (msg) => {
        console.log('PAGE LOG:', msg.text());
      });
      
      // Set user agent to appear as a regular browser
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log('📡 Navigating to Latvia pharmaceutical registry...');
      const response = await page.goto(this.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      console.log(`Page response status: ${response?.status()}`);
      console.log(`Page URL after navigation: ${page.url()}`);
      
      // Wait for the table to load
      console.log('⏳ Waiting for data to load...');
      
      // Try different selectors that might exist on the page
      const selectors = [
        'table tbody tr',
        '.dataTables_wrapper table tbody tr',
        '[role="grid"] tbody tr',
        '.table-responsive table tbody tr',
        'table.dataTable tbody tr'
      ];
      
      let tableFound = false;
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`✓ Found table with selector: ${selector}`);
          tableFound = true;
          break;
        } catch (e) {
          console.log(`✗ Selector not found: ${selector}`);
        }
      }
      
      if (!tableFound) {
        console.log('⚠️ No table found with any known selector');
        // Take a screenshot for debugging
        await page.screenshot({ path: 'latvia-debug.png' });
        console.log('📸 Debug screenshot saved as latvia-debug.png');
      }
      
      // Wait a bit more for dynamic content to fully load
      await this.delay(5000);
      
      // Try to get total records count from various possible locations
      const totalRecordsText = await page.evaluate(() => {
        // Try different patterns that might indicate total records
        const patterns = [
          /(\d+)\s+entries\s+selected/i,
          /showing\s+\d+\s+to\s+\d+\s+of\s+(\d+)/i,
          /total:\s*(\d+)/i,
          /(\d+)\s+results/i,
          /(\d+)\s+records/i
        ];
        
        const text = document.body.innerText;
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            return parseInt(match[1]);
          }
        }
        
        // If no pattern matches, count visible rows
        const rows = document.querySelectorAll('table tbody tr, [role="grid"] tbody tr');
        return rows.length;
      });
      
      console.log(`Found ${totalRecordsText} total records`);
      
      // Extract data from current page
      const pageData = await page.evaluate(() => {
        const data: any[] = [];
        
        // Try multiple selectors for rows
        const rowSelectors = [
          'table tbody tr',
          '.dataTables_wrapper table tbody tr',
          '[role="grid"] tbody tr',
          'table.dataTable tbody tr',
          '.table-responsive table tbody tr'
        ];
        
        let rows: NodeListOf<Element> | null = null;
        for (const selector of rowSelectors) {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            rows = found;
            console.log(`Using row selector: ${selector}, found ${found.length} rows`);
            break;
          }
        }
        
        if (!rows || rows.length === 0) {
          console.log('No data rows found');
          return data;
        }
        
        rows.forEach((row, index) => {
          const cells = row.querySelectorAll('td');
          console.log(`Row ${index}: ${cells.length} cells`);
          
          // Process rows with 7 cells (based on the website structure)
          if (cells.length >= 7) {
            // Extract text from each cell
            const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim() || '');
            console.log(`Row ${index} data:`, JSON.stringify(cellTexts));
            
            // Column 0: Name, strength/concentration, dosage form, identification number
            const firstCellText = cellTexts[0];
            
            // Registration number pattern: NXXXXXX-XX at the end
            const regNumMatch = firstCellText.match(/N\d{6}-\d{2}$/);
            const registrationNumber = regNumMatch ? regNumMatch[0] : '';
            
            // Remove registration number from text to parse the rest
            const drugInfo = registrationNumber ? 
                            firstCellText.substring(0, firstCellText.indexOf(registrationNumber)) : 
                            firstCellText;
            
            // Try to split drug name from dosage form
            // Look for common dosage form indicators
            const dosageFormPatterns = [
              /(?:tablet|tablete|apvalkotā tablete)/i,
              /(?:capsule|kapsula)/i,
              /(?:solution|šķīdums|suspensija)/i,
              /(?:powder|pulveris|polvere)/i,
              /(?:gel|gels)/i,
              /(?:aerosol|aerosols)/i,
              /(?:cream|krēms)/i,
              /(?:ointment|ziede)/i
            ];
            
            let drugName = drugInfo;
            let dosageForm = '';
            
            // Find where dosage form starts
            for (const pattern of dosageFormPatterns) {
              const match = drugInfo.match(pattern);
              if (match && match.index) {
                drugName = drugInfo.substring(0, match.index).trim();
                dosageForm = drugInfo.substring(match.index).trim();
                break;
              }
            }
            
            // If no pattern matched, try to split by common separators or concentration
            if (!dosageForm && drugInfo.match(/\d+\s*(?:mg|ml|g|iu|%)/i)) {
              const concMatch = drugInfo.match(/\d+\s*(?:mg|ml|g|iu|%)/i);
              if (concMatch && concMatch.index) {
                const splitIndex = drugInfo.lastIndexOf(' ', concMatch.index);
                if (splitIndex > 0) {
                  drugName = drugInfo.substring(0, splitIndex).trim();
                  dosageForm = drugInfo.substring(splitIndex).trim();
                }
              }
            }
            
            // Column 1: Active ingredient
            const activeIngredient = cellTexts[1] || '';
            
            // Column 2: Name and country of manufacturer
            const manufacturerText = cellTexts[2] || '';
            const manufacturerParts = manufacturerText.split(',').map(part => part.trim());
            const manufacturerName = manufacturerParts[0] || 'Unknown Manufacturer';
            const manufacturerCountry = manufacturerParts[1] || 'Unknown Country';
            
            // Column 3: ATC code
            const atcCode = cellTexts[3] || '';
            
            // Column 4: Issuance procedure
            const issuanceProcedure = cellTexts[4] || 'Mr.';
            
            // Column 5: Name, address, license number of wholesaler
            const wholesalerText = cellTexts[5] || '';
            
            // Parse wholesaler info - it's usually in format:
            // Company name, address, license
            // Sometimes license is at the end after a space
            
            // Look for license patterns (L00031, LPN-34/6, etc.)
            const licenseMatch = wholesalerText.match(/\b(L\d{5}|LPN-\d+\/\d+|L\d{3,})\b/);
            const wholesalerLicense = licenseMatch ? licenseMatch[0] : '';
            
            // Remove license from text to parse the rest
            const wholesalerInfoWithoutLicense = wholesalerLicense ? 
                wholesalerText.replace(wholesalerLicense, '').trim() : 
                wholesalerText;
            
            // Split by comma to separate company name and address
            const wholesalerParts = wholesalerInfoWithoutLicense.split(',').map(p => p.trim());
            
            // Extract company name (usually starts with SIA, AS, or similar)
            let wholesalerName = wholesalerParts[0] || 'Unknown Wholesaler';
            
            // Remove quotes if present
            wholesalerName = wholesalerName.replace(/^["']|["']$/g, '');
            
            // Extract address (everything after company name)
            const addressParts = wholesalerParts.slice(1).filter(p => p);
            const wholesalerAddress = addressParts.join(', ') || 'Not specified';
            
            // Column 6: Permit validity date
            const permitValidity = cellTexts[6] || '';
            
            data.push({
              drugName,
              dosageForm,
              registrationNumber,
              activeIngredient,
              manufacturerName,
              manufacturerCountry,
              atcCode,
              issuanceProcedure,
              wholesalerName,
              wholesalerAddress,
              wholesalerLicense,
              permitValidity,
            });
          }
        });
        
        return data;
      });
      
      // Translate and validate data
      for (const item of pageData) {
        try {
          // Apply translations
          const translatedItem = {
            ...item,
            dosageForm: translateDosageForm(item.dosageForm),
            manufacturerCountry: translateCountry(item.manufacturerCountry),
            issuanceProcedure: translateIssuance(item.issuanceProcedure),
            wholesalerName: translateCompanyName(item.wholesalerName),
          };
          
          const validated = LatviaPharmaSchema.parse(translatedItem);
          allData.push(validated);
        } catch (error) {
          console.warn('Validation error:', error);
        }
      }
      
      console.log(`✅ Scraped ${allData.length} records from current page`);
      
      // Check if there are more pages
      const hasNextPage = await page.evaluate(() => {
        const nextButton = document.querySelector('button[aria-label="Next page"], .pagination .next:not(.disabled)');
        return nextButton !== null && !nextButton.classList.contains('disabled');
      });
      
      if (hasNextPage) {
        console.log('📋 Multiple pages detected, consider implementing pagination');
      }
      
    } catch (error) {
      errors.push(`Browser scraping error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Scraping error:', error);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
    
    return {
      data: allData,
      totalRecords: allData.length,
      errors
    };
  }
  
  async scrapeWithPagination(maxPages: number = 5): Promise<{
    data: LatviaPharmaData[];
    totalRecords: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    const allData: LatviaPharmaData[] = [];
    let browser;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Wait for initial data load
      await page.waitForSelector('table', { timeout: 10000 });
      await this.delay(2000);
      
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore && currentPage <= maxPages) {
        console.log(`Scraping page ${currentPage}...`);
        
        // Extract data from current page
        const pageData = await page.evaluate(() => {
          // Similar extraction logic as above
          const data: any[] = [];
          const rows = document.querySelectorAll('table tbody tr');
          
          rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
              const firstCellText = cells[0]?.textContent?.trim() || '';
              const firstCellLines = firstCellText.split('\n').map(line => line.trim()).filter(line => line);
              
              const manufacturerText = cells[2]?.textContent?.trim() || '';
              const manufacturerParts = manufacturerText.split(',').map(part => part.trim());
              
              const wholesalerText = cells[4]?.textContent?.trim() || '';
              const wholesalerLines = wholesalerText.split('\n').map(line => line.trim()).filter(line => line);
              
              data.push({
                drugName: firstCellLines[0] || '',
                dosageForm: firstCellLines[1] || '',
                registrationNumber: firstCellLines[firstCellLines.length - 1] || '',
                activeIngredient: cells[1]?.textContent?.trim() || '',
                manufacturerName: manufacturerParts[0] || '',
                manufacturerCountry: manufacturerParts[1] || '',
                atcCode: cells[3]?.textContent?.trim() || '',
                issuanceProcedure: 'Mr.',
                wholesalerName: wholesalerLines[0] || '',
                wholesalerAddress: wholesalerLines.slice(1, -1).join(', ') || '',
                wholesalerLicense: wholesalerLines[wholesalerLines.length - 1] || '',
                permitValidity: cells[5]?.textContent?.trim() || '',
              });
            }
          });
          
          return data;
        });
        
        // Add validated data
        for (const item of pageData) {
          try {
            const validated = LatviaPharmaSchema.parse(item);
            allData.push(validated);
          } catch (error) {
            // Skip invalid entries
          }
        }
        
        // Try to go to next page
        const nextButtonExists = await page.evaluate(() => {
          const nextButton = document.querySelector('a[aria-label="Next page"], button[aria-label="Next page"], .pagination .next:not(.disabled)');
          return nextButton !== null;
        });
        
        if (nextButtonExists && currentPage < maxPages) {
          await page.click('a[aria-label="Next page"], button[aria-label="Next page"], .pagination .next:not(.disabled)');
          await this.delay(2000); // Wait for page to load
          currentPage++;
        } else {
          hasMore = false;
        }
      }
      
    } catch (error) {
      errors.push(`Pagination error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
    
    return {
      data: allData,
      totalRecords: allData.length,
      errors
    };
  }
}

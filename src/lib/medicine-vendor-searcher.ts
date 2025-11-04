import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import OpenAI from 'openai';

/**
 * Medicine Vendor Searcher - Find vendors/suppliers for specific medicines
 * Uses Google Search API and web scraping to discover suppliers
 */

export interface MedicineVendorSearchInput {
  medicineName: string;
  dosage?: string;
  country?: string;
  searchDepth?: number; // How many pages of results to search
}

export interface DiscoveredVendor {
  // Basic Info
  companyName: string;
  website?: string;
  snippet?: string;
  
  // Categorization
  businessType: 'Wholesaler' | 'Distributor' | 'Retailer' | 'Manufacturer' | 'Unknown';
  confidence: number;
  
  // Volume Indicators
  volumeIndicators?: {
    bulkSupplier: boolean;
    minimumOrderQty?: string;
    servesHospitals?: boolean;
    internationalShipping?: boolean;
  };
  
  // Contact Info
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  
  // Additional Data
  certifications?: string[];
  sourceUrl: string;
  foundOn: 'Google' | 'Directory' | 'Website';
}

export interface MedicineVendorSearchResult {
  medicineName: string;
  searchQuery: string;
  vendorsFound: number;
  vendors: {
    wholesalers: DiscoveredVendor[];
    distributors: DiscoveredVendor[];
    retailers: DiscoveredVendor[];
    manufacturers: DiscoveredVendor[];
    uncategorized: DiscoveredVendor[];
  };
  searchMetadata: {
    searchTime: number;
    dataQuality: 'High' | 'Medium' | 'Low';
    warnings?: string[];
  };
}

export class MedicineVendorSearcher {
  private googleApiKey: string;
  private searchEngineId: string;
  private openai: OpenAI | null = null;

  constructor() {
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    
    if (!this.googleApiKey) {
      console.warn('⚠️ GOOGLE_SEARCH_API_KEY not set - medicine vendor search will be limited');
    }
    if (!this.searchEngineId) {
      console.warn('⚠️ GOOGLE_SEARCH_ENGINE_ID not set - medicine vendor search will be limited');
    }
    
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('✅ OpenAI initialized for enhanced vendor classification');
    } else {
      console.warn('⚠️ OPENAI_API_KEY not set - vendor classification may be less accurate');
    }
  }

  /**
   * Main entry point - search for vendors of a specific medicine
   */
  async searchVendorsForMedicine(input: MedicineVendorSearchInput): Promise<MedicineVendorSearchResult> {
    const startTime = Date.now();
    console.log(`💊 Searching for vendors of: ${input.medicineName} ${input.dosage || ''}`);
    
    const result: MedicineVendorSearchResult = {
      medicineName: input.medicineName + (input.dosage ? ` ${input.dosage}` : ''),
      searchQuery: '',
      vendorsFound: 0,
      vendors: {
        wholesalers: [],
        distributors: [],
        retailers: [],
        manufacturers: [],
        uncategorized: []
      },
      searchMetadata: {
        searchTime: 0,
        dataQuality: 'Low',
        warnings: []
      }
    };

    try {
      // Step 1: Search for suppliers using multiple search queries
      const searchQueries = this.generateSearchQueries(input);
      const allVendors: DiscoveredVendor[] = [];
      
      for (const query of searchQueries.slice(0, input.searchDepth || 3)) {
        console.log(`  → Searching: "${query}"`);
        result.searchQuery = query; // Store the primary query
        
        const vendors = await this.searchGoogleForVendors(query, input.country);
        allVendors.push(...vendors);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Deduplicate vendors by domain
      const uniqueVendors = this.deduplicateVendors(allVendors);
      
      // Step 3: Enhance vendor data with web scraping (for top results)
      const enhancedVendors = await this.enhanceVendorData(uniqueVendors.slice(0, 10));
      
      // Step 4: Categorize vendors
      for (const vendor of enhancedVendors) {
        result.vendorsFound++;
        
        switch (vendor.businessType) {
          case 'Wholesaler':
            result.vendors.wholesalers.push(vendor);
            break;
          case 'Distributor':
            result.vendors.distributors.push(vendor);
            break;
          case 'Retailer':
            result.vendors.retailers.push(vendor);
            break;
          case 'Manufacturer':
            result.vendors.manufacturers.push(vendor);
            break;
          default:
            result.vendors.uncategorized.push(vendor);
        }
      }
      
      // Step 5: Calculate metadata
      result.searchMetadata.searchTime = (Date.now() - startTime) / 1000;
      result.searchMetadata.dataQuality = this.assessDataQuality(result);
      
      console.log(`✅ Found ${result.vendorsFound} vendors in ${result.searchMetadata.searchTime.toFixed(2)}s`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Medicine vendor search error:', error);
      result.searchMetadata.warnings?.push(`Search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Generate multiple search queries to find vendors
   */
  private generateSearchQueries(input: MedicineVendorSearchInput): string[] {
    const base = `${input.medicineName} ${input.dosage || ''}`.trim();
    const location = input.country || '';
    
    return [
      `${base} wholesale supplier ${location}`,
      `${base} pharmaceutical distributor ${location}`,
      `buy ${base} bulk wholesale ${location}`,
      `${base} medicine supplier B2B ${location}`,
      `${base} pharma wholesaler ${location}`,
      `${base} drug distributor ${location}`,
      `${base} medical supplier wholesale ${location}`,
    ];
  }

  /**
   * Search Google for vendors
   */
  private async searchGoogleForVendors(query: string, country?: string): Promise<DiscoveredVendor[]> {
    if (!this.googleApiKey || !this.searchEngineId) {
      return [];
    }

    try {
      const url = 'https://www.googleapis.com/customsearch/v1';
      const response = await axios.get(url, {
        params: {
          key: this.googleApiKey,
          cx: this.searchEngineId,
          q: query,
          num: 10, // Get 10 results per query
        },
        timeout: 10000,
      });

      const items = response.data.items || [];
      const vendors: DiscoveredVendor[] = [];
      
      for (const item of items) {
        // Skip non-commercial sites
        if (this.isNonCommercialSite(item.link)) {
          continue;
        }
        
        const vendor = this.extractVendorFromSearchResult(item);
        vendors.push(vendor);
      }
      
      return vendors;
      
    } catch (error) {
      console.error('Google Search API error:', error);
      return [];
    }
  }

  /**
   * Extract vendor information from search result
   */
  private extractVendorFromSearchResult(searchItem: any): DiscoveredVendor {
    const snippet = searchItem.snippet || '';
    const title = searchItem.title || '';
    
    // Extract company name from title or domain
    const companyName = this.extractCompanyName(title, searchItem.link);
    
    // Detect business type from snippet and title
    const businessType = this.detectBusinessTypeFromText(snippet + ' ' + title);
    
    // Look for volume indicators
    const volumeIndicators = this.extractVolumeIndicators(snippet);
    
    return {
      companyName,
      website: searchItem.link,
      snippet,
      businessType,
      confidence: 0.5, // Initial confidence, will be enhanced later
      volumeIndicators,
      sourceUrl: searchItem.link,
      foundOn: 'Google'
    };
  }

  /**
   * Enhance vendor data by scraping their websites
   */
  private async enhanceVendorData(vendors: DiscoveredVendor[]): Promise<DiscoveredVendor[]> {
    const enhanced: DiscoveredVendor[] = [];
    
    for (const vendor of vendors) {
      try {
        console.log(`  → Enhancing data for: ${vendor.companyName}`);
        
        // Try to scrape website if available
        let enhancedVendor = vendor;
        if (vendor.website && !this.isNonCommercialSite(vendor.website)) {
          enhancedVendor = await this.scrapeVendorWebsite(vendor);
        }
        
        // Use AI to classify vendor if OpenAI is available
        if (this.openai) {
          const aiClassification = await this.classifyVendorWithAI(enhancedVendor);
          enhancedVendor.businessType = aiClassification.businessType;
          enhancedVendor.confidence = aiClassification.confidence;
          if (aiClassification.volumeIndicators) {
            enhancedVendor.volumeIndicators = {
              ...enhancedVendor.volumeIndicators,
              ...aiClassification.volumeIndicators
            };
          }
        }
        
        enhanced.push(enhancedVendor);
      } catch (error) {
        console.warn(`  ⚠️ Failed to enhance ${vendor.companyName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        enhanced.push(vendor);
      }
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return enhanced;
  }

  /**
   * Scrape vendor website for additional information
   */
  private async scrapeVendorWebsite(vendor: DiscoveredVendor): Promise<DiscoveredVendor> {
    try {
      // Skip non-HTML pages
      if (!vendor.website || this.isNonCommercialSite(vendor.website)) {
        return vendor;
      }
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Set up request interception to block non-HTML resources
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const url = request.url();
        if (url.endsWith('.pdf') || url.endsWith('.doc') || url.endsWith('.rtf')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // Visit the vendor's website with error handling
      try {
        await page.goto(vendor.website!, {
          waitUntil: 'networkidle2',
          timeout: 10000,
        });
      } catch (navError) {
        console.warn(`  ⚠️ Navigation error for ${vendor.companyName}: ${navError instanceof Error ? navError.message : 'Unknown'}`);        
        await browser.close();
        return vendor;
      }

      const pageContent = await page.content();
      const $ = cheerio.load(pageContent);
      const pageText = $('body').text().toLowerCase();
      
      // Enhance business type detection with more context
      const enhancedBusinessType = this.detectBusinessTypeFromText(pageText);
      if (enhancedBusinessType !== 'Unknown') {
        vendor.businessType = enhancedBusinessType;
        vendor.confidence = Math.min(vendor.confidence + 0.3, 1);
      }
      
      // Extract contact information
      vendor.contactInfo = {
        email: this.extractEmail(pageText),
        phone: this.extractPhone(pageText),
        address: this.extractAddress($)
      };
      
      // Extract certifications
      vendor.certifications = this.extractCertifications(pageText);
      if (vendor.certifications.length > 0) {
        vendor.confidence = Math.min(vendor.confidence + 0.1, 1);
      }
      
      // Enhance volume indicators
      const volumeIndicators = this.extractVolumeIndicators(pageText);
      vendor.volumeIndicators = { ...vendor.volumeIndicators, ...volumeIndicators };
      
      // If they mention MOQ or bulk, increase confidence they're a wholesaler
      if (vendor.volumeIndicators?.bulkSupplier || vendor.volumeIndicators?.minimumOrderQty) {
        if (vendor.businessType === 'Unknown') {
          vendor.businessType = 'Wholesaler';
        }
        vendor.confidence = Math.min(vendor.confidence + 0.2, 1);
      }

      await browser.close();
      
      return vendor;
      
    } catch (error) {
      console.error('Website scraping error:', error);
      return vendor;
    }
  }

  /**
   * Helper methods
   */
  
  private isNonCommercialSite(url: string): boolean {
    const nonCommercial = [
      'wikipedia.org', 'webmd.com', 'drugs.com', 'rxlist.com', 
      'medlineplus.gov', 'nih.gov', 'fda.gov', 'who.int',
      '.gov', '.edu', '.pdf', '.doc', '.rtf', '.ppt',
      'pubmed', 'ncbi', 'sciencedirect', 'springer',
      'swissmedic.ch', 'mzd.gov.cz', 'europa.eu',
      'ema.europa.eu', 'medicines.org.uk'
    ];
    
    const lowerUrl = url.toLowerCase();
    
    // Check if it's a document file
    if (lowerUrl.endsWith('.pdf') || lowerUrl.endsWith('.doc') || 
        lowerUrl.endsWith('.rtf') || lowerUrl.endsWith('.ppt')) {
      return true;
    }
    
    return nonCommercial.some(domain => lowerUrl.includes(domain));
  }
  
  private extractCompanyName(title: string, url: string): string {
    // Try to extract from title first
    const titleMatch = title.match(/^([^-|]+)/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    // Extract from domain
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').split('.')[0];
  }
  
  private detectBusinessTypeFromText(text: string): 'Wholesaler' | 'Distributor' | 'Retailer' | 'Manufacturer' | 'Unknown' {
    const lowerText = text.toLowerCase();
    
    // Strong indicators
    if (lowerText.includes('wholesale') || lowerText.includes('wholesaler')) return 'Wholesaler';
    if (lowerText.includes('distributor') || lowerText.includes('distribution')) return 'Distributor';
    if (lowerText.includes('manufacturer') || lowerText.includes('manufacturing') || lowerText.includes('pharma factory')) return 'Manufacturer';
    if (lowerText.includes('pharmacy') || lowerText.includes('drugstore') || lowerText.includes('retail')) return 'Retailer';
    
    // Secondary indicators
    if (lowerText.includes('bulk supplier') || lowerText.includes('b2b')) return 'Wholesaler';
    if (lowerText.includes('supply chain') || lowerText.includes('logistics')) return 'Distributor';
    
    return 'Unknown';
  }
  
  private extractVolumeIndicators(text: string): any {
    const lowerText = text.toLowerCase();
    
    return {
      bulkSupplier: lowerText.includes('bulk') || lowerText.includes('wholesale quantities'),
      minimumOrderQty: this.extractMOQ(lowerText),
      servesHospitals: lowerText.includes('hospital') || lowerText.includes('healthcare facilities'),
      internationalShipping: lowerText.includes('international') || lowerText.includes('worldwide') || lowerText.includes('global shipping')
    };
  }
  
  private extractMOQ(text: string): string | undefined {
    const patterns = [
      /moq[:\s]+([0-9,]+\s*(?:units?|pcs|pieces|boxes?|cartons?)?)/i,
      /minimum\s+order[:\s]+([0-9,]+\s*(?:units?|pcs|pieces|boxes?|cartons?)?)/i,
      /minimum\s+quantity[:\s]+([0-9,]+\s*(?:units?|pcs|pieces|boxes?|cartons?)?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }
  
  private extractEmail(text: string): string | undefined {
    const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const match = text.match(emailPattern);
    return match ? match[1] : undefined;
  }
  
  private extractPhone(text: string): string | undefined {
    // Simple phone pattern - can be enhanced
    const phonePattern = /(\+?[0-9]{1,3}[-.\s]?)?(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/;
    const match = text.match(phonePattern);
    return match ? match[0] : undefined;
  }
  
  private extractAddress($: cheerio.Root): string | undefined {
    // Look for address in common locations
    const addressSelectors = ['.address', '[itemprop="address"]', '.contact-address', '.company-address'];
    
    for (const selector of addressSelectors) {
      const address = $(selector).text().trim();
      if (address) {
        return address;
      }
    }
    
    return undefined;
  }
  
  private extractCertifications(text: string): string[] {
    const certifications: string[] = [];
    const certs = ['GDP', 'GMP', 'ISO 9001', 'ISO 13485', 'ISO 14001', 'HACCP', 'CE', 'FDA approved', 'WHO GMP'];

    certs.forEach(cert => {
      if (text.includes(cert.toLowerCase())) {
        certifications.push(cert);
      }
    });

    return certifications;
  }
  
  private deduplicateVendors(vendors: DiscoveredVendor[]): DiscoveredVendor[] {
    const seen = new Set<string>();
    const unique: DiscoveredVendor[] = [];
    
    for (const vendor of vendors) {
      if (!vendor.website) {
        unique.push(vendor);
        continue;
      }
      
      const domain = new URL(vendor.website).hostname;
      if (!seen.has(domain)) {
        seen.add(domain);
        unique.push(vendor);
      }
    }
    
    return unique;
  }
  
  private assessDataQuality(result: MedicineVendorSearchResult): 'High' | 'Medium' | 'Low' {
    const totalVendors = result.vendorsFound;
    const categorizedVendors = result.vendors.wholesalers.length + 
                               result.vendors.distributors.length + 
                               result.vendors.manufacturers.length +
                               result.vendors.retailers.length;
    const categorizedRatio = totalVendors > 0 ? categorizedVendors / totalVendors : 0;
    
    if (totalVendors >= 10 && categorizedRatio >= 0.8) return 'High';
    if (totalVendors >= 5 && categorizedRatio >= 0.6) return 'Medium';
    return 'Low';
  }
  
  /**
   * Use OpenAI to classify vendor based on available information
   */
  private async classifyVendorWithAI(vendor: DiscoveredVendor): Promise<{
    businessType: 'Wholesaler' | 'Distributor' | 'Retailer' | 'Manufacturer' | 'Unknown';
    confidence: number;
    volumeIndicators?: any;
  }> {
    if (!this.openai) {
      return {
        businessType: vendor.businessType || 'Unknown',
        confidence: vendor.confidence || 0.5,
        volumeIndicators: vendor.volumeIndicators
      };
    }
    
    try {
      const prompt = `Analyze this pharmaceutical vendor and classify their business type:

Company: ${vendor.companyName}
Website: ${vendor.website || 'Not available'}
Description: ${vendor.snippet || 'No description'}

Based on the information above, please provide:
1. Business Type: Must be exactly one of: Wholesaler, Distributor, Retailer, Manufacturer, Unknown
2. Confidence: A score from 0.0 to 1.0
3. Key Indicators: List any indicators of bulk supply capability (MOQ, serves hospitals, international shipping, etc.)

Respond in JSON format:
{
  "businessType": "Wholesaler|Distributor|Retailer|Manufacturer|Unknown",
  "confidence": 0.0-1.0,
  "indicators": {
    "bulkSupplier": true/false,
    "minimumOrderQty": "string or null",
    "servesHospitals": true/false,
    "internationalShipping": true/false,
    "reasoning": "brief explanation"
  }
}`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are an expert in pharmaceutical supply chain classification. Analyze vendors and categorize them accurately.'
        }, {
          role: 'user',
          content: prompt
        }],
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        businessType: result.businessType || 'Unknown',
        confidence: result.confidence || 0.5,
        volumeIndicators: {
          bulkSupplier: result.indicators?.bulkSupplier || false,
          minimumOrderQty: result.indicators?.minimumOrderQty || undefined,
          servesHospitals: result.indicators?.servesHospitals || false,
          internationalShipping: result.indicators?.internationalShipping || false
        }
      };
      
    } catch (error) {
      console.error('OpenAI classification error:', error);
      return {
        businessType: vendor.businessType || 'Unknown',
        confidence: vendor.confidence || 0.5,
        volumeIndicators: vendor.volumeIndicators
      };
    }
  }
}
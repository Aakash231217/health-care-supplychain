import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

/**
 * Vendor Researcher - Automated vendor intelligence gathering
 * Uses Google Custom Search API + Puppeteer to research vendor capabilities
 */

export interface VendorResearchInput {
  vendorName: string;
  country?: string;
  existingWebsite?: string;
  existingEmail?: string;
}

export interface VendorIntelligenceData {
  // Company Profile
  businessType?: string;
  companySize?: string;
  employeeCount?: number;
  annualRevenue?: number;
  yearsInBusiness?: number;

  // Order Capacity
  minimumOrderQty?: number;
  typicalOrderSize?: string;
  orderCapacityScore?: number;

  // Market Presence
  numberOfLocations?: number;
  geographicCoverage?: string;
  primaryClientTypes?: string[];

  // Compliance
  certificationsFound?: string[];
  licenseStatus?: string;

  // Performance
  averageDeliveryDays?: number;
  reliabilityScore?: number;
  customerReviewCount?: number;

  // Classification
  supplierClassification?: string;
  classificationScore?: number;

  // Meta
  officialWebsite?: string;
  linkedinUrl?: string;
  dataSource?: string;
  rawData?: any;
  confidenceScore?: number;
}

export class VendorResearcher {
  private googleApiKey: string;
  private searchEngineId: string;

  constructor() {
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    
    if (!this.googleApiKey) {
      console.warn('⚠️ GOOGLE_SEARCH_API_KEY not set - vendor research will be limited');
    }
  }

  /**
   * Main entry point - research a vendor
   */
  async researchVendor(input: VendorResearchInput): Promise<VendorIntelligenceData> {
    console.log(`🔍 Researching vendor: ${input.vendorName}`);
    
    const intelligence: VendorIntelligenceData = {
      rawData: {},
      dataSource: '',
    };

    const dataSources: string[] = [];

    try {
      // Step 1: Find official website (if not provided)
      if (!input.existingWebsite && this.googleApiKey) {
        console.log('  → Searching for official website...');
        const websiteData = await this.findOfficialWebsite(input.vendorName, input.country);
        if (websiteData.website) {
          intelligence.officialWebsite = websiteData.website;
          intelligence.rawData = { ...intelligence.rawData, googleSearch: websiteData };
          dataSources.push('GoogleSearch');
        }
      } else if (input.existingWebsite) {
        intelligence.officialWebsite = input.existingWebsite;
      }

      // Step 2: Scrape official website
      if (intelligence.officialWebsite) {
        console.log(`  → Scraping website: ${intelligence.officialWebsite}`);
        const websiteData = await this.scrapeWebsite(intelligence.officialWebsite);
        Object.assign(intelligence, websiteData);
        intelligence.rawData = { ...intelligence.rawData, websiteScrape: websiteData };
        dataSources.push('Website');
      }

      // Step 3: Calculate classification score
      console.log('  → Calculating classification...');
      const classification = this.classifyVendor(intelligence);
      intelligence.supplierClassification = classification.classification;
      intelligence.classificationScore = classification.score;
      intelligence.confidenceScore = this.calculateConfidenceScore(intelligence);

      intelligence.dataSource = dataSources.join(',');

      console.log(`✅ Research complete: ${intelligence.supplierClassification} (confidence: ${(intelligence.confidenceScore! * 100).toFixed(0)}%)`);

      return intelligence;
    } catch (error) {
      console.error('❌ Vendor research error:', error);
      throw error;
    }
  }

  /**
   * Find official website using Google Custom Search API
   */
  private async findOfficialWebsite(
    vendorName: string,
    country?: string
  ): Promise<{ website?: string; snippet?: string; searchResults: any[] }> {
    if (!this.googleApiKey || !this.searchEngineId) {
      return { searchResults: [] };
    }

    try {
      const query = `${vendorName}${country ? ` ${country}` : ''} pharmaceutical wholesale`;
      const url = 'https://www.googleapis.com/customsearch/v1';
      
      const response = await axios.get(url, {
        params: {
          key: this.googleApiKey,
          cx: this.searchEngineId,
          q: query,
          num: 5, // Get top 5 results
        },
        timeout: 10000,
      });

      const items = response.data.items || [];
      
      if (items.length > 0) {
        const firstResult = items[0];
        return {
          website: firstResult.link,
          snippet: firstResult.snippet,
          searchResults: items,
        };
      }

      return { searchResults: [] };
    } catch (error) {
      console.error('Google Search API error:', error);
      return { searchResults: [] };
    }
  }

  /**
   * Scrape vendor website for intelligence
   */
  private async scrapeWebsite(websiteUrl: string): Promise<Partial<VendorIntelligenceData>> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Visit homepage
      await page.goto(websiteUrl, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      const pageContent = await page.content();
      const $ = cheerio.load(pageContent);
      const pageText = $('body').text().toLowerCase();

      // Extract intelligence from page content
      const intelligence: Partial<VendorIntelligenceData> = {};

      // 1. Business Type Detection
      intelligence.businessType = this.detectBusinessType(pageText);

      // 2. Employee Count
      intelligence.employeeCount = this.extractEmployeeCount(pageText);

      // 3. Certifications
      intelligence.certificationsFound = this.extractCertifications(pageText);

      // 4. Minimum Order Quantity
      intelligence.minimumOrderQty = this.extractMOQ(pageText);

      // 5. Number of locations
      intelligence.numberOfLocations = this.extractLocationsCount(pageText);

      // 6. Geographic Coverage
      intelligence.geographicCoverage = this.detectGeographicCoverage(pageText);

      // 7. Client Types
      intelligence.primaryClientTypes = this.extractClientTypes(pageText);

      await browser.close();

      return intelligence;
    } catch (error) {
      console.error('Website scraping error:', error);
      return {};
    }
  }

  /**
   * Classify vendor based on collected intelligence
   */
  private classifyVendor(intelligence: VendorIntelligenceData): {
    classification: string;
    score: number;
  } {
    let score = 0;

    // Positive indicators for bulk supplier
    if (intelligence.minimumOrderQty && intelligence.minimumOrderQty >= 1000) score += 3;
    if (intelligence.minimumOrderQty && intelligence.minimumOrderQty >= 5000) score += 2;
    
    if (intelligence.employeeCount && intelligence.employeeCount > 50) score += 2;
    if (intelligence.employeeCount && intelligence.employeeCount > 100) score += 2;
    
    if (intelligence.numberOfLocations && intelligence.numberOfLocations > 1) score += 2;
    if (intelligence.numberOfLocations && intelligence.numberOfLocations > 5) score += 2;
    
    if (intelligence.businessType?.includes('wholesale')) score += 3;
    if (intelligence.businessType?.includes('distributor')) score += 2;
    if (intelligence.businessType?.includes('manufacturer')) score += 2;
    
    if (intelligence.geographicCoverage === 'International') score += 2;
    if (intelligence.geographicCoverage === 'Regional') score += 1;
    
    if (intelligence.certificationsFound && intelligence.certificationsFound.length >= 2) score += 2;
    if (intelligence.certificationsFound?.includes('GDP')) score += 1;
    if (intelligence.certificationsFound?.includes('GMP')) score += 1;
    
    if (intelligence.primaryClientTypes?.includes('Hospitals')) score += 2;
    if (intelligence.primaryClientTypes?.includes('Clinics')) score += 1;

    // Negative indicators for small retailer
    if (intelligence.businessType?.includes('retail')) score -= 2;
    if (intelligence.businessType?.includes('pharmacy')) score -= 2;
    
    if (intelligence.minimumOrderQty && intelligence.minimumOrderQty < 100) score -= 2;
    if (intelligence.employeeCount && intelligence.employeeCount < 10) score -= 2;
    
    if (intelligence.geographicCoverage === 'Local') score -= 1;

    // Final classification
    let classification: string;
    if (score >= 5) {
      classification = 'Bulk Supplier';
    } else if (score >= 2) {
      classification = 'Mid-size Distributor';
    } else {
      classification = 'Small Retailer';
    }

    return { classification, score };
  }

  /**
   * Calculate confidence score (0-1) based on data completeness
   */
  private calculateConfidenceScore(intelligence: VendorIntelligenceData): number {
    let totalFields = 0;
    let filledFields = 0;

    const fields = [
      'businessType', 'employeeCount', 'minimumOrderQty', 'numberOfLocations',
      'geographicCoverage', 'certificationsFound', 'primaryClientTypes',
      'officialWebsite'
    ];

    fields.forEach(field => {
      totalFields++;
      if ((intelligence as any)[field]) {
        filledFields++;
      }
    });

    return filledFields / totalFields;
  }

  // ============================================
  // Extraction Helper Methods
  // ============================================

  private detectBusinessType(text: string): string | undefined {
    if (text.includes('wholesale') || text.includes('wholesaler')) return 'Wholesaler';
    if (text.includes('distributor') || text.includes('distribution')) return 'Distributor';
    if (text.includes('manufacturer') || text.includes('manufacturing')) return 'Manufacturer';
    if (text.includes('retail') || text.includes('retailer')) return 'Retailer';
    return undefined;
  }

  private extractEmployeeCount(text: string): number | undefined {
    // Look for patterns like "85 employees", "team of 120", "staff of 50+"
    const patterns = [
      /(\d+)\+?\s*employees/i,
      /team\s+of\s+(\d+)/i,
      /staff\s+of\s+(\d+)/i,
      /(\d+)\+?\s*people/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private extractCertifications(text: string): string[] {
    const certifications: string[] = [];
    const certs = ['GDP', 'GMP', 'ISO 9001', 'ISO 13485', 'ISO 14001', 'HACCP', 'CE'];

    certs.forEach(cert => {
      if (text.includes(cert.toLowerCase())) {
        certifications.push(cert);
      }
    });

    return certifications;
  }

  private extractMOQ(text: string): number | undefined {
    // Look for "MOQ", "minimum order", "minimum quantity"
    const patterns = [
      /moq[:\s]+(\d+)/i,
      /minimum\s+order[:\s]+(\d+)/i,
      /minimum\s+quantity[:\s]+(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private extractLocationsCount(text: string): number | undefined {
    const patterns = [
      /(\d+)\s+(?:locations|warehouses|facilities|offices)/i,
      /(?:locations|warehouses|facilities|offices)[:\s]+(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private detectGeographicCoverage(text: string): string | undefined {
    if (text.includes('international') || text.includes('worldwide') || text.includes('global')) {
      return 'International';
    }
    if (text.includes('regional') || text.includes('europe') || text.includes('baltic')) {
      return 'Regional';
    }
    if (text.includes('local') || text.includes('city')) {
      return 'Local';
    }
    return undefined;
  }

  private extractClientTypes(text: string): string[] {
    const clientTypes: string[] = [];
    const types = ['Hospitals', 'Clinics', 'Pharmacies', 'Laboratories', 'Healthcare Centers'];

    types.forEach(type => {
      if (text.includes(type.toLowerCase())) {
        clientTypes.push(type);
      }
    });

    return clientTypes;
  }
}

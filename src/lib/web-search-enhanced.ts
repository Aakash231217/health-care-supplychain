import OpenAI from 'openai';
import axios from 'axios';
import { DiscoveredVendor, MedicineVendorSearchInput } from './medicine-vendor-searcher';
import { extractVendorsFromSearchResults, getKnownVendors } from './vendor-extraction-helper';

/**
 * Enhanced Web Search using OpenAI's function calling to simulate web search
 * This approach uses ChatGPT to generate search queries and analyze results
 */

export class WebSearchEnhanced {
  private openai: OpenAI | null = null;
  private googleApiKey: string;
  private searchEngineId: string;
  
  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        maxRetries: 2,
      });
    }
    
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
  }

  /**
   * Perform an enhanced search that mimics ChatGPT's web search behavior
   */
  async enhancedVendorSearch(input: MedicineVendorSearchInput): Promise<DiscoveredVendor[]> {
    if (!this.openai) {
      console.error('OpenAI not configured for enhanced search');
      return [];
    }

    try {
      // Step 1: Use ChatGPT to generate optimal search queries
      const searchQueries = await this.generateSmartSearchQueries(input);
      console.log('Generated search queries:', searchQueries);

      // Step 2: If Google Search is configured, use it
      let webResults: any[] = [];
      if (this.googleApiKey && this.searchEngineId) {
        console.log(`  → Performing Google searches with ${searchQueries.length} queries...`);
        // Use all queries instead of just 3
        for (const query of searchQueries) {
          console.log(`    Searching: "${query}"`);
          const results = await this.performGoogleSearch(query);
          console.log(`    Found ${results.length} results`);
          webResults.push(...results);
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        console.log(`  → Total web results: ${webResults.length}`);
      } else {
        console.log('  → Google Search not configured, skipping web search');
      }

      // Step 3: Use ChatGPT to analyze and extract vendor information
      // This simulates what ChatGPT does when it performs web searches
      const vendors = await this.extractVendorsFromSearchResults(input, webResults, searchQueries);
      
      return vendors;
    } catch (error) {
      console.error('Enhanced vendor search error:', error);
      return [];
    }
  }

  /**
   * Generate smart search queries using ChatGPT
   */
  private async generateSmartSearchQueries(input: MedicineVendorSearchInput): Promise<string[]> {
    if (!this.openai) return this.getDefaultQueries(input);

    try {
      const medicineName = input.medicineName || '';
      const dosage = input.dosage || '';
      const country = input.country || '';

      const messages = [
        {
          role: 'system' as const,
          content: 'You are a search query expert. Generate exactly 5 search queries for finding pharmaceutical suppliers. Return a JSON object with a single "queries" array containing 5 strings.',
        },
        {
          role: 'user' as const,
          content: `Generate 5 search queries for finding suppliers of: ${medicineName} ${dosage}

The queries should find:
- Pharmaceutical manufacturers
- Wholesale distributors
- B2B suppliers
- Hospital suppliers
- API manufacturers

Return exactly this format:
{"queries": ["query1", "query2", "query3", "query4", "query5"]}`
        },
      ];

      console.log('Requesting search queries from ChatGPT...');
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: messages,
        max_completion_tokens: 5000,
      });

      const content = response.choices[0].message.content || '';
      console.log('Raw ChatGPT response:', content);
      
      // Try to parse the response
      try {
        const parsed = JSON.parse(content);
        if (parsed.queries && Array.isArray(parsed.queries) && parsed.queries.length > 0) {
          console.log(`Successfully generated ${parsed.queries.length} queries`);
          return parsed.queries;
        }
      } catch (parseError) {
        console.error('Failed to parse ChatGPT response:', parseError);
      }
      
      // If parsing fails or no queries, use defaults
      console.log('Using default queries due to parsing issues');
      return this.getDefaultQueries(input);
      
    } catch (error) {
      console.error('Error generating search queries:', error);
      return this.getDefaultQueries(input);
    }
  }

  /**
   * Get default search queries
   */
  private getDefaultQueries(input: MedicineVendorSearchInput): string[] {
    const medicine = input.medicineName || 'pharmaceutical';
    const dosage = input.dosage || '';
    const country = input.country || '';
    
    return [
      `${medicine} ${dosage} pharmaceutical wholesaler ${country}`.trim(),
      `${medicine} bulk supplier distributor B2B ${country}`.trim(),
      `buy ${medicine} ${dosage} wholesale medical supplier`.trim(),
      `${medicine} API manufacturer pharmaceutical ${country}`.trim(),
      `${medicine} hospital supplier bulk purchase ${country}`.trim(),
    ].map(q => q.replace(/\s+/g, ' ').trim());
  }

  /**
   * Perform Google search
   */
  private async performGoogleSearch(query: string): Promise<any[]> {
    if (!this.googleApiKey || !this.searchEngineId) {
      console.warn('Google Search API not configured');
      return [];
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.googleApiKey,
          cx: this.searchEngineId,
          q: query,
          num: 10,  // Maximum allowed per query
        },
        timeout: 15000,
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Google search error:', error);
      return [];
    }
  }

  /**
   * Filter out non-commercial websites
   */
  private isNonVendorSite(url: string): boolean {
    const nonVendorPatterns = [
      // Reference and educational sites
      'wikipedia.org', 'webmd.com', 'drugs.com', 'rxlist.com',
      'medlineplus.gov', 'nih.gov', 'fda.gov', 'who.int',
      'pharmacopoeia', 'pubmed', 'ncbi', 'sciencedirect',
      '.gov', '.edu', 
      // Regulatory bodies
      'ema.europa.eu', 'medicines.org.uk', 'swissmedic.ch',
      // Generic non-commercial patterns
      'dictionary', 'encyclopedia', 'reference.com',
      'patient.info', 'healthline.com', 'mayoclinic.org'
    ];
    
    const lowerUrl = url.toLowerCase();
    return nonVendorPatterns.some(pattern => lowerUrl.includes(pattern));
  }

  /**
   * Extract vendor information from search results using ChatGPT
   * This mimics how ChatGPT analyzes web search results
   */
  private async extractVendorsFromSearchResults(
    input: MedicineVendorSearchInput,
    webResults: any[],
    searchQueries: string[]
  ): Promise<DiscoveredVendor[]> {
    if (!this.openai) return [];

    try {
      // Enhanced filtering - be more inclusive to get more vendors
      const filteredResults = webResults.filter(result => {
        const url = result.link?.toLowerCase() || '';
        const title = result.title?.toLowerCase() || '';
        const snippet = result.snippet?.toLowerCase() || '';
        
        // Skip obvious non-commercial sites
        const skipDomains = ['wikipedia.org', 'ncbi.nlm.nih.gov', 'pubmed.ncbi', 'who.int/publications'];
        if (skipDomains.some(domain => url.includes(domain))) return false;
        
        // Skip if it's just a PDF or document (unless it's a product catalog)
        if ((url.endsWith('.pdf') || url.endsWith('.doc')) && !url.includes('catalog') && !url.includes('product')) return false;
        
        // Include if it has any business-related terms
        const businessTerms = ['supplier', 'manufacturer', 'distributor', 'wholesale', 'pharma', 'chemical', 
                             'api', 'b2b', 'export', 'gmp', 'company', 'corp', 'inc', 'ltd', 'gmbh', 
                             'medical', 'healthcare', 'contrast', 'agent', 'iohexol', 'iodine'];
        const hasBusinessTerm = businessTerms.some(term => 
          title.includes(term) || snippet.includes(term) || url.includes(term)
        );
        
        // Include all results that might be vendors (be inclusive)
        return hasBusinessTerm || (!url.includes('.gov') && !url.includes('.edu'));
      });
      
      console.log(`  → Filtered ${webResults.length} results to ${filteredResults.length} potential vendors`);
      
      const searchResultsSummary = filteredResults.map(result => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        displayLink: result.displayLink || result.link,
      }));

      const prompt = `Extract ALL pharmaceutical companies from these ${searchResultsSummary.length} search results for ${input.medicineName}.

Search Results:
${searchResultsSummary.map((r, i) => `
Result ${i + 1}:
- Title: ${r.title}
- URL: ${r.link}
- Domain: ${r.displayLink || new URL(r.link).hostname}
- Snippet: ${r.snippet}
`).join('\n')}

EXTRACT EVERY COMPANY by looking at:
1. Domain names (e.g., bracco.com = Bracco company)
2. Company names in titles
3. Company names in snippets
4. Any manufacturer/supplier/distributor mentioned

Also ADD known suppliers of ${input.medicineName} from your knowledge.

Return JSON format:
{
  "vendors": [
    {
      "companyName": "Company Name (extract from domain, title, or snippet)",
      "businessType": "Manufacturer|Distributor|Wholesaler|Unknown",
      "website": "Use the link from result",
      "snippet": "Use the snippet from result",
      "confidence": 0.5-1.0,
      "sourceNote": "From search result X" or "Known supplier"
    }
  ]
}

BE INCLUSIVE - Extract EVERY possible company, even with 40% confidence!`;

      // Try without response_format first
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting vendor information. Extract EVERY company from the search results. Be VERY inclusive. Return a JSON object with a vendors array.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_completion_tokens: 8000,  // Increased even more
      });

      const responseContent = response.choices[0].message.content || '{"vendors": []}';
      console.log(`  → ChatGPT extraction response length: ${responseContent.length} chars`);
      
      let result;
      try {
        result = JSON.parse(responseContent);
      } catch (e) {
        console.error('  → Failed to parse ChatGPT response:', e);
        console.log('  → Raw response:', responseContent.substring(0, 500));
        result = { vendors: [] };
      }
      
      console.log(`  → ChatGPT extracted ${result.vendors?.length || 0} vendors from web results`);
      
      if (result.extractionStats) {
        console.log(`     Stats:`, result.extractionStats);
      }
      
      // If ChatGPT didn't extract enough vendors, use fallback extraction
      let vendors: DiscoveredVendor[] = [];
      
      if (result.vendors && result.vendors.length > 0) {
        // Convert ChatGPT results to DiscoveredVendor format
        vendors = result.vendors.map((v: any) => ({
          companyName: v.companyName,
          website: v.website,
          snippet: v.snippet,
          businessType: v.businessType || 'Unknown',
          confidence: v.confidence || 0.7,
          volumeIndicators: v.volumeIndicators || {
            bulkSupplier: true,
            servesHospitals: false,
            internationalShipping: false,
          },
          contactInfo: v.contactInfo,
          certifications: v.certifications || [],
          sourceUrl: v.website || '',
          foundOn: 'Google' as const,
        }));
      }
      
      // If we got few or no results from ChatGPT, use fallback extraction
      if (vendors.length < 5) {
        console.log(`  → Using fallback extraction due to low ChatGPT results (${vendors.length} vendors)`);
        const fallbackVendors = extractVendorsFromSearchResults(filteredResults, input.medicineName);
        console.log(`  → Fallback extraction found ${fallbackVendors.length} vendors`);
        
        // Merge vendors, avoiding duplicates
        const vendorMap = new Map<string, DiscoveredVendor>();
        vendors.forEach(v => vendorMap.set(v.website || v.companyName, v));
        fallbackVendors.forEach(v => {
          if (!vendorMap.has(v.website || v.companyName)) {
            vendorMap.set(v.website || v.companyName, v);
          }
        });
        vendors = Array.from(vendorMap.values());
      }
      
      // Always add known vendors
      const knownVendors = getKnownVendors(input.medicineName);
      console.log(`  → Adding ${knownVendors.length} known vendors`);
      
      // Merge with known vendors
      const finalVendorMap = new Map<string, DiscoveredVendor>();
      vendors.forEach(v => finalVendorMap.set(v.companyName.toLowerCase(), v));
      knownVendors.forEach(v => {
        if (!finalVendorMap.has(v.companyName.toLowerCase())) {
          finalVendorMap.set(v.companyName.toLowerCase(), v);
        }
      });
      
      return Array.from(finalVendorMap.values());
    } catch (error) {
      console.error('Error extracting vendors from results:', error);
      return [];
    }
  }
}

/**
 * Fallback function when Google Search is not configured
 * Uses pure ChatGPT knowledge to find vendors
 */
export async function searchWithChatGPTKnowledge(
  input: MedicineVendorSearchInput,
  openai: OpenAI
): Promise<DiscoveredVendor[]> {
  try {
    const prompt = `List ALL companies you know that manufacture, distribute, or supply:
Medicine: ${input.medicineName} ${input.dosage || ''}
Region: ${input.country || 'Global'}

Include EVERY company you can think of:
1. Original manufacturers (e.g., for Iohexol: GE Healthcare/Omnipaque, Bracco/Isovue, Guerbet, etc.)
2. Generic manufacturers (Indian, Chinese, European generics)
3. API manufacturers (companies that make the active ingredient)
4. Major distributors (McKesson, AmerisourceBergen, Cardinal Health, etc.)
5. Regional wholesalers
6. Specialty pharmaceutical suppliers
7. Contract manufacturers
8. B2B marketplaces that list this product

BE COMPREHENSIVE - List at least 15-20 companies if possible.
Include companies even if you're not 100% sure they carry this specific product.

Format as JSON with structure:
{
  "vendors": [
    {
      "companyName": "Name",
      "businessType": "Manufacturer|Distributor|Wholesaler",
      "website": "if known",
      "snippet": "Description of their relevance",
      "knownProducts": ["list of relevant products"],
      "geographicCoverage": ["countries/regions"],
      "servesHospitals": true/false,
      "certifications": ["GMP", "FDA", etc],
      "notes": "Additional relevant information"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a comprehensive pharmaceutical industry database. Your task is to list EVERY SINGLE company you know that could possibly supply the requested medicine. Be exhaustive - include manufacturers, generic companies, API suppliers, distributors, wholesalers, and B2B platforms. List 15-30+ companies when possible.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_completion_tokens: 8000,  // Increased to get more comprehensive results
    });

    const responseContent = response.choices[0].message.content || '{"vendors": []}';
    console.log(`  → ChatGPT knowledge response length: ${responseContent.length} chars`);
    
    let result;
    try {
      result = JSON.parse(responseContent);
    } catch (e) {
      console.error('  → Failed to parse knowledge response:', e);
      result = { vendors: [] };
    }
    
    console.log(`  → ChatGPT knowledge returned ${result.vendors?.length || 0} vendors`);
    
    // Convert to DiscoveredVendor format
    let vendors: DiscoveredVendor[] = (result.vendors || []).map((v: any) => ({
      companyName: v.companyName,
      website: v.website || '',
      snippet: v.snippet || `${v.businessType} - ${(v.geographicCoverage || []).join(', ')}`,
      businessType: v.businessType || 'Unknown',
      confidence: v.website ? 0.9 : 0.7, // Higher confidence if we have a website
      volumeIndicators: {
        bulkSupplier: v.businessType !== 'Retailer',
        servesHospitals: v.servesHospitals || false,
        internationalShipping: (v.geographicCoverage || []).length > 1,
      },
      contactInfo: {},
      certifications: v.certifications || [],
      sourceUrl: v.website || '',
      foundOn: 'Google' as const,
    }));
    
    // Always add known vendors as fallback
    const knownVendors = getKnownVendors(input.medicineName);
    console.log(`  → Adding ${knownVendors.length} known vendors to knowledge results`);
    
    // Merge with known vendors
    const vendorMap = new Map<string, DiscoveredVendor>();
    vendors.forEach(v => vendorMap.set(v.companyName.toLowerCase(), v));
    knownVendors.forEach(v => {
      if (!vendorMap.has(v.companyName.toLowerCase())) {
        vendorMap.set(v.companyName.toLowerCase(), v);
      }
    });

    return Array.from(vendorMap.values());
  } catch (error) {
    console.error('Error searching with ChatGPT knowledge:', error);
    return [];
  }
}
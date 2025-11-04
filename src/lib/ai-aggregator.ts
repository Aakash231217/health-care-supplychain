import OpenAI from 'openai';
import axios from 'axios';
import { DiscoveredVendor, MedicineVendorSearchInput } from './medicine-vendor-searcher';
import { WebSearchEnhanced, searchWithChatGPTKnowledge } from './web-search-enhanced';

/**
 * AI Aggregator - Combines results from multiple AI services and search engines
 * for comprehensive medicine vendor discovery
 */

export interface AISearchResult {
  source: 'ChatGPT' | 'Google' | 'Bing' | 'Perplexity' | 'Claude';
  vendors: DiscoveredVendor[];
  confidence: number;
  insights?: string[];
  rawData?: any;
}

export interface AggregatedSearchResult {
  medicineName: string;
  searchQuery: string;
  totalVendorsFound: number;
  uniqueVendors: DiscoveredVendor[];
  vendorsBySource: {
    [key: string]: DiscoveredVendor[];
  };
  aiInsights: {
    summary: string;
    marketAnalysis?: string;
    recommendations?: string[];
    warnings?: string[];
  };
  searchMetadata: {
    searchTime: number;
    sourcesUsed: string[];
    dataQuality: 'High' | 'Medium' | 'Low';
  };
}

export class AIAggregator {
  private openai: OpenAI | null = null;
  private googleApiKey: string;
  private searchEngineId: string;
  private bingApiKey: string;

  constructor() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        maxRetries: 2,
      });
      console.log('✅ OpenAI initialized for AI aggregation');
    }

    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    this.bingApiKey = process.env.BING_API_KEY || '';
  }

  /**
   * Main aggregation function - combines results from multiple AI sources
   */
  async aggregateVendorSearch(input: MedicineVendorSearchInput): Promise<AggregatedSearchResult> {
    const startTime = Date.now();
    console.log(`🔍 Starting AI-aggregated search for: ${input.medicineName} ${input.dosage || ''}`);

    const searchResults: AISearchResult[] = [];
    const sourcesUsed: string[] = [];

    // Prepare search queries
    const searchQuery = this.buildSearchQuery(input);

    // 1. Enhanced Web Search - Combines ChatGPT knowledge with web search
    if (this.openai) {
      try {
        // First, try enhanced web search if Google is configured
        if (this.googleApiKey && this.searchEngineId) {
          console.log('  → Performing enhanced web search with ChatGPT + Google...');
          const webSearchEnhanced = new WebSearchEnhanced();
          const enhancedResults = await webSearchEnhanced.enhancedVendorSearch(input);
          if (enhancedResults.length > 0) {
            searchResults.push({
              source: 'Google',
              vendors: enhancedResults,
              confidence: 0.85,
              insights: ['Enhanced search combining web results with AI analysis'],
            });
            sourcesUsed.push('Google + AI');
            console.log(`  ✓ Enhanced web search found ${enhancedResults.length} vendors`);
          }
        }
        
        // ALWAYS also search ChatGPT's knowledge base for additional vendors
        console.log('  → Searching ChatGPT knowledge base for additional vendors...');
        const knowledgeResults = await searchWithChatGPTKnowledge(input, this.openai);
        if (knowledgeResults.length > 0) {
          searchResults.push({
            source: 'ChatGPT',
            vendors: knowledgeResults,
            confidence: 0.8,
            insights: ['Additional vendors from ChatGPT knowledge base'],
          });
          sourcesUsed.push('ChatGPT Knowledge');
          console.log(`  ✓ ChatGPT knowledge found ${knowledgeResults.length} additional vendors`);
        }
        
      } catch (error) {
        console.error('  ✗ Search error:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // 2. Google Search - Get real vendor websites
    if (this.googleApiKey) {
      try {
        const googleResult = await this.searchWithGoogle(input, searchQuery);
        searchResults.push(googleResult);
        sourcesUsed.push('Google');
      } catch (error) {
        console.error('Google search error:', error);
      }
    }

    // 3. Bing Search - Additional coverage
    if (this.bingApiKey) {
      try {
        const bingResult = await this.searchWithBing(input, searchQuery);
        searchResults.push(bingResult);
        sourcesUsed.push('Bing');
      } catch (error) {
        console.error('Bing search error:', error);
      }
    }

    // 4. Use ChatGPT to analyze and combine all results
    console.log('  → Combining and analyzing results...');
    const aggregatedData = await this.combineAndAnalyzeResults(searchResults, input);

    // 5. Generate AI insights
    console.log('  → Generating AI insights...');
    const aiInsights = await this.generateAIInsights(aggregatedData, input);

    const searchTime = (Date.now() - startTime) / 1000;

    return {
      medicineName: input.medicineName + (input.dosage ? ` ${input.dosage}` : ''),
      searchQuery,
      totalVendorsFound: aggregatedData.uniqueVendors.length,
      uniqueVendors: aggregatedData.uniqueVendors,
      vendorsBySource: aggregatedData.vendorsBySource,
      aiInsights,
      searchMetadata: {
        searchTime,
        sourcesUsed,
        dataQuality: this.assessDataQuality(aggregatedData.uniqueVendors.length, sourcesUsed.length),
      },
    };
  }

  /**
   * Search using ChatGPT's knowledge
   */
  private async searchWithChatGPT(input: MedicineVendorSearchInput, searchQuery: string): Promise<AISearchResult> {
    if (!this.openai) {
      return { source: 'ChatGPT', vendors: [], confidence: 0 };
    }

    try {
      const prompt = `You are a pharmaceutical supply chain expert. Please provide a list of reputable wholesale suppliers, distributors, and manufacturers for the following medicine:

Medicine: ${input.medicineName}
Dosage: ${input.dosage || 'Any'}
Region: ${input.country || 'International'}

Please provide:
1. A list of specific companies that supply this medicine at wholesale/bulk quantities
2. Their business type (Wholesaler, Distributor, Manufacturer)
3. Their website if known
4. Any relevant certifications or qualifications
5. Contact information if available
6. Whether they serve hospitals or healthcare institutions

Focus on B2B suppliers, not retail pharmacies. Provide real companies, not generic suggestions.

Format your response as a JSON array of vendors with this structure:
{
  "vendors": [
    {
      "companyName": "Company Name",
      "businessType": "Wholesaler|Distributor|Manufacturer",
      "website": "https://example.com",
      "snippet": "Brief description",
      "certifications": ["GDP", "GMP"],
      "servesHospitals": true,
      "contactInfo": {
        "email": "email@example.com",
        "phone": "+1234567890"
      }
    }
  ],
  "marketInsights": "Any relevant insights about this medicine's supply chain"
}`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in pharmaceutical supply chains with extensive knowledge of global medicine suppliers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"vendors": []}');

      // Convert ChatGPT response to our vendor format
      const vendors: DiscoveredVendor[] = (result.vendors || []).map((v: any) => ({
        companyName: v.companyName,
        website: v.website,
        snippet: v.snippet || `${v.businessType} specializing in pharmaceutical distribution`,
        businessType: v.businessType || 'Unknown',
        confidence: 0.8, // High confidence for ChatGPT suggestions
        volumeIndicators: {
          bulkSupplier: true,
          servesHospitals: v.servesHospitals || false,
          internationalShipping: v.internationalShipping || false,
        },
        contactInfo: v.contactInfo,
        certifications: v.certifications || [],
        sourceUrl: v.website || '',
        foundOn: 'Google' as const, // We'll treat AI suggestions as if from Google for compatibility
      }));

      return {
        source: 'ChatGPT',
        vendors,
        confidence: 0.8,
        insights: result.marketInsights ? [result.marketInsights] : [],
        rawData: result,
      };
    } catch (error) {
      console.error('ChatGPT search error:', error);
      return { source: 'ChatGPT', vendors: [], confidence: 0 };
    }
  }

  /**
   * Search using Google Custom Search API
   */
  private async searchWithGoogle(input: MedicineVendorSearchInput, searchQuery: string): Promise<AISearchResult> {
    if (!this.googleApiKey || !this.searchEngineId) {
      return { source: 'Google', vendors: [], confidence: 0 };
    }

    try {
      const vendors: DiscoveredVendor[] = [];
      
      // Multiple search queries for better coverage
      const queries = [
        `${input.medicineName} ${input.dosage || ''} wholesale supplier ${input.country || ''}`,
        `${input.medicineName} pharmaceutical distributor B2B ${input.country || ''}`,
        `buy ${input.medicineName} bulk wholesale ${input.country || ''}`,
      ];

      for (const query of queries.slice(0, input.searchDepth || 2)) {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: this.googleApiKey,
            cx: this.searchEngineId,
            q: query,
            num: 10,
          },
          timeout: 10000,
        });

        const items = response.data.items || [];
        
        for (const item of items) {
          // Skip non-commercial sites
          if (this.isNonCommercialSite(item.link)) continue;
          
          vendors.push({
            companyName: this.extractCompanyName(item.title, item.link),
            website: item.link,
            snippet: item.snippet,
            businessType: this.detectBusinessType(item.snippet + ' ' + item.title),
            confidence: 0.6,
            sourceUrl: item.link,
            foundOn: 'Google',
          });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return {
        source: 'Google',
        vendors: this.deduplicateVendors(vendors),
        confidence: 0.7,
      };
    } catch (error) {
      console.error('Google search error:', error);
      return { source: 'Google', vendors: [], confidence: 0 };
    }
  }

  /**
   * Search using Bing Search API
   */
  private async searchWithBing(input: MedicineVendorSearchInput, searchQuery: string): Promise<AISearchResult> {
    if (!this.bingApiKey) {
      return { source: 'Bing', vendors: [], confidence: 0 };
    }

    try {
      const vendors: DiscoveredVendor[] = [];
      const query = `${input.medicineName} ${input.dosage || ''} wholesale supplier distributor ${input.country || ''}`;

      const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        params: {
          q: query,
          count: 20,
          mkt: input.country ? `en-${input.country}` : 'en-US',
        },
        headers: {
          'Ocp-Apim-Subscription-Key': this.bingApiKey,
        },
        timeout: 10000,
      });

      const webPages = response.data.webPages?.value || [];
      
      for (const page of webPages) {
        if (this.isNonCommercialSite(page.url)) continue;
        
        vendors.push({
          companyName: this.extractCompanyName(page.name, page.url),
          website: page.url,
          snippet: page.snippet,
          businessType: this.detectBusinessType(page.snippet + ' ' + page.name),
          confidence: 0.6,
          sourceUrl: page.url,
          foundOn: 'Google', // Use Google for compatibility
        });
      }

      return {
        source: 'Bing',
        vendors: this.deduplicateVendors(vendors),
        confidence: 0.7,
      };
    } catch (error) {
      console.error('Bing search error:', error);
      return { source: 'Bing', vendors: [], confidence: 0 };
    }
  }

  /**
   * Combine results from all sources and use AI to deduplicate and enhance
   */
  private async combineAndAnalyzeResults(
    searchResults: AISearchResult[],
    input: MedicineVendorSearchInput
  ): Promise<{ uniqueVendors: DiscoveredVendor[]; vendorsBySource: { [key: string]: DiscoveredVendor[] } }> {
    // Collect all vendors
    const allVendors: DiscoveredVendor[] = [];
    const vendorsBySource: { [key: string]: DiscoveredVendor[] } = {};

    for (const result of searchResults) {
      vendorsBySource[result.source] = result.vendors;
      allVendors.push(...result.vendors);
    }

    // Deduplicate by domain/company name
    const uniqueVendors = this.deduplicateVendors(allVendors);

    // Use AI to enhance vendor data if available
    if (this.openai && uniqueVendors.length > 0) {
      try {
        const enhancedVendors = await this.enhanceVendorsWithAI(uniqueVendors.slice(0, 20), input);
        return { uniqueVendors: enhancedVendors, vendorsBySource };
      } catch (error) {
        console.error('AI enhancement error:', error);
      }
    }

    return { uniqueVendors, vendorsBySource };
  }

  /**
   * Use AI to enhance vendor information
   */
  private async enhanceVendorsWithAI(vendors: DiscoveredVendor[], input: MedicineVendorSearchInput): Promise<DiscoveredVendor[]> {
    if (!this.openai) return vendors;

    try {
      const vendorList = vendors.map(v => ({
        name: v.companyName,
        website: v.website,
        snippet: v.snippet,
      }));

      const prompt = `Analyze these potential pharmaceutical vendors for ${input.medicineName} and enhance the information:

${JSON.stringify(vendorList, null, 2)}

For each vendor, provide:
1. Confirmed business type (Wholesaler, Distributor, Manufacturer, Retailer)
2. Likelihood they supply to hospitals/healthcare institutions (0-1)
3. Any known certifications
4. Geographic coverage
5. Specialization areas

Return a JSON array with enhanced vendor data.`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in pharmaceutical supply chain analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_completion_tokens: 1500,
    });

    const enhancedData = JSON.parse(response.choices[0].message.content || '[]');
    
    // Merge enhanced data with original vendors
    return vendors.map((vendor, index) => {
      const enhancement = enhancedData[index];
      if (enhancement) {
        return {
          ...vendor,
          businessType: enhancement.businessType || vendor.businessType,
          confidence: Math.max(vendor.confidence, enhancement.confidence || 0.7),
          volumeIndicators: {
            bulkSupplier: vendor.volumeIndicators?.bulkSupplier || false,
            minimumOrderQty: vendor.volumeIndicators?.minimumOrderQty,
            internationalShipping: vendor.volumeIndicators?.internationalShipping || false,
            ...vendor.volumeIndicators,
            servesHospitals: enhancement.servesHospitals || vendor.volumeIndicators?.servesHospitals || false,
          },
          certifications: enhancement.certifications || vendor.certifications,
        } as DiscoveredVendor;
      }
      return vendor;
    });
  } catch (error) {
    console.error('AI enhancement error:', error);
    return vendors;
  }
}

/**
 * Generate comprehensive AI insights about the search results
 */
private async generateAIInsights(
  aggregatedData: { uniqueVendors: DiscoveredVendor[]; vendorsBySource: { [key: string]: DiscoveredVendor[] } },
  input: MedicineVendorSearchInput
): Promise<any> {
  if (!this.openai || aggregatedData.uniqueVendors.length === 0) {
    return {
      summary: `Found ${aggregatedData.uniqueVendors.length} potential vendors for ${input.medicineName}`,
      recommendations: [],
    };
  }

  try {
    const vendorSummary = {
      total: aggregatedData.uniqueVendors.length,
      byType: this.categorizeVendorsByType(aggregatedData.uniqueVendors),
      topVendors: aggregatedData.uniqueVendors.slice(0, 5).map(v => ({
        name: v.companyName,
        type: v.businessType,
        confidence: v.confidence,
      })),
    };

    const prompt = `Analyze these medicine vendor search results and provide strategic insights:

Medicine: ${input.medicineName} ${input.dosage || ''}
Region: ${input.country || 'International'}
Vendors Found: ${JSON.stringify(vendorSummary, null, 2)}

Provide:
1. A brief summary of the vendor landscape
2. Market analysis (availability, competition, supply chain complexity)
3. Top 3-5 recommendations for procurement strategy
4. Any warnings or considerations
5. Suggested next steps

Format as JSON with keys: summary, marketAnalysis, recommendations (array), warnings (array), nextSteps (array)`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a pharmaceutical procurement strategist with expertise in global supply chains.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_completion_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const insights = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      summary: insights.summary || `Found ${aggregatedData.uniqueVendors.length} potential vendors`,
      marketAnalysis: insights.marketAnalysis,
      recommendations: insights.recommendations || [],
      warnings: insights.warnings || [],
      nextSteps: insights.nextSteps || [],
    };
  } catch (error) {
    console.error('AI insights generation error:', error);
    return {
      summary: `Found ${aggregatedData.uniqueVendors.length} potential vendors for ${input.medicineName}`,
      recommendations: ['Review vendor list', 'Contact top-rated suppliers', 'Verify certifications'],
    };
  }
}

  /**
   * Helper methods
   */
  
  private buildSearchQuery(input: MedicineVendorSearchInput): string {
    const parts = [input.medicineName];
    if (input.dosage) parts.push(input.dosage);
    parts.push('wholesale supplier distributor');
    if (input.country) parts.push(input.country);
    return parts.join(' ');
  }

  private isNonCommercialSite(url: string): boolean {
    const nonCommercial = [
      'wikipedia.org', 'webmd.com', 'drugs.com', 'rxlist.com',
      'medlineplus.gov', 'nih.gov', 'fda.gov', 'who.int',
      '.gov', '.edu', 'pubmed', 'ncbi', 'sciencedirect',
    ];
    
    const lowerUrl = url.toLowerCase();
    return nonCommercial.some(domain => lowerUrl.includes(domain));
  }

  private extractCompanyName(title: string, url: string): string {
    const titleMatch = title.match(/^([^-|]+)/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').split('.')[0];
  }

  private detectBusinessType(text: string): 'Wholesaler' | 'Distributor' | 'Retailer' | 'Manufacturer' | 'Unknown' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('wholesale') || lowerText.includes('wholesaler')) return 'Wholesaler';
    if (lowerText.includes('distributor') || lowerText.includes('distribution')) return 'Distributor';
    if (lowerText.includes('manufacturer') || lowerText.includes('manufacturing')) return 'Manufacturer';
    if (lowerText.includes('pharmacy') || lowerText.includes('drugstore')) return 'Retailer';
    if (lowerText.includes('bulk') || lowerText.includes('b2b')) return 'Wholesaler';
    
    return 'Unknown';
  }

  private deduplicateVendors(vendors: DiscoveredVendor[]): DiscoveredVendor[] {
    const seen = new Map<string, DiscoveredVendor>();
    
    for (const vendor of vendors) {
      const key = vendor.website ? new URL(vendor.website).hostname : vendor.companyName.toLowerCase();
      
      if (!seen.has(key)) {
        seen.set(key, vendor);
      } else {
        // If duplicate, keep the one with higher confidence
        const existing = seen.get(key)!;
        if (vendor.confidence > existing.confidence) {
          seen.set(key, vendor);
        }
      }
    }
    
    return Array.from(seen.values());
  }

  private categorizeVendorsByType(vendors: DiscoveredVendor[]): { [key: string]: number } {
    const categories: { [key: string]: number } = {
      Wholesaler: 0,
      Distributor: 0,
      Manufacturer: 0,
      Retailer: 0,
      Unknown: 0,
    };
    
    for (const vendor of vendors) {
      categories[vendor.businessType]++;
    }
    
    return categories;
  }

  private assessDataQuality(vendorCount: number, sourceCount: number): 'High' | 'Medium' | 'Low' {
    if (vendorCount >= 15 && sourceCount >= 3) return 'High';
    if (vendorCount >= 8 && sourceCount >= 2) return 'Medium';
    return 'Low';
  }


}
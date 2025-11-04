# AI-Aggregated Medicine Vendor Search

## Overview

The healthcare supply chain platform now features an advanced AI-aggregated search system that combines results from multiple sources:

- **ChatGPT/OpenAI**: Leverages AI knowledge for vendor recommendations and market insights
- **Google Search**: Finds actual vendor websites and contact information
- **Bing Search**: Provides additional coverage and regional results
- **AI Analysis**: Combines and analyzes all results for strategic insights

## How It Works

### 1. Multi-Source Search
When you search for medicine vendors, the system:
- Queries ChatGPT for known suppliers and market knowledge
- Searches Google for actual vendor websites
- Searches Bing for additional coverage
- Combines and deduplicates all results

### 2. AI Enhancement
The aggregator then:
- Uses AI to classify vendors (Wholesaler, Distributor, Manufacturer, Retailer)
- Analyzes vendor credibility and certifications
- Identifies bulk suppliers vs retail operations
- Provides confidence scores for each vendor

### 3. Strategic Insights
Finally, it generates:
- Market analysis for the specific medicine
- Procurement recommendations
- Risk warnings and considerations
- Suggested next steps

## Using the AI Aggregator

### Basic Search
```typescript
// In your component
const { mutate: searchVendors } = api.product.searchVendorsWithAI.useMutation();

searchVendors({
  medicineName: "Aspirin",
  dosage: "100mg",
  country: "USA",
  searchDepth: 3, // Number of search iterations
  includeMarketAnalysis: true,
  includeRecommendations: true,
});
```

### Search Results Structure
```typescript
{
  medicineName: string,
  vendorsFound: number,
  vendors: {
    all: DiscoveredVendor[],      // All vendors found
    wholesalers: DiscoveredVendor[],
    distributors: DiscoveredVendor[],
    manufacturers: DiscoveredVendor[],
    retailers: DiscoveredVendor[],
    uncategorized: DiscoveredVendor[]
  },
  vendorsBySource: {
    ChatGPT: DiscoveredVendor[],
    Google: DiscoveredVendor[],
    Bing: DiscoveredVendor[]
  },
  aiInsights: {
    summary: string,
    marketAnalysis: string,
    recommendations: string[],
    warnings: string[],
    nextSteps: string[]
  },
  searchMetadata: {
    searchTime: number,
    sourcesUsed: string[],
    dataQuality: 'High' | 'Medium' | 'Low'
  }
}
```

## Vendor Information

Each discovered vendor includes:
- **Company Name**: Extracted from search results
- **Website**: Direct link to vendor site
- **Business Type**: AI-classified category
- **Confidence Score**: 0.0 to 1.0 reliability score
- **Volume Indicators**:
  - Bulk supplier capability
  - Minimum order quantity
  - Hospital/healthcare serving
  - International shipping
- **Contact Information**: Email, phone (when available)
- **Certifications**: GDP, GMP, ISO, etc.

## API Configuration

### Required Environment Variables
```env
# OpenAI (ChatGPT) - Required for AI features
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview  # or gpt-3.5-turbo

# Google Search - Required for web search
GOOGLE_SEARCH_API_KEY=your-google-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# Bing Search - Optional for additional coverage
BING_API_KEY=your-bing-api-key
```

### Getting API Keys

#### OpenAI API Key
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API keys section
4. Create a new API key
5. Add billing method (pay-as-you-go)

#### Google Search API
1. Go to https://developers.google.com/custom-search/v1/overview
2. Enable the Custom Search API
3. Create credentials (API Key)
4. Create a Custom Search Engine at https://cse.google.com/
5. Get your Search Engine ID

#### Bing Search API
1. Go to https://azure.microsoft.com/en-us/services/cognitive-services/bing-web-search-api/
2. Create an Azure account
3. Create a Bing Search resource
4. Get your API key from the resource

## Advanced Features

### 1. Use Specific AI Sources
```typescript
// Use only specific sources
const result = await searchVendors({
  medicineName: "Metformin",
  sources: ["ChatGPT", "Google"], // Exclude Bing
});
```

### 2. Disable AI Aggregation
```typescript
// Use original search only (Google)
const result = await api.product.searchVendorsByMedicineName.mutate({
  medicineName: "Insulin",
  useAIAggregation: false, // Disable AI aggregation
});
```

### 3. Save Discovered Vendors
```typescript
// After finding vendors, save promising ones
const saveVendor = api.product.saveDiscoveredVendor.useMutation();

await saveVendor.mutate({
  companyName: vendor.companyName,
  website: vendor.website,
  businessType: vendor.businessType,
  contactInfo: vendor.contactInfo,
  certifications: vendor.certifications,
  productId: productId, // Link to specific product
});
```

## Best Practices

1. **Search Depth**: Use 2-3 for quick searches, 4-5 for comprehensive searches
2. **Region Specificity**: Include country for region-specific results
3. **Dosage Information**: Include dosage for more accurate vendor matching
4. **Review AI Insights**: Always check warnings and recommendations
5. **Verify Vendors**: AI results should be verified before engagement

## Cost Optimization

- **ChatGPT**: ~$0.01-0.02 per search with GPT-3.5-turbo
- **Google Search**: 100 searches/day free, then $5 per 1000
- **Bing Search**: Free tier available, paid tiers for volume

To reduce costs:
1. Use GPT-3.5-turbo instead of GPT-4
2. Reduce search depth for initial searches
3. Cache results for common medicines
4. Use `useAIAggregation: false` for simple searches

## Troubleshooting

### No Results Found
- Check API keys are correctly set
- Verify medicine name spelling
- Try without dosage information
- Check console for API errors

### Slow Search Performance
- Reduce search depth
- Use fewer AI sources
- Check network connectivity
- Consider caching results

### Poor Result Quality
- Increase search depth
- Include more specific information
- Review AI confidence scores
- Check data quality indicator

## Future Enhancements

Planned improvements:
- Integration with more AI services (Claude, Perplexity)
- Real-time vendor verification
- Price comparison features
- Automated vendor outreach
- Historical price tracking
- Supplier reliability scoring
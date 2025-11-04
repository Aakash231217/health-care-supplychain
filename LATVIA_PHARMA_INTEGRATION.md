# Latvia Pharmaceutical Registry Integration

## Overview
This integration fetches pharmaceutical data from the Latvia drug registry (https://dati.zva.gov.lv/zr-n-permissions/), including manufacturer information, ATC codes, and wholesaler details.

**Important Note**: The Latvia pharmaceutical registry is a dynamic Single Page Application (SPA) that loads data via JavaScript. Traditional web scraping with axios/cheerio won't work. We've implemented a Puppeteer-based solution to handle the dynamic content.

## Features

### 1. Web Scraper (`src/lib/latvia-pharma-scraper.ts`)
- Scrapes pharmaceutical data from the Latvia registry website
- Extracts the following information:
  - Drug name and dosage form
  - Registration number
  - Active ingredients
  - Manufacturer name and country
  - ATC codes
  - Wholesaler name, address, and license
  - Permit validity dates
- Supports pagination and batch processing
- Includes delay between requests to be respectful to the server
- Can export data to CSV format

### 2. Puppeteer Scraper (`src/lib/latvia-pharma-scraper-puppeteer.ts`)
**This is the recommended approach for the dynamic website**
- Uses headless Chrome to execute JavaScript
- Waits for dynamic content to load
- Extracts data after the page has fully rendered
- Supports pagination through multiple pages
- Handles dynamic table rendering

### 2. Database Schema
Added `LatviaPharmaRegistry` model to store scraped data:
```prisma
model LatviaPharmaRegistry {
  id                    String   @id @default(cuid())
  drugName              String
  dosageForm            String
  registrationNumber    String   @unique
  activeIngredient      String
  manufacturerName      String
  manufacturerCountry   String
  atcCode               String
  issuanceProcedure     String
  wholesalerName        String
  wholesalerAddress     String   @db.Text
  wholesalerLicense     String
  permitValidity        String
  lastUpdated           DateTime @default(now())
  createdAt             DateTime @default(now())

  @@index([atcCode])
  @@index([manufacturerName])
  @@index([wholesalerName])
  @@index([drugName])
}
```

### 3. TRPC Endpoints (`src/server/routers/latvia-pharma.ts`)
- **syncLatviaData**: Fetches and syncs data from the Latvia registry
- **searchLatviaRegistry**: Search functionality with filters (drug name, ATC code, manufacturer, wholesaler)
- **getLatviaStats**: Provides statistics about the data (total drugs, top manufacturers/wholesalers, ATC distribution)
- **getDrugByRegistration**: Get specific drug details by registration number

### 4. UI Integration
- Added sync button to the products page (`src/app/dashboard/products/page.tsx`)
- Created `LatviaPharmaSyncButton` component with:
  - Confirmation dialog before syncing
  - Progress indication during sync
  - Success/error notifications

## Usage

### Manual Sync via UI
1. Navigate to the Products page in the dashboard
2. Click "Sync Latvia Registry" button
3. Confirm the sync operation
4. Wait for the process to complete

### Testing the Scraper

**Basic scraper test (won't work with dynamic site):**
```bash
npm run test:latvia-scraper
```

**Puppeteer-based scraper test (recommended):**
```bash
npm run test:latvia-puppeteer
```

**Website analysis test:**
```bash
npm run test:latvia-website
```

### Using the TRPC API
```typescript
// Sync data
const result = await trpc.latviaPharma.syncLatviaData.mutate({
  pageSize: 50,
  maxPages: 10
});

// Search for drugs
const searchResults = await trpc.latviaPharma.searchLatviaRegistry.query({
  query: "aspirin",
  searchType: "drugName",
  limit: 20
});

// Get statistics
const stats = await trpc.latviaPharma.getLatviaStats.query();
```

## Configuration

### Scraper Options
- `pageSize`: Number of records per page (default: 50)
- `maxPages`: Maximum number of pages to scrape (default: 10)
- `delay`: Delay between requests in milliseconds (default: 1000)

## Troubleshooting

### Dynamic Website Issues
The Latvia registry is a Single Page Application (SPA) that requires JavaScript execution:
- Basic axios/cheerio scraping will return empty results
- Use the Puppeteer-based scraper instead
- Ensure Chrome/Chromium is available on your system

### DNS Resolution Issues
If you encounter "ENOTFOUND" errors, ensure:
1. Your internet connection is active
2. The Latvia registry website is accessible
3. No firewall/proxy is blocking the connection

### Rate Limiting
The scraper includes a delay between requests to avoid overwhelming the server. If you encounter rate limiting issues, increase the delay parameter.

## Deployment Considerations

### Puppeteer in Serverless Environments
Deploying Puppeteer to serverless platforms (Vercel, AWS Lambda) requires special configuration:

1. **Vercel**: Use `chrome-aws-lambda` package:
   ```bash
   npm install chrome-aws-lambda puppeteer-core
   ```

2. **AWS Lambda**: Use Lambda layers for Chrome binary

3. **Alternative**: Consider running the scraper as a separate service or scheduled job

### Resource Requirements
- Puppeteer requires more memory (512MB minimum)
- Longer execution times (may exceed serverless timeouts)
- Consider using background jobs or queues for large scraping tasks

## Data Quality
- All data is validated using Zod schemas before storage
- Duplicate records are handled via upsert operations based on registration number
- Failed records are logged but don't stop the entire sync process

## Future Enhancements
1. Add scheduled automatic syncing
2. Implement incremental updates (only fetch changes)
3. Add data comparison with existing product catalog
4. Create matching algorithm to link Latvia data with internal products
5. Add export functionality for matched data

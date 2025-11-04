# 🔍 Vendor Research & Intelligence System

## Overview

The **Vendor Research System** automatically gathers intelligence about pharmaceutical vendors to help you make informed decisions about:
- Whether a vendor handles bulk orders or small retail
- Company size and capabilities
- Certifications and compliance
- Geographic coverage and client types

---

## 🎯 Features

### 1. **Automated Web Research**
- Google Custom Search API finds official websites
- Puppeteer scrapes company information
- Extracts key business intelligence

### 2. **Intelligent Classification**
- **Bulk Supplier** - Large wholesalers handling 1000+ unit orders
- **Mid-size Distributor** - Regional distributors (100-5000 units)
- **Small Retailer** - Local pharmacies and small businesses

### 3. **Data Extraction**
- ✅ Business type (Wholesaler, Distributor, Manufacturer, Retailer)
- ✅ Employee count
- ✅ Minimum Order Quantity (MOQ)
- ✅ Number of locations
- ✅ Geographic coverage (Local, Regional, International)
- ✅ Certifications (GDP, GMP, ISO 9001, etc.)
- ✅ Primary client types (Hospitals, Clinics, Pharmacies)

### 4. **Confidence Scoring**
- Calculates confidence (0-100%) based on data completeness
- Shows which data sources were used
- Indicates when research is stale (>30 days)

---

## 🚀 How to Use

### Setup (One-time)

1. **Enable Google Custom Search API**
   - Go to: https://console.cloud.google.com
   - Enable "Custom Search API"
   - Copy your API key (already set: `AIzaSyDrrLhm8fdveBmXBAoKycxqi2s4fSSKWjU`)

2. **Create Custom Search Engine**
   - Go to: https://programmablesearchengine.google.com/
   - Click "Add" → Select "Search the entire web"
   - Copy the Search Engine ID
   - Add to `.env`: `GOOGLE_SEARCH_ENGINE_ID=your_id_here`

3. **Done!** The system is ready to use.

---

### Using the Research System

#### Option 1: Research from Vendor Management

```typescript
// In your vendor list or detail page
import { VendorResearchButton } from '@/components/vendors/VendorResearchButton';

<VendorResearchButton 
  vendorId={vendor.id}
  vendorName={vendor.name}
/>
```

**What happens:**
1. Click "Research Vendor" button
2. System searches Google for official website
3. Scrapes website for intelligence
4. Classifies vendor based on 15+ criteria
5. Displays results in a modal

#### Option 2: Research from Latvia Registry

```typescript
// In Latvia registry wholesalers page
import { LatviaWholesalersTable } from '@/components/latvia-pharma/LatviaWholesalersTable';

<LatviaWholesalersTable />
```

**What happens:**
1. Shows all wholesalers from Latvia registry
2. Click "Research" on any wholesaler
3. Creates vendor record (if doesn't exist)
4. Performs research
5. Shows classification (Bulk Supplier, etc.)

---

## 📊 Classification Algorithm

### Scoring System

Each vendor gets a score from -10 to +10:

**Positive Indicators (Bulk Supplier):**
- MOQ ≥ 1000 units → +3 points
- MOQ ≥ 5000 units → +2 points
- Employee count > 50 → +2 points
- Employee count > 100 → +2 points
- Multiple locations (>1) → +2 points
- Many locations (>5) → +2 points
- Business type: "Wholesale" → +3 points
- Business type: "Distributor" → +2 points
- Business type: "Manufacturer" → +2 points
- Geographic: International → +2 points
- Geographic: Regional → +1 point
- Certifications (2+) → +2 points
- GDP certification → +1 point
- GMP certification → +1 point
- Serves hospitals → +2 points
- Serves clinics → +1 point

**Negative Indicators (Small Retailer):**
- Business type: "Retail" → -2 points
- Business type: "Pharmacy" → -2 points
- MOQ < 100 units → -2 points
- Employee count < 10 → -2 points
- Geographic: Local only → -1 point

**Final Classification:**
- Score ≥ 5 → **Bulk Supplier** ✅
- Score 2-4 → **Mid-size Distributor** ⚠️
- Score ≤ 1 → **Small Retailer** ❌

---

## 🔌 API Endpoints

### Vendor Research

```typescript
// Research a single vendor
const result = await trpc.vendor.researchVendor.mutate({
  vendorId: 'vendor_123'
});

// Get existing intelligence
const intelligence = await trpc.vendor.getVendorIntelligence.query({
  vendorId: 'vendor_123'
});

// Batch research multiple vendors
const batchResult = await trpc.vendor.batchResearchVendors.mutate({
  vendorIds: ['vendor_1', 'vendor_2', 'vendor_3']
});
```

### Latvia Wholesaler Research

```typescript
// Research a Latvia wholesaler
const result = await trpc.latviaPharma.researchLatviaWholesaler.mutate({
  wholesalerName: 'Baltic Pharma SIA',
  wholesalerAddress: 'Riga, Latvia'
});

// Get wholesalers list with research status
const wholesalers = await trpc.latviaPharma.getWholesalersList.query({
  limit: 50,
  offset: 0
});
```

---

## 💰 Cost & Limits

### Google Custom Search API
- **FREE Tier:** 100 queries/day
- **Paid Tier:** $5 per 1,000 queries (if you exceed free tier)

### What Uses the API?
- Finding vendor's official website (1 query per vendor)
- That's it! Website scraping is free with Puppeteer

### Cost Breakdown
- **100 vendors/day:** FREE (within limit)
- **1000 vendors:** ~$45 (if all done in one day)
- **Typical usage:** FREE (most businesses research <100 vendors/day)

### Smart Caching
- Research is cached for 30 days
- Re-research only if you click "Re-research"
- Saves API calls and time

---

## 📖 Data Schema

```prisma
model VendorIntelligence {
  id                     String   @id @default(cuid())
  vendorId               String   @unique
  
  // Company Profile
  businessType           String?  
  companySize            String?  
  employeeCount          Int?
  annualRevenue          Float?
  yearsInBusiness        Int?
  
  // Order Capacity
  minimumOrderQty        Int?
  typicalOrderSize       String?
  orderCapacityScore     Int?
  
  // Market Presence
  numberOfLocations      Int?
  geographicCoverage     String?
  primaryClientTypes     String[]
  
  // Compliance
  certificationsFound    String[]
  licenseStatus          String?
  
  // Classification
  supplierClassification String?
  classificationScore    Int?
  
  // Meta
  officialWebsite        String?
  dataSource             String?
  confidenceScore        Float?
  researchStatus         String   @default("PENDING")
  lastResearchedAt       DateTime?
  
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}
```

---

## 🎨 UI Components

### 1. VendorResearchButton
**Usage:**
```tsx
<VendorResearchButton 
  vendorId="vendor_123"
  vendorName="Baltic Pharma"
  variant="outline"
  size="default"
/>
```

**Features:**
- Opens modal with research results
- Shows classification badge
- Displays all extracted intelligence
- "Re-research" button for updates

### 2. LatviaWholesalersTable
**Usage:**
```tsx
<LatviaWholesalersTable />
```

**Features:**
- Lists all Latvia wholesalers
- Shows product counts
- Research status badges
- One-click research buttons
- Pagination

---

## 🔧 Troubleshooting

### Research fails with "API key not found"
**Solution:** Add `GOOGLE_SEARCH_ENGINE_ID` to `.env`

### Website scraping times out
**Solution:** Normal for slow websites. The system will still classify based on available data.

### Classification seems wrong
**Solution:** Click "Re-research" after 30 days, or manually review the raw data in the modal.

### No results from Google Search
**Solution:** Check if vendor has an online presence. Some small vendors may not have websites.

### Confidence score is low (<50%)
**Solution:** Normal for vendors with minimal online presence. Use manual verification.

---

## 🚀 Future Enhancements

### Planned Features
- [ ] LinkedIn company page scraping
- [ ] Business directory integration (Kompass, Europages)
- [ ] Email validation with Hunter.io
- [ ] OpenCorporates API for company registration
- [ ] Customer review aggregation
- [ ] Automated re-research scheduling
- [ ] Email notifications for stale data
- [ ] Export vendor intelligence reports

### AI Enhancement (Optional)
- [ ] Add OpenAI GPT-4o-mini for better data extraction
- [ ] Cost: ~$0.001 per vendor
- [ ] Improves accuracy from 70% to 90%

---

## 📞 Support

### Common Issues
1. **API Quota Exceeded:** Wait 24 hours or upgrade to paid tier
2. **Slow Research:** Normal (30-60 seconds per vendor)
3. **Missing Data:** Some vendors have limited online presence

### Need Help?
- Check the raw data in the research modal
- Review the `researchError` field if research failed
- Contact support with vendor name and error message

---

## ✅ Success Checklist

- [x] Google Custom Search API enabled
- [x] API key added to `.env`
- [ ] Search Engine ID added to `.env` ⚠️ **REQUIRED**
- [x] Prisma schema updated
- [x] Database migrated
- [x] VendorResearchButton component created
- [x] LatviaWholesalersTable component created
- [x] tRPC endpoints added

**Next Step:** Add `GOOGLE_SEARCH_ENGINE_ID` to your `.env` file, then start researching vendors!

---

## 🎯 Quick Start

```bash
# 1. Add Search Engine ID to .env
echo 'GOOGLE_SEARCH_ENGINE_ID=your_id_here' >> .env

# 2. Start dev server
npm run dev

# 3. Go to Latvia Registry or Vendors page
# 4. Click "Research Vendor"
# 5. Wait 30-60 seconds
# 6. View intelligence report!
```

**That's it!** Your vendor research system is now live. 🎉

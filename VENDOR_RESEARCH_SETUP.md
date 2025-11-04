# 🚀 Vendor Research System - Quick Setup

## ⚠️ ONE MISSING STEP

Your vendor research system is **99% complete**! You just need to add the **Google Search Engine ID**.

---

## 📝 Setup Instructions (5 Minutes)

### Step 1: Create Google Custom Search Engine

1. **Go to:** https://programmablesearchengine.google.com/

2. **Click:** "Add" or "Create" button

3. **Configure:**
   - **Search engine name:** "Vendor Research Engine"
   - **What to search:** Select "Search the entire web"
   - **Language:** English (or your preference)

4. **Click:** "Create"

5. **Copy the Search Engine ID**
   - It looks like: `a1b2c3d4e5f6g7h8i`
   - Or: `017576662512468239146:omuauf_lfve`

### Step 2: Add to Environment Variables

1. **Open:** `d:\telegram\healthcare-supply-chain\.env`

2. **Find this line:**
   ```env
   GOOGLE_SEARCH_ENGINE_ID=""  # Create at: https://programmablesearchengine.google.com/
   ```

3. **Replace with your ID:**
   ```env
   GOOGLE_SEARCH_ENGINE_ID="a1b2c3d4e5f6g7h8i"
   ```

### Step 3: Restart Dev Server

```powershell
# Stop the current server (Ctrl+C)
# Then restart:
cd d:\telegram\healthcare-supply-chain
npm run dev
```

---

## ✅ Verification

### Test if it's working:

1. **Go to:** http://localhost:3000/dashboard/vendors

2. **Click:** "Research Vendor" on any vendor

3. **Wait:** 30-60 seconds

4. **You should see:**
   - ✅ Intelligence modal opens
   - ✅ Classification badge (Bulk Supplier, etc.)
   - ✅ Company information displayed
   - ✅ Confidence score shown

### If you see errors:

**Error:** "Search Engine ID not found"
- **Fix:** Double-check the ID in `.env` is correct
- **Fix:** Make sure there are no spaces or quotes around the ID
- **Fix:** Restart the dev server

**Error:** "API quota exceeded"
- **Fix:** Wait 24 hours (100/day free limit)
- **Fix:** Or upgrade to paid tier ($5 per 1,000 searches)

---

## 🎯 What You Can Do Now

Once setup is complete:

### 1. Research Individual Vendors
```
Dashboard → Vendors → Click any vendor → "Research Vendor"
```
- ✅ See if they handle bulk orders
- ✅ View employee count
- ✅ Check certifications (GDP, GMP)
- ✅ See geographic coverage

### 2. Research Latvia Wholesalers
```
Dashboard → Latvia Registry → Wholesalers Tab
```
- ✅ Click "Research" on any wholesaler
- ✅ Auto-creates vendor if doesn't exist
- ✅ Shows classification immediately
- ✅ View full intelligence report

### 3. Batch Research
```typescript
// Research multiple vendors at once (up to 10)
await trpc.vendor.batchResearchVendors.mutate({
  vendorIds: ['id1', 'id2', 'id3']
});
```

---

## 💡 Tips for Best Results

### 1. **Research Rate**
- Don't research more than 100 vendors/day (free limit)
- Research is cached for 30 days (no repeat costs)

### 2. **When to Research**
- ✅ Before sending RFQ (know if they handle bulk orders)
- ✅ When adding new vendors from Latvia registry
- ✅ Every 30 days for active vendors (data refresh)
- ✅ When vendor changes business model

### 3. **Interpreting Results**

**High Confidence (70-100%):**
- Trust the classification
- Sufficient data found online
- Use for decision-making

**Medium Confidence (40-70%):**
- Review the data manually
- Some information missing
- Consider manual verification

**Low Confidence (<40%):**
- Vendor has minimal online presence
- Use with caution
- Manual research recommended

### 4. **Classification Meanings**

**Bulk Supplier** (Score ≥ 5)
- ✅ Handles large orders (1000+ units)
- ✅ Multiple locations
- ✅ International coverage
- ✅ GDP/GMP certified
- ✅ Serves hospitals/clinics
- **→ Best for bulk procurement**

**Mid-size Distributor** (Score 2-4)
- ⚠️ Moderate order capacity (100-5000 units)
- ⚠️ Regional coverage
- ⚠️ Some certifications
- **→ Good for medium orders**

**Small Retailer** (Score ≤ 1)
- ❌ Small orders only (<100 units)
- ❌ Local coverage
- ❌ Retail-focused
- **→ Avoid for bulk procurement**

---

## 🔧 Advanced Configuration (Optional)

### Customize Classification Thresholds

Edit `src/lib/vendor-researcher.ts`:

```typescript
// Change classification thresholds
if (score >= 5) {
  classification = 'Bulk Supplier';  // Change to 7 for stricter
} else if (score >= 2) {
  classification = 'Mid-size Distributor';  // Change to 3
} else {
  classification = 'Small Retailer';
}
```

### Add Custom Extraction Patterns

```typescript
// Add to extractEmployeeCount() method
/(\d+)\s*staff\s*members/i,
/workforce\s+of\s+(\d+)/i,
```

### Adjust Confidence Scoring

```typescript
// In calculateConfidenceScore() method
const fields = [
  'businessType',
  'employeeCount',
  'minimumOrderQty',
  'numberOfLocations',
  'geographicCoverage',
  'certificationsFound',
  'primaryClientTypes',
  'officialWebsite',
  'yourCustomField',  // Add your field
];
```

---

## 📊 Monitoring & Analytics

### View Research Status

```sql
-- Check how many vendors have been researched
SELECT 
  research_status,
  COUNT(*) as count
FROM "VendorIntelligence"
GROUP BY research_status;

-- Find vendors needing re-research (>30 days old)
SELECT 
  v.name,
  vi.last_researched_at,
  vi.supplier_classification
FROM "VendorIntelligence" vi
JOIN "Vendor" v ON v.id = vi.vendor_id
WHERE vi.last_researched_at < NOW() - INTERVAL '30 days'
  AND vi.research_status = 'COMPLETED';
```

### Research Statistics

```typescript
// Get research stats
const stats = await prisma.vendorIntelligence.groupBy({
  by: ['supplierClassification'],
  _count: true,
});

// Output:
// Bulk Supplier: 45
// Mid-size Distributor: 23
// Small Retailer: 12
```

---

## 🎉 You're All Set!

Once you complete the setup:

1. ✅ Add `GOOGLE_SEARCH_ENGINE_ID` to `.env`
2. ✅ Restart dev server
3. ✅ Test on a vendor
4. ✅ Start making data-driven decisions!

**Questions?** Check `VENDOR_RESEARCH_GUIDE.md` for full documentation.

---

## 🚨 Troubleshooting

### Common Issues

**Issue:** "Cannot find module 'cheerio'"
```powershell
npm install cheerio
```

**Issue:** "Puppeteer browser not found"
```powershell
npx puppeteer browsers install chrome
```

**Issue:** "TRPC endpoint not found"
```powershell
npm run dev  # Restart server
```

**Issue:** "Database sync error"
```powershell
npx prisma generate
npx prisma db push
```

---

## 📞 Need Help?

1. **Check logs:** Console will show detailed error messages
2. **Review documentation:** `VENDOR_RESEARCH_GUIDE.md`
3. **Check API status:** https://console.cloud.google.com
4. **Test API key:** Try a manual Google search request

---

**Ready? Let's set up that Search Engine ID and start researching vendors!** 🚀

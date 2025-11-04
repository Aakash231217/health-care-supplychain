# Latvia Pharmaceutical Registry Integration

## Overview
This feature integrates the Latvia pharmaceutical registry data with your healthcare supply chain system to help find suppliers for medicines in your Excel database.

## How It Works

### 1. Data Flow
```
Excel Sheet → Product Database → Match with Latvia Registry → Find Suppliers
```

### 2. Matching Strategy
- **Primary Match**: Active substance/ingredient (exact or fuzzy match)
- **Secondary Filter**: Pharmaceutical form/dosage form
- **Optional**: Concentration matching from drug names

### 3. Features

#### Single Product Search
- Search for suppliers by entering active substance name
- Optional pharmaceutical form filter
- View detailed supplier information including:
  - Wholesaler name, address, and license
  - Manufacturer details
  - Available product variations

#### Batch Supplier Matching
- Automatically match multiple products from your Excel imports
- Process up to 20 products at once
- View summary statistics:
  - Total products analyzed
  - Products with matches found
  - Total suppliers discovered
  - Match success rate

## Usage

### 1. Sync Latvia Registry Data
1. Go to Product Management page
2. Click "Sync Latvia Registry" button
3. Wait for data synchronization to complete

### 2. Find Suppliers
1. From Product Management, click "Find Suppliers"
2. Choose between:
   - **Single Product Search**: Search for one product at a time
   - **Batch Matching**: Match multiple products from your database

### 3. Integration with Excel Data

Your Excel columns map to Latvia registry fields:
- `Active substance` → `activeIngredient`
- `Pharmaceutical form` → `dosageForm`
- `Concentration` → Extracted from `drugName`

### API Endpoints

#### TRPC Routes
- `latviaPharma.syncLatviaData` - Sync registry data
- `latviaPharma.findSuppliersForProduct` - Find suppliers for single product
- `latviaPharma.matchExcelProductsWithSuppliers` - Batch match products
- `latviaPharma.searchLatviaRegistry` - Search registry data

## Benefits

1. **Discover Alternative Suppliers**: Find new wholesalers for your pharmaceutical products
2. **Validate Existing Vendors**: Cross-reference your current suppliers
3. **Expand Supply Chain**: Access Latvia's pharmaceutical distribution network
4. **Compliance**: All suppliers come with license information

## Technical Details

- **Scraping**: Uses Puppeteer for dynamic content extraction
- **Database**: PostgreSQL with indexed fields for fast searching
- **Matching Algorithm**: Case-insensitive fuzzy matching with scoring
- **Performance**: Batch processing to handle large datasets efficiently

import { PharmaceuticalExcelParser } from '../src/lib/pharma-excel-parser';
import path from 'path';

async function testPharmaParser() {
  const excelPath = path.join(process.cwd(), 'excel-db', 'NIkita.xlsx');
  console.log('💊 Parsing Pharmaceutical Excel File');
  console.log('====================================\n');

  try {
    const parser = new PharmaceuticalExcelParser(excelPath);
    
    // Get summary first
    console.log('📊 File Summary:');
    const summary = await parser.getSummary();
    console.log(`• Total Products: ${summary.totalProducts}`);
    console.log(`• Total Quantity Required (3 years): ${summary.totalQuantityRequired.toLocaleString()} units`);
    console.log(`• Price Range: €${summary.priceRange.min} - €${summary.priceRange.max}`);
    console.log(`• Vendors: ${summary.vendors.join(', ')}`);
    console.log('\n📁 Categories:');
    Object.entries(summary.categories).forEach(([category, count]) => {
      console.log(`  • ${category}: ${count} products`);
    });
    
    // Parse and show sample products
    const { transformedProducts, errors } = await parser.parse();
    
    console.log('\n\n💊 Sample Products (First 3):');
    console.log('================================');
    
    transformedProducts.slice(0, 3).forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Unit: ${product.unitOfMeasure}`);
      console.log(`   Concentration: ${product.concentration}`);
      console.log(`   Quantity Required (3 years): ${product.quantityRequired}`);
      console.log(`   Vendors:`);
      product.vendors.forEach(vendor => {
        console.log(`     • ${vendor.name}: €${vendor.price} (Rank #${vendor.rank})`);
      });
    });
    
    // Show vendor price comparison
    console.log('\n\n💰 Price Comparison (First 5 products):');
    console.log('========================================');
    transformedProducts.slice(0, 5).forEach(product => {
      if (product.vendors.length > 0) {
        const prices = product.vendors.map(v => `${v.name}: €${v.price}`).join(' | ');
        console.log(`${product.name.substring(0, 50)}...`);
        console.log(`  ${prices}`);
        
        // Calculate best price
        const bestVendor = product.vendors.reduce((best, current) => 
          current.price < best.price ? current : best
        );
        const savings = product.vendors[product.vendors.length - 1].price - bestVendor.price;
        console.log(`  🏆 Best: ${bestVendor.name} (Save €${savings.toFixed(2)} per unit)\n`);
      }
    });
    
    if (errors.length > 0) {
      console.log('\n⚠️ Parsing Errors:');
      console.log(`Found ${errors.length} rows with errors`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Run the test
testPharmaParser();

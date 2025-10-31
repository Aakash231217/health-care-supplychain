import { PharmaceuticalExcelParser } from '../src/lib/pharma-excel-parser';
import path from 'path';

async function testLargeExcelProcessing() {
  console.log('🧪 Testing Large Excel File Processing');
  console.log('=====================================\n');
  
  // Replace with your actual Excel file path
  const excelPath = path.join(process.cwd(), 'excel-db', 'NIkita.xlsx');
  
  try {
    const parser = new PharmaceuticalExcelParser(excelPath);
    
    // Check if file needs chunking
    const fileInfo = await parser.needsChunkedProcessing();
    console.log('📊 File Analysis:');
    console.log(`- File Size: ${fileInfo.fileSize.toFixed(2)} MB`);
    console.log(`- Estimated Rows: ${fileInfo.estimatedRows}`);
    console.log(`- Recommend Chunking: ${fileInfo.recommendChunking ? 'Yes' : 'No'}`);
    console.log();
    
    if (fileInfo.recommendChunking) {
      console.log('📦 Processing file in chunks...\n');
      
      const result = await parser.parseChunked(async (chunk) => {
        console.log(`✅ Processed chunk: ${chunk.products.length} products (${chunk.progress.toFixed(1)}% complete)`);
        if (chunk.errors.length > 0) {
          console.log(`⚠️  Errors in chunk: ${chunk.errors.length}`);
        }
      });
      
      console.log('\n📈 Final Results:');
      console.log(`- Total Products Processed: ${result.totalProducts}`);
      console.log(`- Total Errors: ${result.totalErrors}`);
    } else {
      // Process normally for smaller files
      console.log('📄 Processing file normally...');
      const result = await parser.parse();
      
      console.log('\n📈 Results:');
      console.log(`- Total Rows: ${result.totalRows}`);
      console.log(`- Processed Rows: ${result.processedRows}`);
      console.log(`- Transformed Products: ${result.transformedProducts.length}`);
      console.log(`- Errors: ${result.errors.length}`);
      
      // Show first few products
      if (result.transformedProducts.length > 0) {
        console.log('\n📋 First 3 Products:');
        result.transformedProducts.slice(0, 3).forEach((product, idx) => {
          console.log(`\n${idx + 1}. ${product.name}`);
          console.log(`   SKU: ${product.sku}`);
          console.log(`   Category: ${product.category}`);
          console.log(`   Vendors: ${product.vendors.length}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testLargeExcelProcessing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

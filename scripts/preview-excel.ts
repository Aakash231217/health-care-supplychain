import { ExcelParser } from '../src/lib/excel-parser';
import path from 'path';

async function previewExcel() {
  const excelPath = path.join(process.cwd(), 'excel-db', 'NIkita.xlsx');
  console.log('📊 Previewing Excel file:', excelPath);
  console.log('----------------------------------------\n');

  try {
    const parser = new ExcelParser(excelPath);
    
    // Get preview data
    const preview = await parser.preview();
    
    console.log('📋 Sheet Names:', preview.sheetNames);
    console.log('\n');
    
    // Display data from each sheet
    for (const sheetName of preview.sheetNames) {
      console.log(`\n📄 Sheet: "${sheetName}"`);
      console.log('Headers:', preview.headers[sheetName]);
      console.log('\nSample Data (first 5 rows):');
      
      const data = preview.sheetsData[sheetName];
      data.forEach((row, index) => {
        console.log(`\nRow ${index + 1}:`, JSON.stringify(row, null, 2));
      });
    }
    
    // Try to parse as products
    console.log('\n\n🔍 Attempting to parse as products...');
    const parseResult = await parser.parse();
    
    if (parseResult.products.length > 0) {
      console.log(`✅ Successfully parsed ${parseResult.products.length} products\n`);
      console.log('Sample products:');
      parseResult.products.slice(0, 3).forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`, JSON.stringify(product, null, 2));
      });
    }
    
    if (parseResult.errors.length > 0) {
      console.log('\n⚠️  Parsing errors:');
      parseResult.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error}`);
      });
      if (parseResult.errors.length > 5) {
        console.log(`  ... and ${parseResult.errors.length - 5} more errors`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Run the preview
previewExcel();

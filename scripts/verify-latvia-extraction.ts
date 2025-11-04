import puppeteer from 'puppeteer';

async function verifyLatviaExtraction() {
  console.log('🔍 Verifying Latvia Pharmaceutical Registry Data Extraction');
  console.log('=========================================================\n');

  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📡 Navigating to: https://dati.zva.gov.lv/zr-n-permissions/');
    await page.goto('https://dati.zva.gov.lv/zr-n-permissions/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Extract first 5 rows for verification
    const extractedData = await page.evaluate(() => {
      const data: any[] = [];
      const rows = document.querySelectorAll('table tbody tr');
      
      // Process first 5 rows
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');
        
        if (cells.length >= 7) {
          const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim() || '');
          
          // Column 0: Name, strength/concentration, dosage form, ID
          const firstCellLines = cellTexts[0].split('\n').map(line => line.trim()).filter(line => line);
          
          // Column 5: Wholesaler info
          const wholesalerLines = cellTexts[5].split('\n').map(line => line.trim()).filter(line => line);
          
          data.push({
            rowIndex: i,
            cellCount: cells.length,
            rawData: cellTexts,
            parsed: {
              column0_lines: firstCellLines,
              drugName: firstCellLines[0] || '',
              activeIngredient: cellTexts[1],
              manufacturer: cellTexts[2],
              atcCode: cellTexts[3],
              issuanceProcedure: cellTexts[4],
              wholesaler_lines: wholesalerLines,
              wholesalerName: wholesalerLines[0] || '',
              permitValidity: cellTexts[6]
            }
          });
        }
      }
      
      return data;
    });
    
    console.log('\n📊 Extracted Data from First 5 Rows:\n');
    
    extractedData.forEach((row, index) => {
      console.log(`\n===== Row ${index + 1} =====`);
      console.log('Cell Count:', row.cellCount);
      console.log('\nColumn 0 (Drug Info):');
      row.parsed.column0_lines.forEach((line: string, i: number) => {
        console.log(`  [${i}] ${line}`);
      });
      console.log('\nColumn 1 (Active Ingredient):', row.parsed.activeIngredient);
      console.log('Column 2 (Manufacturer):', row.parsed.manufacturer);
      console.log('Column 3 (ATC Code):', row.parsed.atcCode);
      console.log('Column 4 (Issuance):', row.parsed.issuanceProcedure);
      console.log('\nColumn 5 (Wholesaler Info):');
      row.parsed.wholesaler_lines.forEach((line: string, i: number) => {
        console.log(`  [${i}] ${line}`);
      });
      console.log('\nColumn 6 (Permit Valid):', row.parsed.permitValidity);
    });
    
    // Check for patterns in registration numbers
    console.log('\n\n📋 Registration Number Patterns:');
    extractedData.forEach((row, index) => {
      const firstCell = row.rawData[0];
      const regNumMatch = firstCell.match(/N\d{6}-\d{2}$/);
      console.log(`Row ${index + 1}: ${regNumMatch ? regNumMatch[0] : 'Not found in: ' + firstCell.substring(firstCell.length - 20)}`);
    });
    
    // Check wholesaler license patterns
    console.log('\n📜 Wholesaler License Patterns:');
    extractedData.forEach((row, index) => {
      const lines = row.parsed.wholesaler_lines;
      const possibleLicense = lines.find((line: string) => /LV-\d+/.test(line)) || lines[lines.length - 1];
      console.log(`Row ${index + 1}: ${possibleLicense}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run verification
verifyLatviaExtraction().catch(console.error);

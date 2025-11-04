import axios from 'axios';
import * as cheerio from 'cheerio';

async function testLatviaWebsite() {
  console.log('🔍 Testing Latvia Pharmaceutical Website');
  console.log('=====================================\n');
  
  const url = 'https://dati.zva.gov.lv/zr-n-permissions/';
  
  try {
    console.log(`📡 Fetching: ${url}\n`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000,
    });
    
    console.log(`✅ Response Status: ${response.status}`);
    console.log(`📄 Content Type: ${response.headers['content-type']}`);
    console.log(`📏 Content Length: ${response.data.length} characters\n`);
    
    const $ = cheerio.load(response.data);
    
    // Check for common elements
    console.log('🔍 Page Analysis:');
    console.log(`- Title: ${$('title').text()}`);
    console.log(`- Tables found: ${$('table').length}`);
    console.log(`- Forms found: ${$('form').length}`);
    console.log(`- Scripts found: ${$('script').length}`);
    console.log(`- Links found: ${$('a').length}\n`);
    
    // Look for any Angular/React/Vue indicators
    if ($('[ng-app]').length > 0 || $('[ng-controller]').length > 0) {
      console.log('⚡ Angular app detected');
    }
    if ($('#root').length > 0 || $('[data-reactroot]').length > 0) {
      console.log('⚡ React app detected');
    }
    if ($('#app').length > 0) {
      console.log('⚡ Vue app detected');
    }
    
    // Check for table headers
    console.log('\n📋 Table Headers:');
    $('table').each((i, table) => {
      const headers = $(table).find('th').map((j, th) => $(th).text().trim()).get();
      if (headers.length > 0) {
        console.log(`Table ${i + 1}: ${headers.join(' | ')}`);
      }
    });
    
    // Check for any data rows
    console.log('\n📊 Data Rows:');
    let rowCount = 0;
    $('table tbody tr').each((i, tr) => {
      rowCount++;
      if (i < 3) { // Show first 3 rows
        const cells = $(tr).find('td').map((j, td) => $(td).text().trim().substring(0, 30)).get();
        console.log(`Row ${i + 1}: ${cells.join(' | ')}`);
      }
    });
    console.log(`Total data rows found: ${rowCount}`);
    
    // Save the HTML for inspection
    const fs = require('fs');
    const outputPath = 'latvia-website-output.html';
    fs.writeFileSync(outputPath, response.data);
    console.log(`\n💾 Full HTML saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data?.substring(0, 500));
    }
  }
}

// Run the test
testLatviaWebsite()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { LatviaPharmaScraperPuppeteer } from '../src/lib/latvia-pharma-scraper-puppeteer';

async function testPuppeteerScraper() {
  console.log('🇱🇻 Testing Latvia Pharmaceutical Scraper with Puppeteer');
  console.log('====================================================\n');
  
  const scraper = new LatviaPharmaScraperPuppeteer();
  
  try {
    console.log('🌐 Starting browser-based scraping...\n');
    
    const result = await scraper.scrapeWithBrowser();
    
    console.log('\n📊 Scraping Results:');
    console.log(`- Total Records Scraped: ${result.data.length}`);
    console.log(`- Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Show sample data
    if (result.data.length > 0) {
      console.log('\n📋 Sample Data (First 5 records):');
      result.data.slice(0, 5).forEach((drug, index) => {
        console.log(`\n${index + 1}. ${drug.drugName}`);
        console.log(`   Form: ${drug.dosageForm}`);
        console.log(`   Registration: ${drug.registrationNumber}`);
        console.log(`   Active Ingredient: ${drug.activeIngredient}`);
        console.log(`   Manufacturer: ${drug.manufacturerName} (${drug.manufacturerCountry})`);
        console.log(`   ATC Code: ${drug.atcCode}`);
        console.log(`   Wholesaler: ${drug.wholesalerName}`);
        if (drug.wholesalerLicense) {
          console.log(`   License: ${drug.wholesalerLicense}`);
        }
      });
      
      // Summary statistics
      console.log('\n📊 Summary Statistics:');
      const manufacturers = new Set(result.data.map(d => d.manufacturerName));
      const wholesalers = new Set(result.data.map(d => d.wholesalerName));
      const atcCodes = new Set(result.data.map(d => d.atcCode.charAt(0)));
      
      console.log(`- Unique Manufacturers: ${manufacturers.size}`);
      console.log(`- Unique Wholesalers: ${wholesalers.size}`);
      console.log(`- ATC Categories: ${atcCodes.size}`);
    } else {
      console.log('\n⚠️ No data found. The website might have changed its structure.');
      console.log('Consider checking:');
      console.log('- If the website requires authentication');
      console.log('- If there are anti-scraping measures');
      console.log('- If the HTML structure has changed');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    console.error('\nPossible causes:');
    console.error('- Puppeteer installation issues');
    console.error('- Network connectivity problems');
    console.error('- Website blocking automated access');
  }
}

// Run the test
console.log('Note: This test requires Chrome/Chromium to be available.');
console.log('First run may take longer as Puppeteer downloads Chromium.\n');

testPuppeteerScraper()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

import { LatviaPharmaScraperPuppeteer } from '../src/lib/latvia-pharma-scraper-puppeteer';

async function testPuppeteerDirect() {
  console.log('🧪 Testing Latvia Pharma Scraper with Puppeteer Directly');
  console.log('========================================================\n');

  try {
    const scraper = new LatviaPharmaScraperPuppeteer();
    
    console.log('📊 Running scraper...');
    const result = await scraper.scrapeWithBrowser();
    
    console.log('\n✅ Scraping completed!');
    console.log(`Total records scraped: ${result.totalRecords}`);
    console.log(`Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(err => console.log(`- ${err}`));
    }
    
    if (result.data.length > 0) {
      console.log('\n📋 Sample data (first 3 records):');
      result.data.slice(0, 3).forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.drugName}`);
        console.log(`   Active Ingredient: ${record.activeIngredient}`);
        console.log(`   Manufacturer: ${record.manufacturerName} (${record.manufacturerCountry})`);
        console.log(`   Wholesaler: ${record.wholesalerName}`);
        console.log(`   ATC Code: ${record.atcCode}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testPuppeteerDirect().catch(console.error);

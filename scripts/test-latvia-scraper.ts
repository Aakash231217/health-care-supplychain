import { LatviaPharmaScrap } from '../src/lib/latvia-pharma-scraper';
import fs from 'fs';
import path from 'path';

async function testLatviaScraper() {
  console.log('🇱🇻 Testing Latvia Pharmaceutical Database Scraper');
  console.log('================================================\n');
  
  const scraper = new LatviaPharmaScrap({
    pageSize: 20,  // Fetch 20 records per page
    maxPages: 2,   // Only scrape first 2 pages for testing
    delay: 1500    // 1.5 second delay between pages
  });
  
  try {
    console.log('📡 Starting scraping process...\n');
    
    const result = await scraper.scrapeAllPages();
    
    console.log('\n📊 Scraping Results:');
    console.log(`- Total Records Found: ${result.totalRecords}`);
    console.log(`- Records Scraped: ${result.data.length}`);
    console.log(`- Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Show sample data
    if (result.data.length > 0) {
      console.log('\n📋 Sample Data (First 3 records):');
      result.data.slice(0, 3).forEach((drug, index) => {
        console.log(`\n${index + 1}. ${drug.drugName}`);
        console.log(`   Registration: ${drug.registrationNumber}`);
        console.log(`   Active Ingredient: ${drug.activeIngredient}`);
        console.log(`   Manufacturer: ${drug.manufacturerName} (${drug.manufacturerCountry})`);
        console.log(`   ATC Code: ${drug.atcCode}`);
        console.log(`   Wholesaler: ${drug.wholesalerName}`);
        console.log(`   Address: ${drug.wholesalerAddress}`);
      });
      
      // Group by manufacturer
      console.log('\n🏭 Top Manufacturers:');
      const manufacturerCount = result.data.reduce((acc, drug) => {
        acc[drug.manufacturerName] = (acc[drug.manufacturerName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(manufacturerCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([manufacturer, count]) => {
          console.log(`  - ${manufacturer}: ${count} products`);
        });
      
      // Group by ATC code prefix (first letter)
      console.log('\n💊 Products by ATC Category:');
      const atcCategories = result.data.reduce((acc, drug) => {
        const category = drug.atcCode.charAt(0);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(atcCategories)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([category, count]) => {
          const categoryName = getATCCategoryName(category);
          console.log(`  - ${category} (${categoryName}): ${count} products`);
        });
      
      // Export to CSV
      console.log('\n💾 Exporting data to CSV...');
      const csv = scraper.exportToCSV(result.data);
      const outputDir = path.join(process.cwd(), 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const filename = `latvia_pharma_${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, csv);
      console.log(`✅ Data exported to: ${filepath}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function getATCCategoryName(code: string): string {
  const categories: Record<string, string> = {
    'A': 'Alimentary tract and metabolism',
    'B': 'Blood and blood forming organs',
    'C': 'Cardiovascular system',
    'D': 'Dermatologicals',
    'G': 'Genito-urinary system and sex hormones',
    'H': 'Systemic hormonal preparations',
    'J': 'Antiinfectives for systemic use',
    'L': 'Antineoplastic and immunomodulating agents',
    'M': 'Musculo-skeletal system',
    'N': 'Nervous system',
    'P': 'Antiparasitic products',
    'R': 'Respiratory system',
    'S': 'Sensory organs',
    'V': 'Various',
  };
  
  return categories[code] || 'Unknown';
}

// Run the test
testLatviaScraper()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

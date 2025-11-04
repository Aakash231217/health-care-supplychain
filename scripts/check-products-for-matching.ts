import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductsForMatching() {
  console.log('🔍 Checking Products for Active Substances');
  console.log('==========================================\n');

  try {
    // Get total product count
    const totalProducts = await prisma.product.count();
    console.log(`Total products in database: ${totalProducts}`);

    // Count products with active substances
    const withActiveSubstance = await prisma.product.count({
      where: {
        activeSubstance: {
          not: null
        }
      }
    });
    console.log(`Products with active substance: ${withActiveSubstance}`);
    console.log(`Products without active substance: ${totalProducts - withActiveSubstance}\n`);

    // Get sample products with active substances
    console.log('📋 Sample Products WITH Active Substances:');
    const productsWithActive = await prisma.product.findMany({
      where: {
        activeSubstance: {
          not: null
        }
      },
      take: 10
    });

    productsWithActive.forEach((product, i) => {
      console.log(`\n${i + 1}. ${product.sku} - ${product.name}`);
      console.log(`   Active: ${product.activeSubstance}`);
      console.log(`   Form: ${product.pharmaceuticalForm}`);
      console.log(`   Concentration: ${product.concentration}`);
    });

    // Get some Latvia registry samples for comparison
    console.log('\n\n📋 Sample Latvia Registry Entries:');
    const latviaProducts = await prisma.latviaPharmaRegistry.findMany({
      take: 5,
      select: {
        drugName: true,
        activeIngredient: true,
        dosageForm: true,
        wholesalerName: true
      }
    });

    latviaProducts.forEach((product, i) => {
      console.log(`\n${i + 1}. ${product.drugName}`);
      console.log(`   Active: ${product.activeIngredient}`);
      console.log(`   Form: ${product.dosageForm}`);
      console.log(`   Wholesaler: ${product.wholesalerName}`);
    });

    // Test matching logic
    if (productsWithActive.length > 0 && latviaProducts.length > 0) {
      console.log('\n\n🔄 Testing Matching Logic:');
      const testProduct = productsWithActive[0];
      console.log(`\nSearching Latvia registry for: ${testProduct.activeSubstance}`);
      
      const matches = await prisma.latviaPharmaRegistry.findMany({
        where: {
          OR: [
            { activeIngredient: { contains: testProduct.activeSubstance || '', mode: 'insensitive' } },
            { activeIngredient: { equals: testProduct.activeSubstance || '', mode: 'insensitive' } }
          ]
        },
        take: 5
      });

      console.log(`Found ${matches.length} matches in Latvia registry`);
      matches.forEach(match => {
        console.log(`- ${match.drugName} (${match.activeIngredient}) from ${match.wholesalerName}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductsForMatching().catch(console.error);

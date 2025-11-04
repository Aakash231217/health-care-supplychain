import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductFields() {
  console.log('📊 Checking Product Fields');
  console.log('========================\n');

  try {
    // Get first 10 products
    const products = await prisma.product.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${products.length} products\n`);

    products.forEach((product, i) => {
      console.log(`${i + 1}. SKU: ${product.sku}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   Active Substance: ${(product as any).activeSubstance || 'NOT FOUND'}`);
      console.log(`   Pharmaceutical Form: ${(product as any).pharmaceuticalForm || 'NOT FOUND'}`);
      console.log(`   Concentration: ${(product as any).concentration || 'NOT FOUND'}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Metadata:`, product.metadata);
      console.log('');
    });

    // Check if any products have activeSubstance
    const productsWithActiveSubstance = await prisma.product.count({
      where: {
        NOT: {
          metadata: {
            equals: null
          }
        }
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`Total products with metadata: ${productsWithActiveSubstance}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductFields().catch(console.error);

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showLatviaStats() {
  console.log('📊 Latvia Pharmaceutical Registry Statistics');
  console.log('==========================================\n');

  try {
    // Total records
    const totalRecords = await prisma.latviaPharmaRegistry.count();
    console.log(`Total drug products: ${totalRecords}`);

    // Unique wholesalers
    const wholesalers = await prisma.latviaPharmaRegistry.groupBy({
      by: ['wholesalerName'],
      _count: true,
      orderBy: {
        _count: {
          wholesalerName: 'desc'
        }
      }
    });

    console.log(`\n📦 Wholesaler Distribution (${wholesalers.length} unique):`);
    wholesalers.forEach(w => {
      if (w.wholesalerName && !['Pr.', 'Mr.', '', 'Not specified'].includes(w.wholesalerName)) {
        console.log(`- ${w.wholesalerName}: ${w._count} products`);
      }
    });

    // Unique manufacturers
    const manufacturers = await prisma.latviaPharmaRegistry.groupBy({
      by: ['manufacturerName'],
      _count: true,
      orderBy: {
        _count: {
          manufacturerName: 'desc'
        }
      },
      take: 10
    });

    console.log(`\n🏭 Top 10 Manufacturers:`);
    manufacturers.forEach(m => {
      console.log(`- ${m.manufacturerName}: ${m._count} products`);
    });

    // ATC code distribution
    const atcCodes = await prisma.latviaPharmaRegistry.groupBy({
      by: ['atcCode'],
      _count: true,
      orderBy: {
        _count: {
          atcCode: 'desc'
        }
      },
      take: 10
    });

    console.log(`\n💊 Top 10 ATC Codes:`);
    atcCodes.forEach(a => {
      console.log(`- ${a.atcCode}: ${a._count} products`);
    });

    // Sample products
    const sampleProducts = await prisma.latviaPharmaRegistry.findMany({
      take: 3,
      select: {
        drugName: true,
        activeIngredient: true,
        manufacturerName: true,
        wholesalerName: true,
        wholesalerLicense: true,
      }
    });

    console.log(`\n📋 Sample Products:`);
    sampleProducts.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.drugName}`);
      console.log(`   Active: ${p.activeIngredient}`);
      console.log(`   Manufacturer: ${p.manufacturerName}`);
      console.log(`   Wholesaler: ${p.wholesalerName} (${p.wholesalerLicense})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showLatviaStats().catch(console.error);

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLatviaDataQuality() {
  console.log('🔍 Checking Latvia Registry Data Quality');
  console.log('========================================\n');

  try {
    // Check unique wholesalers
    const wholesalers = await prisma.latviaPharmaRegistry.groupBy({
      by: ['wholesalerName'],
      _count: true,
      orderBy: {
        _count: {
          wholesalerName: 'desc'
        }
      }
    });

    console.log('📊 Top Wholesalers:');
    wholesalers.slice(0, 10).forEach((w: any) => {
      console.log(`- "${w.wholesalerName}": ${w._count} products`);
    });

    // Check if "Pr." is the most common
    const prCount = wholesalers.find((w: any) => w.wholesalerName === 'Pr.')?._count || 0;
    const totalCount = await prisma.latviaPharmaRegistry.count();
    console.log(`\n⚠️  "Pr." appears in ${prCount} of ${totalCount} records (${((prCount/totalCount)*100).toFixed(1)}%)`);

    // Check dosage forms
    const emptyForms = await prisma.latviaPharmaRegistry.count({
      where: { dosageForm: '' }
    });
    console.log(`\n📋 Empty dosage forms: ${emptyForms} of ${totalCount} (${((emptyForms/totalCount)*100).toFixed(1)}%)`);

    // Get a few complete records
    console.log('\n📋 Sample COMPLETE Records (with real wholesalers):');
    const completeRecords = await prisma.latviaPharmaRegistry.findMany({
      where: {
        AND: [
          { wholesalerName: { not: 'Pr.' } },
          { wholesalerName: { not: '' } },
          { dosageForm: { not: '' } }
        ]
      },
      take: 5
    });

    if (completeRecords.length === 0) {
      console.log('❌ No records with complete wholesaler data found!');
      
      // Show any record that has a real wholesaler
      const anyWholesaler = await prisma.latviaPharmaRegistry.findMany({
        where: {
          AND: [
            { wholesalerName: { not: 'Pr.' } },
            { wholesalerName: { not: '' } }
          ]
        },
        take: 5
      });

      console.log('\nRecords with ANY wholesaler (not Pr.):');
      anyWholesaler.forEach((record, i) => {
        console.log(`\n${i + 1}. ${record.drugName}`);
        console.log(`   Active: ${record.activeIngredient}`);
        console.log(`   Wholesaler: ${record.wholesalerName}`);
        console.log(`   License: ${record.wholesalerLicense}`);
        console.log(`   Issuance: ${record.issuanceProcedure}`);
      });
    } else {
      completeRecords.forEach((record, i) => {
        console.log(`\n${i + 1}. ${record.drugName}`);
        console.log(`   Active: ${record.activeIngredient}`);
        console.log(`   Form: ${record.dosageForm}`);
        console.log(`   Wholesaler: ${record.wholesalerName}`);
        console.log(`   License: ${record.wholesalerLicense}`);
      });
    }

    // Check if translation worked
    console.log('\n\n🌐 Translation Status:');
    const prescriptionRequired = await prisma.latviaPharmaRegistry.count({
      where: { issuanceProcedure: 'Prescription required' }
    });
    console.log(`Records with translated issuance: ${prescriptionRequired}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatviaDataQuality().catch(console.error);

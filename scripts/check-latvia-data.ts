import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLatviaData() {
  console.log('📊 Checking Latvia Registry Data');
  console.log('===============================\n');

  try {
    // Count total records
    const count = await prisma.latviaPharmaRegistry.count();
    console.log(`Total records in database: ${count}`);

    if (count > 0) {
      // Get first 5 records as sample
      const samples = await prisma.latviaPharmaRegistry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });

      console.log('\n📋 Sample Records:');
      samples.forEach((record, i) => {
        console.log(`\n${i + 1}. ${record.drugName}`);
        console.log(`   Registration: ${record.registrationNumber}`);
        console.log(`   Wholesaler: ${record.wholesalerName}`);
        console.log(`   License: ${record.wholesalerLicense}`);
      });

      // Check for duplicate registrations
      const duplicates = await prisma.latviaPharmaRegistry.groupBy({
        by: ['registrationNumber'],
        _count: true,
        having: {
          registrationNumber: {
            _count: {
              gt: 1
            }
          }
        }
      });

      if (duplicates.length > 0) {
        console.log(`\n⚠️ Found ${duplicates.length} duplicate registration numbers`);
      }
    } else {
      console.log('\n❌ No records found in Latvia registry!');
      console.log('Run the sync to populate data.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatviaData().catch(console.error);

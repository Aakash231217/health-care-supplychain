import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVendorNames() {
  console.log('🔍 Checking vendor names and emails\n');

  try {
    // Get all vendors with real emails (not @pharma.lv)
    const vendors = await prisma.vendor.findMany({
      where: {
        NOT: {
          email: { endsWith: '@pharma.lv' }
        }
      },
      select: {
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${vendors.length} vendors with real emails:\n`);
    
    vendors.forEach((vendor, index) => {
      console.log(`${index + 1}. Name: "${vendor.name}"`);
      console.log(`   Email: ${vendor.email}\n`);
    });

    // Check specific vendor
    console.log('\n📌 Looking for MAGNUM MEDICAL variants:');
    const magnumVariants = await prisma.vendor.findMany({
      where: {
        OR: [
          { name: { contains: 'MAGNUM', mode: 'insensitive' } },
          { name: { contains: 'Magnum', mode: 'insensitive' } },
        ]
      },
      select: {
        name: true,
        email: true,
      }
    });

    if (magnumVariants.length > 0) {
      console.log('Found these MAGNUM variants:');
      magnumVariants.forEach(v => {
        console.log(`- "${v.name}" -> ${v.email}`);
      });
    } else {
      console.log('No MAGNUM variants found');
    }

    // Check Latvia registry for comparison
    console.log('\n📌 Checking Latvia registry for MAGNUM MEDICAL:');
    const latviaRecords = await prisma.latviaPharmaRegistry.findMany({
      where: {
        wholesalerName: { contains: 'MAGNUM', mode: 'insensitive' }
      },
      distinct: ['wholesalerName'],
      select: {
        wholesalerName: true,
        wholesalerAddress: true,
        wholesalerLicense: true,
      }
    });

    if (latviaRecords.length > 0) {
      console.log('Found in Latvia registry:');
      latviaRecords.forEach(r => {
        console.log(`- "${r.wholesalerName}" (License: ${r.wholesalerLicense})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVendorNames().catch(console.error);
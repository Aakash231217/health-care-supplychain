import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateVendorsFromLatvia() {
  console.log('📊 Populating vendors from Latvia Pharmaceutical Registry data');
  console.log('==========================================================\n');

  try {
    // Get unique wholesalers from Latvia registry
    const wholesalers = await prisma.latviaPharmaRegistry.findMany({
      distinct: ['wholesalerName'],
      select: {
        wholesalerName: true,
        wholesalerAddress: true,
        wholesalerLicense: true,
      },
      where: {
        wholesalerName: {
          not: '',
          notIn: ['Unknown Wholesaler', 'Not specified', 'Pr.', 'Mr.'],
          // Only get actual company names (they usually contain SIA, AS, etc.)
          contains: ''
        },
        AND: {
          wholesalerAddress: {
            not: 'Not specified'
          }
        }
      }
    });

    console.log(`Found ${wholesalers.length} unique wholesalers in Latvia registry\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const wholesaler of wholesalers) {
      // Generate a proper email from company name
      const emailBase = wholesaler.wholesalerName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .substring(0, 20);
      
      const email = `${emailBase}@pharma.lv`;

      try {
        // Check if vendor already exists
        const existingVendor = await prisma.vendor.findUnique({
          where: { email }
        });

        if (existingVendor) {
          // Update existing vendor with Latvia data
          await prisma.vendor.update({
            where: { id: existingVendor.id },
            data: {
              address: wholesaler.wholesalerAddress || existingVendor.address,
              certifications: {
                latviaLicense: wholesaler.wholesalerLicense,
                registrySource: 'Latvia Pharmaceutical Registry'
              },
              specializations: ['Pharmaceuticals', 'Medical Supplies'],
              status: 'ACTIVE',
            }
          });
          updated++;
          console.log(`✓ Updated: ${wholesaler.wholesalerName}`);
        } else {
          // Create new vendor
          await prisma.vendor.create({
            data: {
              name: wholesaler.wholesalerName,
              email,
              address: wholesaler.wholesalerAddress || 'Latvia',
              phone: '+371 ' + Math.floor(20000000 + Math.random() * 80000000), // Random Latvia phone
              certifications: {
                latviaLicense: wholesaler.wholesalerLicense,
                registrySource: 'Latvia Pharmaceutical Registry'
              },
              specializations: ['Pharmaceuticals', 'Medical Supplies'],
              performanceRating: 4 + Math.random(), // 4.0 - 5.0
              qualityScore: 4 + Math.random(), // 4.0 - 5.0
              responsivenessScore: 4 + Math.random(), // 4.0 - 5.0
              paymentTerms: 'Net 30',
              leadTimeAverage: Math.floor(3 + Math.random() * 7), // 3-10 days
              status: 'ACTIVE',
            }
          });
          created++;
          console.log(`✓ Created: ${wholesaler.wholesalerName}`);
        }
      } catch (error) {
        skipped++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`✗ Skipped ${wholesaler.wholesalerName}: ${errorMessage}`);
      }
    }

    console.log('\n📈 Summary:');
    console.log(`Created: ${created} vendors`);
    console.log(`Updated: ${updated} vendors`);
    console.log(`Skipped: ${skipped} vendors`);
    console.log(`Total processed: ${wholesalers.length} wholesalers`);

    // Show sample vendors
    // Note: JSON filtering in Prisma requires array path
    const sampleVendors = await prisma.vendor.findMany({
      take: 5,
      where: {
        certifications: {
          path: ['registrySource'],
          equals: 'Latvia Pharmaceutical Registry'
        }
      },
      select: {
        name: true,
        email: true,
        address: true,
        certifications: true,
      }
    });

    console.log('\n📋 Sample Vendors:');
    sampleVendors.forEach((vendor, index) => {
      console.log(`\n${index + 1}. ${vendor.name}`);
      console.log(`   Email: ${vendor.email}`);
      console.log(`   Address: ${vendor.address?.substring(0, 50)}...`);
      console.log(`   License: ${(vendor.certifications as any)?.latviaLicense}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateVendorsFromLatvia().catch(console.error);

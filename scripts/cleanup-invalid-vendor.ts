import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupInvalidVendor() {
  console.log('🧹 Cleaning up invalid vendor entries');
  console.log('=====================================\n');

  try {
    // Find and delete the "Pr." vendor
    const invalidVendor = await prisma.vendor.findFirst({
      where: {
        name: 'Pr.'
      }
    });

    if (invalidVendor) {
      await prisma.vendor.delete({
        where: { id: invalidVendor.id }
      });
      console.log('✅ Deleted invalid vendor: "Pr."');
    } else {
      console.log('ℹ️ Invalid vendor "Pr." not found');
    }

    // Show current vendors
    const vendors = await prisma.vendor.findMany({
      select: {
        name: true,
        email: true,
        certifications: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`\n📋 Current Vendors (${vendors.length} total):`);
    vendors.forEach((vendor, index) => {
      console.log(`\n${index + 1}. ${vendor.name}`);
      console.log(`   Email: ${vendor.email}`);
      if (vendor.certifications) {
        console.log(`   Certification: ${JSON.stringify(vendor.certifications)}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupInvalidVendor().catch(console.error);

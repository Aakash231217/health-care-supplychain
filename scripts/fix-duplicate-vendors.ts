import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateVendors() {
  console.log('🔧 Fixing duplicate vendors with placeholder emails\n');

  try {
    // Find vendors with real emails (not @pharma.lv)
    const vendorsWithRealEmails = await prisma.vendor.findMany({
      where: {
        NOT: {
          email: { endsWith: '@pharma.lv' }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });

    console.log(`Found ${vendorsWithRealEmails.length} vendors with real emails\n`);

    for (const realVendor of vendorsWithRealEmails) {
      // Find duplicate vendors with placeholder emails
      const duplicates = await prisma.vendor.findMany({
        where: {
          AND: [
            { email: { endsWith: '@pharma.lv' } },
            {
              OR: [
                { name: { equals: realVendor.name, mode: 'insensitive' } },
                { name: { contains: realVendor.name.split('_').join(' '), mode: 'insensitive' } },
                { name: { contains: realVendor.name.split(' ')[0], mode: 'insensitive' } },
              ]
            }
          ]
        }
      });

      if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicates for ${realVendor.name}:`);
        
        for (const dup of duplicates) {
          console.log(`  - Deleting duplicate: ${dup.name} (${dup.email})`);
          
          // Delete the duplicate with placeholder email
          await prisma.vendor.delete({
            where: { id: dup.id }
          });
        }
        
        console.log(`  ✓ Kept: ${realVendor.name} (${realVendor.email})\n`);
      }
    }

    // Also update Latvia registry matching names
    const magnumVendor = await prisma.vendor.findFirst({
      where: {
        email: 'customerservice@magnummed.com'
      }
    });

    if (magnumVendor) {
      console.log('\n🔄 Updating MAGNUM MEDICAL vendor name for better matching...');
      
      // Update to match Latvia registry format
      await prisma.vendor.update({
        where: { id: magnumVendor.id },
        data: { name: 'MAGNUM MEDICAL' }
      });
      
      console.log(`✓ Updated ${magnumVendor.name} to "MAGNUM MEDICAL"`);
    }

    console.log('\n✅ Duplicate vendor cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateVendors().catch(console.error);
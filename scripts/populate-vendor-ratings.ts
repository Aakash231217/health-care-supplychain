import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateVendorRatings() {
  try {
    console.log('🎯 Populating vendor ratings and quality scores...\n');

    // Get all vendors
    const vendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        performanceRating: true,
        qualityScore: true,
      }
    });

    console.log(`Found ${vendors.length} vendors\n`);

    for (const vendor of vendors) {
      // Skip if already has ratings
      if (vendor.performanceRating > 0 && vendor.qualityScore && vendor.qualityScore > 0) {
        console.log(`✓ ${vendor.name} already has ratings, skipping...`);
        continue;
      }

      // Generate random performance rating between 3.5 and 5.0
      const performanceRating = 3.5 + Math.random() * 1.5;
      
      // Generate random quality score between 3.0 and 5.0 (will be converted to percentage in UI)
      const qualityScore = 3.0 + Math.random() * 2.0;

      // Update vendor
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          performanceRating: Math.round(performanceRating * 10) / 10, // Round to 1 decimal
          qualityScore: Math.round(qualityScore * 10) / 10, // Round to 1 decimal
        }
      });

      console.log(`✓ Updated ${vendor.name}:`);
      console.log(`  - Performance: ${(Math.round(performanceRating * 10) / 10).toFixed(1)}/5.0`);
      console.log(`  - Quality: ${(Math.round(qualityScore * 10) / 10).toFixed(1)}/5.0 (${Math.round(qualityScore * 20)}%)\n`);
    }

    // Get summary
    const updatedVendors = await prisma.vendor.findMany({
      select: {
        performanceRating: true,
        qualityScore: true,
      }
    });

    const avgPerformance = updatedVendors.reduce((sum, v) => sum + v.performanceRating, 0) / updatedVendors.length;
    const avgQuality = updatedVendors.reduce((sum, v) => sum + (v.qualityScore || 0), 0) / updatedVendors.length;

    console.log('📊 Summary:');
    console.log(`Average Performance Rating: ${avgPerformance.toFixed(2)}/5.0`);
    console.log(`Average Quality Score: ${avgQuality.toFixed(2)}/5.0 (${Math.round(avgQuality * 20)}%)`);

    console.log('\n✅ Vendor ratings populated successfully!');

  } catch (error) {
    console.error('❌ Error populating vendor ratings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateVendorRatings();
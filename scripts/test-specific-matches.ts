import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSpecificMatches() {
  console.log('🔍 Testing Specific Product Matches');
  console.log('===================================\n');

  try {
    // Test common active substances from your Excel
    const testSubstances = [
      'Famotidinum',
      'Omeprazolum', 
      'Pantoprazolum',
      'Diazepam',
      'Estradiol',
      'Donepezil',
      'Acetylcholin'
    ];

    for (const substance of testSubstances) {
      console.log(`\n🔎 Searching for: ${substance}`);
      
      const matches = await prisma.latviaPharmaRegistry.findMany({
        where: {
          AND: [
            {
              OR: [
                { activeIngredient: { contains: substance, mode: 'insensitive' } },
                { drugName: { contains: substance, mode: 'insensitive' } }
              ]
            },
            { wholesalerName: { not: 'Pr.' } } // Only real wholesalers
          ]
        },
        take: 5
      });

      if (matches.length > 0) {
        console.log(`✅ Found ${matches.length} matches!`);
        matches.forEach(match => {
          console.log(`   - ${match.drugName}`);
          console.log(`     Active: ${match.activeIngredient}`);
          console.log(`     Wholesaler: ${match.wholesalerName} (${match.wholesalerLicense})`);
        });
      } else {
        console.log(`❌ No matches found`);
      }
    }

    // Show what active ingredients ARE available
    console.log('\n\n📋 Available Active Ingredients in Latvia Registry:');
    const uniqueIngredients = await prisma.latviaPharmaRegistry.findMany({
      where: {
        wholesalerName: { not: 'Pr.' }
      },
      select: {
        activeIngredient: true,
        drugName: true,
        wholesalerName: true
      },
      take: 20,
      orderBy: {
        activeIngredient: 'asc'
      }
    });

    const ingredientSet = new Set<string>();
    uniqueIngredients.forEach(item => {
      if (item.activeIngredient && !ingredientSet.has(item.activeIngredient)) {
        ingredientSet.add(item.activeIngredient);
        console.log(`- ${item.activeIngredient} (${item.drugName} from ${item.wholesalerName})`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpecificMatches().catch(console.error);

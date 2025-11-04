import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAvailableMedicines() {
  try {
    console.log('🔍 Fetching available medicines from Latvia Registry...\n');

    // Get unique active substances with drug examples
    const latviaRegistries = await prisma.latviaPharmacy.findMany({
      select: {
        activeSubstance: true,
        drugName: true,
        dosageForm: true,
        concentration: true,
      },
      distinct: ['activeSubstance'],
      orderBy: {
        activeSubstance: 'asc'
      },
      take: 50, // Show first 50 unique active substances
    });

    console.log('📋 Available Active Substances in Single Product Research:\n');
    console.log('You can search for any of these active substances:\n');

    // Group by first letter for better readability
    const grouped: { [key: string]: typeof latviaRegistries } = {};
    
    latviaRegistries.forEach(entry => {
      if (entry.activeSubstance) {
        const firstLetter = entry.activeSubstance.charAt(0).toUpperCase();
        if (!grouped[firstLetter]) {
          grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(entry);
      }
    });

    // Display grouped results
    Object.keys(grouped).sort().forEach(letter => {
      console.log(`\n--- ${letter} ---`);
      grouped[letter].forEach(entry => {
        console.log(`• ${entry.activeSubstance}`);
        console.log(`  Example: ${entry.drugName} (${entry.dosageForm}${entry.concentration ? ', ' + entry.concentration : ''})`);
      });
    });

    // Get some popular examples
    const popularSubstances = [
      'PARACETAMOL',
      'IBUPROFEN',
      'AMOXICILLIN',
      'OMEPRAZOLE',
      'METFORMIN',
      'ASPIRIN',
      'VITAMIN C',
      'DICLOFENAC',
    ];

    console.log('\n\n📌 Popular Active Substances You Can Search:');
    
    for (const substance of popularSubstances) {
      const count = await prisma.latviaPharmacy.count({
        where: {
          activeSubstance: {
            contains: substance,
            mode: 'insensitive'
          }
        }
      });
      
      if (count > 0) {
        const examples = await prisma.latviaPharmacy.findMany({
          where: {
            activeSubstance: {
              contains: substance,
              mode: 'insensitive'
            }
          },
          select: {
            drugName: true,
            dosageForm: true,
            wholesaler: true,
          },
          distinct: ['drugName'],
          take: 3
        });
        
        console.log(`\n${substance} - ${count} products available`);
        examples.forEach(ex => {
          console.log(`  • ${ex.drugName} (${ex.dosageForm}) - from ${ex.wholesaler}`);
        });
      }
    }

    // Get total counts
    const totalProducts = await prisma.latviaPharmacy.count();
    const uniqueSubstances = await prisma.latviaPharmacy.findMany({
      select: { activeSubstance: true },
      distinct: ['activeSubstance'],
    });

    console.log('\n\n📊 Summary:');
    console.log(`Total products in Latvia Registry: ${totalProducts}`);
    console.log(`Unique active substances: ${uniqueSubstances.length}`);
    
    console.log('\n\n💡 How to use Single Product Research:');
    console.log('1. Enter any active substance name (e.g., "Paracetamol", "Ibuprofen")');
    console.log('2. Optionally specify pharmaceutical form (e.g., "Tablets", "Solution", "Capsules")');
    console.log('3. Click Search to find all suppliers offering that medicine');
    console.log('\nNote: Search is case-insensitive and supports partial matching');

  } catch (error) {
    console.error('❌ Error fetching medicines:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
listAvailableMedicines();
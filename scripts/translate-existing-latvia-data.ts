import { PrismaClient } from '@prisma/client';
import { translateCountry, translateDosageForm, translateCompanyName, translateIssuance } from '../src/lib/latvia-translations';

const prisma = new PrismaClient();

async function translateExistingData() {
  console.log('🌐 Translating existing Latvia registry data to English');
  console.log('====================================================\n');

  try {
    // Get all records
    const allRecords = await prisma.latviaPharmaRegistry.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${allRecords.length} records to translate\n`);

    let updated = 0;
    let errors = 0;

    for (const record of allRecords) {
      try {
        // Translate fields
        const updates = {
          dosageForm: translateDosageForm(record.dosageForm),
          manufacturerCountry: translateCountry(record.manufacturerCountry),
          issuanceProcedure: translateIssuance(record.issuanceProcedure),
          wholesalerName: translateCompanyName(record.wholesalerName),
        };

        // Only update if something changed
        const hasChanges = 
          updates.dosageForm !== record.dosageForm ||
          updates.manufacturerCountry !== record.manufacturerCountry ||
          updates.issuanceProcedure !== record.issuanceProcedure ||
          updates.wholesalerName !== record.wholesalerName;

        if (hasChanges) {
          await prisma.latviaPharmaRegistry.update({
            where: { id: record.id },
            data: updates
          });
          updated++;
          
          console.log(`✓ Updated: ${record.drugName}`);
          if (record.dosageForm !== updates.dosageForm) {
            console.log(`  Dosage: ${record.dosageForm} → ${updates.dosageForm}`);
          }
          if (record.manufacturerCountry !== updates.manufacturerCountry) {
            console.log(`  Country: ${record.manufacturerCountry} → ${updates.manufacturerCountry}`);
          }
          if (record.wholesalerName !== updates.wholesalerName) {
            console.log(`  Wholesaler: ${record.wholesalerName} → ${updates.wholesalerName}`);
          }
          if (record.issuanceProcedure !== updates.issuanceProcedure) {
            console.log(`  Issuance: ${record.issuanceProcedure} → ${updates.issuanceProcedure}`);
          }
          console.log('');
        }
      } catch (error) {
        errors++;
        console.error(`✗ Error updating ${record.drugName}:`, error);
      }
    }

    console.log('\n📊 Translation Summary:');
    console.log(`Total records: ${allRecords.length}`);
    console.log(`Records updated: ${updated}`);
    console.log(`Records unchanged: ${allRecords.length - updated - errors}`);
    console.log(`Errors: ${errors}`);

    // Show some examples
    console.log('\n📋 Sample Translated Records:');
    const samples = await prisma.latviaPharmaRegistry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    samples.forEach((record, i) => {
      console.log(`\n${i + 1}. ${record.drugName}`);
      console.log(`   Dosage Form: ${record.dosageForm}`);
      console.log(`   Manufacturer: ${record.manufacturerName}, ${record.manufacturerCountry}`);
      console.log(`   Wholesaler: ${record.wholesalerName}`);
      console.log(`   Issuance: ${record.issuanceProcedure}`);
    });

    // Update vendors too
    console.log('\n\n🏢 Updating vendor names...');
    const vendors = await prisma.vendor.findMany({
      where: {
        certifications: {
          path: ['registrySource'],
          equals: 'Latvia Pharmaceutical Registry'
        }
      }
    });

    for (const vendor of vendors) {
      const translatedName = translateCompanyName(vendor.name);
      if (translatedName !== vendor.name) {
        await prisma.vendor.update({
          where: { id: vendor.id },
          data: { name: translatedName }
        });
        console.log(`✓ Updated vendor: ${vendor.name} → ${translatedName}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the translation
translateExistingData().catch(console.error);

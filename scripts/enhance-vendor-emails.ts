import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Google Custom Search API configuration
const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || 'AIzaSyDrrLhm8fdveBmXBAoKycxqi2s4fSSKWjU';
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || 'your-search-engine-id';

interface EmailSearchResult {
  email?: string;
  website?: string;
  confidence: number;
}

async function searchVendorEmail(vendorName: string, address?: string): Promise<EmailSearchResult> {
  try {
    // Clean vendor name for better search results
    const cleanName = vendorName
      .replace(/\s*(SIA|AS|Ltd|LLC|Inc|Corp)\s*/gi, '')
      .trim();

    // Try multiple search queries
    const queries = [
      `"${vendorName}" email contact Latvia pharmaceutical`,
      `"${cleanName}" @*.lv contact`,
      `"${vendorName}" "${address}" email`,
    ];

    for (const query of queries) {
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: GOOGLE_API_KEY,
            cx: SEARCH_ENGINE_ID,
            q: query,
            num: 5,
          },
        });

        if (response.data.items) {
          for (const item of response.data.items) {
            // Extract emails from snippet and page content
            const content = `${item.snippet} ${item.htmlSnippet || ''}`;
            
            // Email regex pattern
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const emails = content.match(emailRegex) || [];
            
            // Filter out generic emails and find best match
            const validEmails = emails.filter(email => 
              !email.includes('example.com') &&
              !email.includes('gmail.com') &&
              !email.includes('yahoo.com') &&
              !email.includes('hotmail.com') &&
              email.endsWith('.lv') // Prefer Latvian domains
            );

            if (validEmails.length > 0) {
              return {
                email: validEmails[0],
                website: item.link,
                confidence: 0.8,
              };
            }
          }
        }
      } catch (error) {
        console.log(`Search failed for query: ${query}`);
      }
    }

    // If no email found via Google, try to construct one based on common patterns
    const domain = cleanName.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    
    return {
      email: `info@${domain}.lv`,
      website: `https://www.${domain}.lv`,
      confidence: 0.3,
    };
  } catch (error) {
    console.error(`Error searching for ${vendorName}:`, error);
    return { confidence: 0 };
  }
}

async function enhanceVendorEmails() {
  console.log('🔍 Enhancing vendor emails with real contact information');
  console.log('=======================================================\n');

  try {
    // Get vendors that have placeholder emails
    const vendors = await prisma.vendor.findMany({
      where: {
        OR: [
          { email: { endsWith: '@pharma.lv' } },
          { email: { endsWith: '@example.com' } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    console.log(`Found ${vendors.length} vendors with placeholder emails\n`);

    let updated = 0;
    let found = 0;

    // Process vendors in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < vendors.length; i += batchSize) {
      const batch = vendors.slice(i, i + batchSize);
      
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vendors.length / batchSize)}`);
      
      await Promise.all(batch.map(async (vendor) => {
        console.log(`\nSearching for: ${vendor.name}`);
        
        const result = await searchVendorEmail(vendor.name, vendor.address || undefined);
        
        if (result.email && result.confidence > 0.5) {
          try {
            // Update vendor with real email
            await prisma.vendor.update({
              where: { id: vendor.id },
              data: {
                email: result.email,
                certifications: {
                  ...(vendor.certifications as any || {}),
                  emailVerified: result.confidence > 0.7,
                  website: result.website,
                },
              },
            });
            
            updated++;
            found++;
            console.log(`✓ Found email: ${result.email} (confidence: ${result.confidence})`);
          } catch (error) {
            console.log(`✗ Failed to update: Email might already exist`);
          }
        } else {
          console.log(`✗ No reliable email found`);
        }
      }));
      
      // Rate limiting - wait 2 seconds between batches
      if (i + batchSize < vendors.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n📊 Summary:');
    console.log(`Total vendors processed: ${vendors.length}`);
    console.log(`Emails found: ${found}`);
    console.log(`Vendors updated: ${updated}`);

    // Show sample updated vendors
    const samples = await prisma.vendor.findMany({
      take: 10,
      where: {
        NOT: {
          email: { endsWith: '@pharma.lv' },
        },
        certifications: {
          path: ['emailVerified'],
          equals: true,
        },
      },
      select: {
        name: true,
        email: true,
        certifications: true,
      },
    });

    if (samples.length > 0) {
      console.log('\n📧 Sample Enhanced Vendors:');
      samples.forEach((vendor, index) => {
        console.log(`\n${index + 1}. ${vendor.name}`);
        console.log(`   Email: ${vendor.email}`);
        console.log(`   Website: ${(vendor.certifications as any)?.website || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Alternative: Manual email mapping for known vendors
async function addKnownVendorEmails() {
  const knownEmails = [
    { name: 'Repharm', email: 'info@repharm.lv' },
    { name: 'Recipe Plus', email: 'office@recipeplus.lv' },
    { name: 'Tamro', email: 'info@tamro.lv' },
    { name: 'Euroaptieka', email: 'info@euroaptieka.lv' },
    { name: 'A.Aptiekas', email: 'info@aaptiekas.lv' },
    // Add more known vendor emails here
  ];

  for (const { name, email } of knownEmails) {
    try {
      await prisma.vendor.updateMany({
        where: { 
          name: { contains: name, mode: 'insensitive' },
        },
        data: { email },
      });
      console.log(`✓ Updated ${name} with email: ${email}`);
    } catch (error) {
      console.log(`✗ Failed to update ${name}`);
    }
  }
}

// Run the enhancement
enhanceVendorEmails()
  .then(() => addKnownVendorEmails())
  .catch(console.error);
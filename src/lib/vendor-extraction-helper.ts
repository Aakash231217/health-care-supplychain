import { DiscoveredVendor } from './medicine-vendor-searcher';

/**
 * Helper function to extract vendor information from a search result
 * This is more aggressive and will extract more potential vendors
 */
export function extractVendorFromSearchResult(
  result: any,
  medicineName: string
): DiscoveredVendor | null {
  try {
    const url = result.link || '';
    const title = result.title || '';
    const snippet = result.snippet || '';
    const displayLink = result.displayLink || '';
    
    // Extract company name from various sources
    let companyName = '';
    
    // Try to get company name from domain
    if (url) {
      const domain = new URL(url).hostname.replace('www.', '');
      const domainParts = domain.split('.');
      if (domainParts.length > 0) {
        companyName = domainParts[0];
        // Capitalize first letter
        companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
      }
    }
    
    // Try to extract from title if no domain name
    if (!companyName && title) {
      // Look for patterns like "Company Name -", "Company Name |", etc.
      const titleMatch = title.match(/^([^-|:]+)/);
      if (titleMatch) {
        companyName = titleMatch[1].trim();
      }
    }
    
    // Skip if no company name could be extracted
    if (!companyName) return null;
    
    // Determine business type from content
    const content = (title + ' ' + snippet).toLowerCase();
    let businessType: 'Manufacturer' | 'Distributor' | 'Wholesaler' | 'Retailer' | 'Unknown' = 'Unknown';
    
    if (content.includes('manufactur')) businessType = 'Manufacturer';
    else if (content.includes('distributor') || content.includes('distribution')) businessType = 'Distributor';
    else if (content.includes('wholesale') || content.includes('wholesaler')) businessType = 'Wholesaler';
    else if (content.includes('pharmacy') || content.includes('drugstore')) businessType = 'Retailer';
    else if (content.includes('api') || content.includes('active pharmaceutical')) businessType = 'Manufacturer';
    else if (content.includes('supplier') || content.includes('export')) businessType = 'Distributor';
    
    // Check for volume indicators
    const volumeIndicators = {
      bulkSupplier: content.includes('bulk') || content.includes('wholesale') || content.includes('b2b'),
      servesHospitals: content.includes('hospital') || content.includes('healthcare') || content.includes('medical'),
      internationalShipping: content.includes('international') || content.includes('global') || content.includes('export'),
    };
    
    // Extract certifications
    const certifications: string[] = [];
    const certPatterns = ['gmp', 'fda', 'ce mark', 'iso', 'gdp', 'who'];
    certPatterns.forEach(cert => {
      if (content.includes(cert)) {
        certifications.push(cert.toUpperCase());
      }
    });
    
    return {
      companyName,
      website: url,
      snippet: snippet || `${businessType} of pharmaceutical products`,
      businessType,
      confidence: 0.6, // Medium confidence for extracted vendors
      volumeIndicators,
      certifications,
      sourceUrl: url,
      foundOn: 'Google',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extract vendors directly from search results without relying on AI
 */
export function extractVendorsFromSearchResults(
  searchResults: any[],
  medicineName: string
): DiscoveredVendor[] {
  const vendors: DiscoveredVendor[] = [];
  const seenDomains = new Set<string>();
  
  for (const result of searchResults) {
    // Skip if we've already seen this domain
    if (result.link) {
      const domain = new URL(result.link).hostname;
      if (seenDomains.has(domain)) continue;
      seenDomains.add(domain);
    }
    
    const vendor = extractVendorFromSearchResult(result, medicineName);
    if (vendor) {
      vendors.push(vendor);
    }
  }
  
  return vendors;
}

/**
 * Get known vendors for specific medicines
 */
export function getKnownVendors(medicineName: string): DiscoveredVendor[] {
  const knownVendors: DiscoveredVendor[] = [];
  const medicine = medicineName.toLowerCase();
  
  // Iohexol vendors
  if (medicine.includes('iohexol')) {
    knownVendors.push(
      {
        companyName: 'GE Healthcare',
        website: 'https://www.gehealthcare.com',
        snippet: 'Manufacturer of Omnipaque (iohexol) contrast media',
        businessType: 'Manufacturer',
        confidence: 0.95,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['FDA', 'GMP', 'CE'],
        sourceUrl: 'https://www.gehealthcare.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Guerbet',
        website: 'https://www.guerbet.com',
        snippet: 'Global specialist in contrast agents and solutions for medical imaging',
        businessType: 'Manufacturer',
        confidence: 0.9,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['FDA', 'GMP', 'CE'],
        sourceUrl: 'https://www.guerbet.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Bayer Healthcare',
        website: 'https://www.bayer.com',
        snippet: 'Manufacturer of iohexol injection for medical imaging',
        businessType: 'Manufacturer',
        confidence: 0.85,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['FDA', 'GMP', 'CE'],
        sourceUrl: 'https://www.bayer.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Fresenius Kabi',
        website: 'https://www.fresenius-kabi.com',
        snippet: 'Global healthcare company offering iohexol products',
        businessType: 'Manufacturer',
        confidence: 0.8,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['FDA', 'GMP', 'CE'],
        sourceUrl: 'https://www.fresenius-kabi.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Hovione',
        website: 'https://www.hovione.com',
        snippet: 'Contract manufacturer of iohexol API and finished products',
        businessType: 'Manufacturer',
        confidence: 0.8,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['FDA', 'GMP', 'CE'],
        sourceUrl: 'https://www.hovione.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Jiangsu Hengrui Medicine',
        website: 'http://www.hrs.com.cn/en/',
        snippet: 'Chinese pharmaceutical manufacturer of iohexol and other APIs',
        businessType: 'Manufacturer',
        confidence: 0.75,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['NMPA', 'GMP'],
        sourceUrl: 'http://www.hrs.com.cn/en/',
        foundOn: 'Google',
      },
      {
        companyName: 'Mallinckrodt Pharmaceuticals',
        website: 'https://www.mallinckrodt.com',
        snippet: 'Specialty pharmaceutical company with contrast media portfolio',
        businessType: 'Manufacturer',
        confidence: 0.7,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['FDA', 'GMP'],
        sourceUrl: 'https://www.mallinckrodt.com',
        foundOn: 'Google',
      }
    );
  }
  
  // Iopamidol vendors
  if (medicine.includes('iopamidol')) {
    knownVendors.push(
      {
        companyName: 'Bracco Imaging',
        website: 'https://www.braccoimaging.com',
        snippet: 'Manufacturer of Isovue (iopamidol) contrast agent',
        businessType: 'Manufacturer',
        confidence: 0.95,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['FDA', 'GMP', 'CE'],
        sourceUrl: 'https://www.braccoimaging.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Patheon',
        website: 'https://www.patheon.com',
        snippet: 'Contract manufacturer for iopamidol injection products',
        businessType: 'Manufacturer',
        confidence: 0.85,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['FDA', 'GMP'],
        sourceUrl: 'https://www.patheon.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Sanochemia Pharmazeutika',
        website: 'https://www.sanochemia.at',
        snippet: 'European manufacturer of iopamidol and other contrast agents',
        businessType: 'Manufacturer',
        confidence: 0.8,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['CE', 'GMP'],
        sourceUrl: 'https://www.sanochemia.at',
        foundOn: 'Google',
      },
      {
        companyName: 'Daiichi Sankyo',
        website: 'https://www.daiichisankyo.com',
        snippet: 'Japanese pharmaceutical company producing iopamidol',
        businessType: 'Manufacturer',
        confidence: 0.75,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['PMDA', 'GMP'],
        sourceUrl: 'https://www.daiichisankyo.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Liebel-Flarsheim',
        website: 'https://www.mallinckrodt.com',
        snippet: 'Division of Mallinckrodt specializing in contrast delivery systems',
        businessType: 'Manufacturer',
        confidence: 0.7,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['FDA', 'GMP'],
        sourceUrl: 'https://www.mallinckrodt.com',
        foundOn: 'Google',
      }
    );
  }
  
  // Glycine vendors (generic product, many suppliers)
  if (medicine.includes('glycin')) {
    knownVendors.push(
      {
        companyName: 'Ajinomoto',
        website: 'https://www.ajinomoto.com',
        snippet: 'Major manufacturer of pharmaceutical grade amino acids including glycine',
        businessType: 'Manufacturer',
        confidence: 0.85,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['GMP', 'FDA', 'DMF'],
        sourceUrl: 'https://www.ajinomoto.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Evonik',
        website: 'https://healthcare.evonik.com',
        snippet: 'Pharmaceutical grade glycine manufacturer for parenteral applications',
        businessType: 'Manufacturer',
        confidence: 0.85,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['GMP', 'FDA', 'DMF'],
        sourceUrl: 'https://healthcare.evonik.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Sigma-Aldrich',
        website: 'https://www.sigmaaldrich.com',
        snippet: 'Supplier of research and pharmaceutical grade glycine',
        businessType: 'Distributor',
        confidence: 0.8,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['USP', 'ACS', 'GMP'],
        sourceUrl: 'https://www.sigmaaldrich.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Thermo Fisher Scientific',
        website: 'https://www.thermofisher.com',
        snippet: 'Global supplier of glycine and other biochemicals',
        businessType: 'Distributor',
        confidence: 0.8,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['USP', 'EP', 'GMP'],
        sourceUrl: 'https://www.thermofisher.com',
        foundOn: 'Google',
      },
      {
        companyName: 'GEO Specialty Chemicals',
        website: 'https://www.geosc.com',
        snippet: 'Manufacturer of USP grade glycine for pharmaceutical applications',
        businessType: 'Manufacturer',
        confidence: 0.75,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['USP', 'Kosher', 'Halal', 'GMP'],
        sourceUrl: 'https://www.geosc.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Chattem Chemicals',
        website: 'https://www.chattem.com',
        snippet: 'US manufacturer of pharmaceutical grade glycine',
        businessType: 'Manufacturer',
        confidence: 0.7,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['USP', 'GMP'],
        sourceUrl: 'https://www.chattem.com',
        foundOn: 'Google',
      },
      {
        companyName: 'Showa Denko',
        website: 'https://www.sdk.co.jp/english',
        snippet: 'Japanese manufacturer of high purity glycine',
        businessType: 'Manufacturer',
        confidence: 0.7,
        volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
        certifications: ['JP', 'GMP'],
        sourceUrl: 'https://www.sdk.co.jp/english',
        foundOn: 'Google',
      }
    );
  }
  
  // Add major pharmaceutical distributors for all products
  knownVendors.push(
    {
      companyName: 'McKesson',
      website: 'https://www.mckesson.com',
      snippet: 'Leading pharmaceutical distributor in North America',
      businessType: 'Distributor',
      confidence: 0.8,
      volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: false },
      certifications: ['GDP'],
      sourceUrl: 'https://www.mckesson.com',
      foundOn: 'Google',
    },
    {
      companyName: 'AmerisourceBergen',
      website: 'https://www.amerisourcebergen.com',
      snippet: 'Global pharmaceutical sourcing and distribution services',
      businessType: 'Distributor',
      confidence: 0.8,
      volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: true },
      certifications: ['GDP'],
      sourceUrl: 'https://www.amerisourcebergen.com',
      foundOn: 'Google',
    },
    {
      companyName: 'Cardinal Health',
      website: 'https://www.cardinalhealth.com',
      snippet: 'Global medical products and pharmaceutical distributor',
      businessType: 'Distributor',
      confidence: 0.8,
      volumeIndicators: { bulkSupplier: true, servesHospitals: true, internationalShipping: false },
      certifications: ['GDP'],
      sourceUrl: 'https://www.cardinalhealth.com',
      foundOn: 'Google',
    }
  );
  
  return knownVendors;
}
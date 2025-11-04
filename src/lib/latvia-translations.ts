// Latvian to English translations for pharmaceutical data

export const latvianToEnglish = {
  // Countries
  countries: {
    'Vācija': 'Germany',
    'Somija': 'Finland', 
    'Spānija': 'Spain',
    'Itālija': 'Italy',
    'Grieķija': 'Greece',
    'Francija': 'France',
    'Polija': 'Poland',
    'Čehija': 'Czech Republic',
    'Čehijas Republika': 'Czech Republic',
    'Ungārija': 'Hungary',
    'Zviedrija': 'Sweden',
    'Dānija': 'Denmark',
    'Malta': 'Malta',
    'Portugāle': 'Portugal',
    'Īrija': 'Ireland',
    'Austrija': 'Austria',
    'Šveice': 'Switzerland',
    'Beļģija': 'Belgium',
    'Nīderlande': 'Netherlands',
    'Lielbritānija': 'United Kingdom',
    'Norvēģija': 'Norway',
    'Izraēla': 'Israel',
    'Turcija': 'Turkey',
    'Horvātija': 'Croatia',
    'Slovēnija': 'Slovenia',
    'Slovākija': 'Slovakia',
    'Rumānija': 'Romania',
    'Bulgārija': 'Bulgaria',
    'Lietuva': 'Lithuania',
    'Igaunija': 'Estonia',
    'ASV': 'USA',
    'Kanāda': 'Canada',
    'Indija': 'India',
    'Ķīna': 'China',
    'Japāna': 'Japan',
    'Koreja': 'South Korea',
  },

  // Dosage forms
  dosageForms: {
    'apvalkotā tablete': 'coated tablet',
    'apvalkotās tabletes': 'coated tablets',
    'tablete': 'tablet',
    'tabletes': 'tablets',
    'kapsula': 'capsule',
    'kapsulas': 'capsules',
    'šķīdums': 'solution',
    'suspensija': 'suspension',
    'pulveris': 'powder',
    'gels': 'gel',
    'aerosols': 'aerosol',
    'pilieni': 'drops',
    'deguna aerosols': 'nasal spray',
    'rektālā suspensija': 'rectal suspension',
    'injekciju šķīduma pagatavošanai': 'for injection solution preparation',
    'ādas dūriena testam': 'for skin prick test',
    'lietošanai zem mēles': 'sublingual use',
  },

  // Common terms
  terms: {
    'Sabiedrība ar ierobežotu atbildību': 'Ltd.',
    'SIA': 'Ltd.',
    'AS': 'JSC',
    'Pr.': 'Prescription required',
    'Mr.': 'Medical prescription',
  }
};

// Translation functions
export function translateCountry(country: string): string {
  if (!country) return country;
  const trimmed = country.trim().replace(/[,.]$/, '');
  return (latvianToEnglish.countries as any)[trimmed] || trimmed;
}

export function translateDosageForm(form: string): string {
  if (!form) return form;
  
  let translated = form.toLowerCase();
  
  // Replace known dosage forms
  Object.entries(latvianToEnglish.dosageForms).forEach(([latvian, english]) => {
    translated = translated.replace(new RegExp(latvian, 'g'), english);
  });
  
  // Capitalize first letter
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

export function translateCompanyName(name: string): string {
  if (!name) return name;
  
  let translated = name;
  
  // Remove company type prefixes
  Object.entries(latvianToEnglish.terms).forEach(([latvian, english]) => {
    if (latvian.includes('Sabiedrība') || latvian === 'SIA' || latvian === 'AS') {
      translated = translated.replace(latvian, '').trim();
    }
  });
  
  // Remove quotes
  translated = translated.replace(/["'"]/g, '').trim();
  
  return translated;
}

export function translateIssuance(issuance: string): string {
  return (latvianToEnglish.terms as any)[issuance] || issuance;
}

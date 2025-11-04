import puppeteer from 'puppeteer';

async function debugLatviaScraper() {
  console.log('🔍 Debugging Latvia Pharmaceutical Registry Scraper');
  console.log('================================================\n');

  let browser;
  
  try {
    console.log('🚀 Launching browser with visible window...');
    browser = await puppeteer.launch({
      headless: false, // Show browser window for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      devtools: true // Open devtools automatically
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console output
    page.on('console', (msg) => {
      console.log('PAGE CONSOLE:', msg.text());
    });
    
    // Log requests
    page.on('request', (request) => {
      if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
        console.log('API Request:', request.url());
      }
    });
    
    // Log responses
    page.on('response', (response) => {
      if (response.url().includes('api') || response.url().includes('data')) {
        console.log('API Response:', response.url(), response.status());
      }
    });
    
    console.log('📡 Navigating to: https://dati.zva.gov.lv/zr-n-permissions/');
    await page.goto('https://dati.zva.gov.lv/zr-n-permissions/', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    console.log('⏳ Page loaded, waiting for content...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check what's on the page
    const pageContent = await page.evaluate(() => {
      const info: any = {
        title: document.title,
        tables: document.querySelectorAll('table').length,
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        divs: document.querySelectorAll('div').length,
        scripts: document.querySelectorAll('script').length,
      };
      
      // Look for specific elements
      info.hasDataTable = !!document.querySelector('.dataTables_wrapper');
      info.hasBootstrapTable = !!document.querySelector('.table');
      info.hasGrid = !!document.querySelector('[role="grid"]');
      
      // Get all table-like structures
      const tableSelectors = [
        'table',
        '.dataTables_wrapper',
        '[role="grid"]',
        '.table-responsive',
        '.data-table',
        '.grid-view'
      ];
      
      info.foundSelectors = [];
      for (const selector of tableSelectors) {
        if (document.querySelector(selector)) {
          info.foundSelectors.push(selector);
        }
      }
      
      // Get text content preview
      info.bodyTextPreview = document.body.innerText.substring(0, 500);
      
      // Check for any loading indicators
      info.hasLoader = !!document.querySelector('.loader, .loading, .spinner, [class*="load"]');
      
      // Check for any error messages
      info.hasError = !!document.querySelector('.error, .alert-danger, [class*="error"]');
      
      return info;
    });
    
    console.log('\n📊 Page Analysis:');
    console.log('Title:', pageContent.title);
    console.log('Tables found:', pageContent.tables);
    console.log('Forms found:', pageContent.forms);
    console.log('Buttons found:', pageContent.buttons);
    console.log('Has DataTable:', pageContent.hasDataTable);
    console.log('Has Bootstrap Table:', pageContent.hasBootstrapTable);
    console.log('Has Grid:', pageContent.hasGrid);
    console.log('Found selectors:', pageContent.foundSelectors);
    console.log('Has loader:', pageContent.hasLoader);
    console.log('Has error:', pageContent.hasError);
    console.log('\nBody text preview:');
    console.log(pageContent.bodyTextPreview);
    
    // Take screenshot
    await page.screenshot({ path: 'latvia-debug-full.png', fullPage: true });
    console.log('\n📸 Screenshot saved as latvia-debug-full.png');
    
    // Try to find any clickable elements that might load data
    const clickableElements = await page.evaluate(() => {
      const elements: string[] = [];
      
      // Check for search/filter buttons
      const buttons = document.querySelectorAll('button, input[type="submit"], a.btn');
      buttons.forEach((btn) => {
        const text = (btn.textContent || '').trim();
        if (text && text.length < 50) {
          elements.push(`Button: "${text}"`);
        }
      });
      
      return elements;
    });
    
    console.log('\n🔘 Clickable elements found:', clickableElements);
    
    // Check for iframes
    const frames = await page.frames();
    console.log('\n🖼️ Number of frames:', frames.length);
    
    if (frames.length > 1) {
      console.log('⚠️ Multiple frames detected! The content might be in an iframe.');
      
      // Check each frame
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        try {
          const frameContent = await frame.evaluate(() => {
            return {
              url: window.location.href,
              tables: document.querySelectorAll('table').length,
              bodyLength: document.body ? document.body.innerText.length : 0
            };
          });
          console.log(`Frame ${i}:`, frameContent);
        } catch (e) {
          console.log(`Frame ${i}: Unable to access (cross-origin?)`);
        }
      }
    }
    
    console.log('\n⏰ Keeping browser open for 30 seconds for manual inspection...');
    console.log('You can interact with the page to see what loads the data.');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ Debug session completed');
    }
  }
}

// Run the debug script
debugLatviaScraper().catch(console.error);

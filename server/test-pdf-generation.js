const puppeteer = require('puppeteer');
const fs = require('fs');

async function testPdfGeneration() {
  console.log('Testing PDF generation on server...');
  console.log('Environment variables:');
  console.log('PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
  console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS);
  
  let browser;
  
  try {
    console.log('Launching browser...');
    
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--memory-pressure-off',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--no-zygote',
        '--single-process',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-ipc-flooding-protection',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-background-networking',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled'
      ],
      timeout: 60000,
      protocolTimeout: 60000
    });
    
    console.log('Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('New page created');
    
    // Test with simple HTML
    const testHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <h1>اختبار إنشاء PDF</h1>
      <p>هذا اختبار بسيط لإنشاء ملف PDF على الخادم.</p>
      <p>التاريخ: ${new Date().toLocaleString('ar-SA')}</p>
    </body>
    </html>
    `;
    
    console.log('Setting page content...');
    await page.setContent(testHtml, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      timeout: 30000
    });
    
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Save test PDF
    const filename = `test-pdf-${Date.now()}.pdf`;
    fs.writeFileSync(filename, pdfBuffer);
    console.log('Test PDF saved as:', filename);
    
    console.log('✓ PDF generation test completed successfully!');
    
  } catch (error) {
    console.error('❌ PDF generation test failed:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if Chrome is installed
    if (error.message.includes('Could not find browser')) {
      console.error('Chrome browser not found. Please check:');
      console.error('1. Chrome installation: which google-chrome-stable');
      console.error('2. Environment variable: echo $PUPPETEER_EXECUTABLE_PATH');
      console.error('3. Try running: sudo apt-get install -y google-chrome-stable');
    }
    
    process.exit(1);
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
}

// Run the test
testPdfGeneration().catch(console.error);

import Mailosaur from 'mailosaur';
import { BrowserManager } from '../src/browser/manager';
import { BrowserTool } from '../src/browser/core/browser-tool';
import { initialize, getConfig } from '../src/index';
import { chromium } from 'playwright';
import pc from 'picocolors';

async function testEmailRendering() {
  console.log(pc.cyan('\n📧 Testing Email'));

  // Initialize config
  await initialize();
  const config = getConfig();
  
  if (!config.mailosaur?.apiKey || !config.mailosaur?.serverId) {
    throw new Error('Mailosaur config missing');
  }

  // Setup Mailosaur
  const mailosaur = new Mailosaur(config.mailosaur.apiKey);

  try {
    // 1. Send a test email
    console.log('Sending test email...');
    await mailosaur.messages.create(config.mailosaur.serverId, {
      to: 'test@example.com',
      subject: 'Test Email Rendering',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Test Email</h1>
          <p>This is a test email for rendering validation.</p>
          <a href="https://example.com">Test Link</a>
        </div>
      `
    });

    // 2. Setup browser
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const browserManager = new BrowserManager(config);
    const browserTool = new BrowserTool(page, browserManager, {
      width: 1280,
      height: 720
    });

    // 3. Test render_email tool
    console.log('Testing email rendering...');
    const result = await browserTool.execute({
      action: 'check_email'
    });

    // 4. Validate
    console.log('Validating result...');
    if (!result.metadata?.window_info?.title?.includes('Test Email')) {
      throw new Error('Email content not found');
    }

    console.log(pc.green('✓ Email rendering test passed'));
    
    // 5. Cleanup
    await browser.close();

  } catch (error) {
    console.error(pc.red('❌ Email test failed:'), error);
    throw error;
  }
}

// Run test
testEmailRendering().catch(console.error);

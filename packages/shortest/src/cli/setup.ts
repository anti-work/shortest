import { execSync } from 'child_process';
import pc from 'picocolors';
import { platform } from 'os';
import type { ExecSyncOptions } from 'child_process';

async function setup() {
  const isWindows = platform() === 'win32';
  const options: ExecSyncOptions = {
    stdio: 'inherit' as const,
    shell: isWindows ? 'cmd.exe' : '/bin/bash'
  };
  
  try {
    // Install Playwright browsers with verification
    console.log(pc.yellow('Installing Playwright browsers...'));
    try {
      // First try to verify if browser is already installed
      try {
        const { chromium } = require('playwright');
        const browser = await chromium.launch();
        await browser.close();
        console.log(pc.green('✓ Playwright browsers already installed'));
      } catch {
        // Browser not installed or failed to launch, install it
        const installCmd = isWindows ? 'npx.cmd playwright install chromium' : 'npx playwright install chromium';
        execSync(installCmd, options);
        
        // Verify installation
        const { chromium } = require('playwright');
        const browser = await chromium.launch();
        await browser.close();
      }
    } catch (err) {
      console.warn(pc.yellow('\nWarning: Playwright browser installation failed'));
      console.log(pc.cyan('Please run manually: npx playwright install chromium\n'));
    }
    
    console.log(pc.green('✓ Setup complete!'));
    console.log(pc.cyan('\nMake sure to set your ANTHROPIC_API_KEY in .env'));

  } catch (error) {
    console.error(pc.red('\nSetup Warning:'), error instanceof Error ? error.message : String(error));
    process.exit(0);
  }
}

if (process.env.npm_lifecycle_event === 'postinstall') {
  setup();
}

export { setup }; 
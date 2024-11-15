import { BrowserManager } from '../src/core/browser-manager';
import { BrowserTool } from '../src/browser-use/browser';
import { GitHubTool } from '../src/tools/github';
import { initialize } from '../src/index';
import pc from 'picocolors';

async function testGithubLogin() {
  const browserManager = new BrowserManager();

  try {
    await initialize();
    console.log(pc.cyan('\n🚀 First browser launch...'));
    const context = await browserManager.launch();
    const page = context.pages()[0];

    let browserTool = new BrowserTool(page, {
      width: 1920,
      height: 1080
    });

    const githubTool = new GitHubTool();

    // console.log(pc.cyan('\n🧹 Clearing initial session...'));
    // await browserTool.execute({ action: 'clear_session' });
    
    // Wait for network to be idle and page to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    // Wait for button to be visible and stable
    await page.waitForSelector('button:has-text("Sign in")', { state: 'visible' });
    await page.click('button:has-text("Sign in")');
    
    // Wait for GitHub button to be ready
    await page.waitForSelector('.cl-socialButtonsBlockButton__github', { state: 'visible' });
    await page.click('.cl-socialButtonsBlockButton__github');
    
    console.log(pc.cyan('\n🔐 Starting GitHub login flow...'));
    await githubTool.GithubLogin(browserTool, {
      username: process.env.GITHUB_USERNAME || '',
      password: process.env.GITHUB_PASSWORD || ''
    });

    console.log(pc.cyan('\n🔒 Closing first browser...'));
    await browserManager.close();

    // Launch fresh browser
    console.log(pc.cyan('\n🚀 Launching fresh browser to verify clean state...'));
    const newContext = await browserManager.launch();
    const newPage = newContext.pages()[0];

    // Create new browser tool instance
    browserTool = new BrowserTool(newPage, {
      width: 1920,
      height: 1080
    });

    console.log(pc.cyan('\n🔍 Checking login state...'));
    await newPage.goto('http://localhost:3000');
    await newPage.waitForLoadState('networkidle');
    await newPage.waitForTimeout(2000);

    console.log(pc.green('\n✅ Clean Session Test Complete'));

  } catch (error) {
    console.error(pc.red('\n❌ Test failed:'), error);
  } finally {
    await browserManager.close();
  }
}

console.log(pc.cyan('🧪 Session Cleanup Test'));
console.log(pc.cyan('===================='));
testGithubLogin().catch(console.error); 
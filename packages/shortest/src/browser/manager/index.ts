import { chromium, Browser, BrowserContext } from 'playwright';
import { ShortestConfig } from '../../types/config';
import { URL } from 'url';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: ShortestConfig;

  constructor(config: ShortestConfig) {
    this.config = config;
  }

  private normalizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  async launch(): Promise<BrowserContext> {
    this.browser = await chromium.launch({
      headless: this.config.headless ?? false
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await this.context.newPage();
    await page.goto(this.normalizeUrl(this.config.baseUrl));
    await page.waitForLoadState('networkidle');

    return this.context;
  }

  async clearContext(): Promise<BrowserContext> {
    if (!this.context) {
      throw new Error('No context available');
    }

    // Clear all browser state
    await Promise.all([
      this.context.clearCookies(),
      // Clear storage
      this.context.pages().map(page => 
        page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
          indexedDB.deleteDatabase('shortest');
        })
      ),
      // Clear permissions
      this.context.clearPermissions(),
    ]);

    // Navigate all pages to blank
    await Promise.all(
      this.context.pages().map(page => 
        page.goto('about:blank')
      )
    );

    // Close all pages except first
    const pages = this.context.pages();
    if (pages.length > 1) {
      await Promise.all(
        pages.slice(1).map(page => page.close())
      );
    }

    // Navigate first page to baseUrl
    const baseUrl = this.config.baseUrl;
    await pages[0].goto(baseUrl);
    await pages[0].waitForLoadState('networkidle');

    return this.context;
  }

  async recreateContext(): Promise<BrowserContext> {
    return this.clearContext();
  }

  private async closeContext(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }

  async close(): Promise<void> {
    await this.closeContext();
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getContext(): BrowserContext | null {
    return this.context;
  }
} 
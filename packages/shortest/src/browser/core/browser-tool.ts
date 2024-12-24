// Add window interface extension
declare global {
  interface Window {
    cursorPosition: { x: number; y: number };
    lastPosition: { x: number; y: number };
    showClick: () => void;
  }
}

import { Page, Browser } from 'playwright';
import { BaseBrowserTool, ToolError } from './index';
import { ActionInput, ToolResult, BetaToolType } from '../../types/browser';
import { writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { GitHubTool } from '../integrations/github';
import { BrowserManager } from '../manager';
import { TestContext, BrowserToolConfig, TestFunction } from '../../types';
import * as actions from '../actions';
import pc from 'picocolors';
import { CallbackError } from '../../types/test';
import { AssertionCallbackError } from '../../types/test';

export class BrowserTool extends BaseBrowserTool {
  private page: Page;
  private browserManager: BrowserManager;
  protected readonly toolType: BetaToolType = "computer_20241022";
  protected readonly toolName: string = "computer";
  private screenshotDir: string;
  private cursorVisible: boolean = true;
  private lastMousePosition: [number, number] = [0, 0];
  private githubTool?: GitHubTool;
  private viewport: { width: number; height: number };
  private testContext?: TestContext;
  private readonly MAX_SCREENSHOTS = 10;
  private readonly MAX_AGE_HOURS = 5;

  constructor(
    page: Page, 
    browserManager: BrowserManager,
    config: BrowserToolConfig
  ) {
    super(config);
    this.page = page;
    this.browserManager = browserManager;
    this.screenshotDir = join(process.cwd(), '.shortest', 'screenshots');
    mkdirSync(this.screenshotDir, { recursive: true });
    this.viewport = { width: config.width, height: config.height };
    this.testContext = config.testContext;
    
    this.initialize();
    this.cleanupScreenshots();
  }

  private async initialize(): Promise<void> {
    // Initial setup with retry
    const initWithRetry = async () => {
      for (let i = 0; i < 3; i++) {
        try {
          await this.initializeCursor();
          break;
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    };

    await initWithRetry();
    
    // Re-initialize on navigation
    this.page.on('load', async () => {
      await initWithRetry();
    });
  }

  private async initializeCursor(): Promise<void> {
    try {
      // Simpler check for page readiness
      await this.page.waitForLoadState('domcontentloaded', { timeout: 1000 })
        .catch(() => {});

      // Add styles only if they don't exist
      const hasStyles = await this.page.evaluate(() => {
        return !!document.querySelector('style[data-shortest-cursor]');
      }).catch(() => false);

      if (!hasStyles) {
        // Create style element directly in evaluate
        await this.page.evaluate(() => {
          const style = document.createElement('style');
          style.setAttribute('data-shortest-cursor', 'true');
          style.textContent = `
            #ai-cursor {
              width: 20px;
              height: 20px;
              border: 2px solid red;
              border-radius: 50%;
              position: fixed;
              pointer-events: none;
              z-index: 999999;
              transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
              transform: translate(-50%, -50%);
              background-color: rgba(255, 0, 0, 0.2);
            }
            #ai-cursor.clicking {
              transform: translate(-50%, -50%) scale(0.8);
              background-color: rgba(255, 0, 0, 0.4);
            }
            #ai-cursor-trail {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              position: fixed;
              pointer-events: none;
              z-index: 999998;
              background-color: rgba(255, 0, 0, 0.1);
              transition: all 0.1s linear;
              transform: translate(-50%, -50%);
            }
          `;
          document.head.appendChild(style);
        });
      }

      // Initialize cursor elements with position persistence
      await this.page.evaluate(() => {
        if (!document.getElementById('ai-cursor')) {
          const cursor = document.createElement('div');
          cursor.id = 'ai-cursor';
          document.body.appendChild(cursor);

          const trail = document.createElement('div');
          trail.id = 'ai-cursor-trail';
          document.body.appendChild(trail);

          // Restore or initialize position
          window.cursorPosition = window.cursorPosition || { x: 0, y: 0 };
          window.lastPosition = window.lastPosition || { x: 0, y: 0 };

          // Set initial position
          cursor.style.left = window.cursorPosition.x + 'px';
          cursor.style.top = window.cursorPosition.y + 'px';
          trail.style.left = window.cursorPosition.x + 'px';
          trail.style.top = window.cursorPosition.y + 'px';

          // Update handler
          const updateCursor = (x: number, y: number) => {
            window.cursorPosition = { x, y };
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
            
            requestAnimationFrame(() => {
              trail.style.left = `${x}px`;
              trail.style.top = `${y}px`;
            });
          };

          document.addEventListener('mousemove', (e) => {
            window.lastPosition = window.cursorPosition;
            updateCursor(e.clientX, e.clientY);
          });
        }
      });

    } catch (error) {
      if (error instanceof Error && 
          !error.message.includes('context was destroyed') && 
          !error.message.includes('Target closed')) {
        console.warn('Cursor initialization failed:', error);
      }
    }
  }

  public async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  public async clickAtCoordinates(x: number, y: number): Promise<void> {
    await actions.click(this.page, x, y);
  }

  async execute(input: ActionInput): Promise<ToolResult> {
    try {
      let output = '';
      let metadata = {};

      switch (input.action) {
        case 'left_click':
        case 'right_click':
        case 'middle_click':
        case 'double_click': {
          const clickCoords = input.coordinates || this.lastMousePosition;
          await this.clickAtCoordinates(clickCoords[0], clickCoords[1]);
          output = `${input.action} at (${clickCoords[0]}, ${clickCoords[1]})`;
          
          // Get initial metadata before potential navigation
          metadata = await this.getMetadata();
          
          // Wait briefly for navigation to start
          await this.page.waitForTimeout(100);
          
          // If navigation started, get updated metadata
          if (await this.page.evaluate(() => document.readyState !== 'complete').catch(() => true)) {
            try {
              await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 });
              metadata = await this.getMetadata();
            } catch {
              // Keep the initial metadata if navigation timeout
            }
          }
          break;
        }

        case 'mouse_move':
          const coords = input.coordinates || (input as any).coordinate;
          if (!coords) {
            throw new ToolError('Coordinates required for mouse_move');
          }
          await actions.mouseMove(this.page, coords[0], coords[1]);
          this.lastMousePosition = [coords[0], coords[1]];
          output = `Mouse moved to (${coords[0]}, ${coords[1]})`;
          break;

        case 'left_click_drag':
          if (!input.coordinates) {
            throw new ToolError('Coordinates required for left_click_drag');
          }
          await actions.dragMouse(this.page, input.coordinates[0], input.coordinates[1]);
          output = `Dragged mouse to (${input.coordinates[0]}, ${input.coordinates[1]})`;
          break;

        case 'cursor_position':
          const position = await actions.getCursorPosition(this.page);
          output = `Cursor position: (${position[0]}, ${position[1]})`;
          break;

        case 'screenshot':
          return await this.takeScreenshotWithMetadata();

        case 'type':
          if (!input.text) {
            throw new ToolError('Text required for type action');
          }
          await this.page.waitForTimeout(100);
          await this.page.keyboard.type(input.text);
          await this.page.waitForTimeout(100);
          output = `Typed: ${input.text}`;
          break;

        case 'key': {
          if (!input.text) {
            throw new ToolError('Key required for key action');
          }
          
          await this.page.waitForTimeout(100);
          
          const keyText = input.text.toLowerCase();
          const keys = Array.isArray(actions.keyboardShortcuts[keyText]) ? 
            actions.keyboardShortcuts[keyText] : 
            [actions.keyboardShortcuts[keyText] || input.text];

          if (Array.isArray(keys)) {
            for (const key of keys) {
              await this.page.keyboard.down(key);
            }
            for (const key of [...keys].reverse()) {
              await this.page.keyboard.up(key);
            }
          } else {
            await this.page.keyboard.press(keys);
          }
          
          await this.page.waitForTimeout(100);
          output = `Pressed key: ${input.text}`;
          break;
        }

        case 'github_login': {
          if (!this.githubTool) {
            this.githubTool = new GitHubTool();
          }
          const loginResult = await this.githubTool.GithubLogin(this, {
            username: input.username as string,
            password: input.password as string
          });

          output = loginResult.success ? 
              'GitHub login was successfully completed' : 
              `GitHub login failed: ${loginResult.error}`;
          break;
        }

        case 'clear_session':
          const newContext = await this.browserManager.recreateContext();
          this.page = newContext.pages()[0] || await newContext.newPage();
          await this.page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
          });

          return {
            output: 'Successfully cleared browser data and created new context',
            metadata: {}
          };

        case 'run_callback': {
          if (!this.testContext?.currentTest) {
            throw new ToolError('No test context available for callback execution');
          }

          const testContext = this.testContext;
          const currentTest = testContext.currentTest as TestFunction;
          
          const currentStepIndex = testContext.currentStepIndex ?? 0;

          try {
            if (currentStepIndex === 0 && currentTest.fn) {
              await currentTest.fn(testContext);
              testContext.currentStepIndex = 1;
              return { output: 'Test function executed successfully' };
            } else {
              // Handle expectations
              const expectationIndex = currentStepIndex - 1;
              const expectation = currentTest.expectations?.[expectationIndex];
              
              if (expectation?.fn) {
                await expectation.fn(this.testContext);
                testContext.currentStepIndex = currentStepIndex + 1;
                return {
                  output: `Callback function for "${expectation.description}" passed successfully`
                };
              } else {
                return {
                  output: `Skipping callback execution: No callback function defined for expectation "${expectation?.description}"`
                };
              }
            }
          } catch (error) {
            // Check if it's an assertion error from jest/expect
            if (error && (error as any).matcherResult) {
              const assertionError = error as any;
              throw new AssertionCallbackError(
                assertionError.message,
                assertionError.matcherResult.actual,
                assertionError.matcherResult.expected
              );
            }
            throw new CallbackError(error instanceof Error ? error.message : String(error));
          }
        }

        case 'navigate': {          
          if (!input.url) {
            throw new ToolError('URL required for navigation');
          }

          // Create new tab
          const newPage = await this.page.context().newPage();
          
          try {
            const navigationTimeout = 30000;
            
            await newPage.goto(input.url, {
              timeout: navigationTimeout,
              waitUntil: 'domcontentloaded'
            });

            await newPage.waitForLoadState('load', {
              timeout: 5000
            }).catch(e => {
              console.log('⚠️ Load timeout, continuing anyway');
            });
            
            // Switch focus
            this.page = newPage;

            output = `Navigated to ${input.url}`;
            metadata = {
              window_info: {
                url: input.url,
                title: await newPage.title(),
                size: this.page.viewportSize() || { width: this.width, height: this.height }
              }
            };
            
            break;
          } catch (error) {
            await newPage.close();
            throw new ToolError(`Navigation failed: ${error}`);
          }
        }

        case 'sleep_milliseconds': {
          const defaultDuration = 1000;
          const maxDuration = 60000;
          let duration = input.duration ?? defaultDuration;
          
          // Enforce maximum duration
          if (duration > maxDuration) {
            console.warn(`Requested sleep duration ${duration}ms exceeds maximum of ${maxDuration}ms. Using maximum.`);
            duration = maxDuration;
          }

          // Convert to seconds for logging
          const seconds = Math.round(duration / 1000);
          console.log(`⏳ Waiting for ${seconds} second${seconds !== 1 ? 's' : ''}...`);
          
          await this.page.waitForTimeout(duration);
          output = `Finished waiting for ${seconds} second${seconds !== 1 ? 's' : ''}`;
          break;
        }

        default:
          throw new ToolError(`Unknown action: ${input.action}`);
      }

      // Get and log metadata
      try {
        await this.page.waitForTimeout(200);
        metadata = await this.getMetadata();
      } catch (metadataError) {
        console.warn('Failed to get metadata:', metadataError);
        metadata = {};
      }
      
      return {
        output,
        metadata
      };

    } catch (error) {
      console.error(pc.red('\n❌ Browser Action Failed:'), error);
      
      if (error instanceof AssertionCallbackError) {
        return {
          output: `Assertion failed: ${error.message}${
            error.actual !== undefined ? 
            `\nExpected: ${error.expected}\nReceived: ${error.actual}` : 
            ''
          }`
        };
      }
      if (error instanceof CallbackError) {
        return {
          output: `Callback execution failed: ${error.message}`
        };
      }
      throw new ToolError(`Action failed: ${error}`);
    }
  }

  private async getMetadata(): Promise<any> {
    const metadata: any = {
      window_info: {},
      cursor_info: { position: [0, 0], visible: true }
    };

    try {
      // Try to get basic page info first
      let url: string;
      let title: string;
      
      try {
        url = await this.page.url();
      } catch {
        url = 'navigating...';
      }

      try {
        title = await this.page.title();
      } catch {
        title = 'loading...';
      }

      metadata.window_info = {
        url,
        title,
        size: this.page.viewportSize() || { width: this.width, height: this.height }
      };

      // Only try to get cursor position if page is stable
      if (await this.isPageStable()) {
        const position = await actions.getCursorPosition(this.page);
        metadata.cursor_info = {
          position,
          visible: this.cursorVisible
        };
      }

      return metadata;

    } catch (error) {
      // Return whatever metadata we collected
      return metadata;
    }
  }

  private async isPageStable(): Promise<boolean> {
    try {
      // Quick check if page is in a stable state
      return await this.page.evaluate(() => {
        return document.readyState === 'complete' && 
               !document.querySelector('.loading') && 
               !document.querySelector('.cl-loading');
      }).catch(() => false);
    } catch {
      return false;
    }
  }

  private async takeScreenshotWithMetadata(): Promise<ToolResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = join(this.screenshotDir, `screenshot-${timestamp}.png`);
    
    const buffer = await this.page.screenshot({
      type: 'jpeg',
      quality: 50,
      scale: 'device',
      fullPage: false
    });

    writeFileSync(filePath, buffer);
    console.log(`Screenshot saved to: ${filePath}`);
    
    return {
      output: 'Screenshot taken',
      base64_image: buffer.toString('base64'),
      metadata: await this.getMetadata()
    };
  }

  toToolParameters() {
    return {
      type: this.toolType,
      name: this.toolName,
      display_width_px: this.width,
      display_height_px: this.height,
      display_number: this.displayNum
    };
  }

  // Selector-based methods
  public async waitForSelector(selector: string, options?: { timeout: number }): Promise<void> {
    await this.page.waitForSelector(selector, options);
  }

  public async fill(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  public async press(selector: string, key: string): Promise<void> {
    await this.page.press(selector, key);
  }

  public async findElement(selector: string) {
    return this.page.$(selector);
  }

  getPage(): Page {
    return this.page;
  }

  public async waitForNavigation(options?: { timeout: number }): Promise<void> {
    await this.page.waitForLoadState('load', { timeout: options?.timeout });
  }

  updateTestContext(newContext: TestContext) {
    this.testContext = newContext;
  }

  private cleanupScreenshots(): void {
    try {
      const files = readdirSync(this.screenshotDir)
        .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
        .map(file => ({
          name: file,
          path: join(this.screenshotDir, file),
          time: statSync(join(this.screenshotDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // newest first

      const now = Date.now();
      const fiveHoursMs = this.MAX_AGE_HOURS * 60 * 60 * 1000;

      files.forEach((file, index) => {
        const isOld = (now - file.time) > fiveHoursMs;
        const isBeyondLimit = index >= this.MAX_SCREENSHOTS;

        if (isOld || isBeyondLimit) {
          try {
            unlinkSync(file.path);
          } catch (error) {
            console.warn(`Failed to delete screenshot: ${file.path}`);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup screenshots:', error);
    }
  }

  async showCursor(): Promise<void> {
    this.cursorVisible = true;
    await this.page.evaluate(() => {
      const cursor = document.getElementById('ai-cursor');
      const trail = document.getElementById('ai-cursor-trail');
      if (cursor) cursor.style.display = 'block';
      if (trail) trail.style.display = 'block';
    });
  }

  async hideCursor(): Promise<void> {
    this.cursorVisible = false;
    await this.page.evaluate(() => {
      const cursor = document.getElementById('ai-cursor');
      const trail = document.getElementById('ai-cursor-trail');
      if (cursor) cursor.style.display = 'none';
      if (trail) trail.style.display = 'none';
    });
  }
}

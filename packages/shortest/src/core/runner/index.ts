import { glob } from 'glob';
import { resolve } from 'path';
import { TestCompiler } from '../compiler';
import { BrowserManager } from '../../browser/manager';
import { BrowserTool } from '../../browser/core/browser-tool';
import { SnapshotBrowserTool } from '../../browser/core/snapshot-browser-tool';
import { AIClient } from '../../ai/client';
import { initialize, getConfig } from '../../index';
import { TestFunction, TestContext, ShortestConfig } from '../../types';
import { Logger } from '../../utils/logger';
import { TestBuilder } from '../builder';
import Anthropic from '@anthropic-ai/sdk';
import { APIRequest, BrowserContext } from 'playwright';
import * as playwright from 'playwright';
import { request, chromium, APIRequestContext } from 'playwright';
import { SnapshotAIClient } from '../../ai/snapshot-client';

interface TestResult {
  result: 'pass' | 'fail';
  reason: string;
}

export class TestRunner {
  private config!: ShortestConfig;
  private cwd: string;
  private exitOnSuccess: boolean;
  private forceHeadless: boolean;
  private targetUrl: string | undefined;
  private compiler: TestCompiler;
  private browserManager!: BrowserManager;
  private logger: Logger;
  private debugAI: boolean;
  private testContext: TestContext | null = null;

  constructor(
    cwd: string, 
    exitOnSuccess = true, 
    forceHeadless = false, 
    targetUrl?: string,
    debugAI = false
  ) {
    this.cwd = cwd;
    this.exitOnSuccess = exitOnSuccess;
    this.forceHeadless = forceHeadless;
    this.targetUrl = targetUrl;
    this.debugAI = debugAI;
    this.compiler = new TestCompiler();
    this.logger = new Logger();
  }

  async initialize() {
    // Initialize global config first
    await initialize();
    this.config = getConfig();

    // Override with CLI options
    if (this.forceHeadless) {
      this.config = {
        ...this.config,
        headless: true
      };
    }

    if (this.targetUrl) {
      this.config = {
        ...this.config,
        baseUrl: this.targetUrl
      };
    }

    this.browserManager = new BrowserManager(this.config);
  }

  private async findTestFiles(pattern?: string): Promise<string[]> {
    const testDirs = Array.isArray(this.config.testDir) 
      ? this.config.testDir 
      : [this.config.testDir || '__tests__'];

    const files = [];
    for (const dir of testDirs) {
      if (pattern) {
        const cleanPattern = pattern
          .replace(/\.ts$/, '')
          .replace(/\.test$/, '')
          .split('/')
          .pop();
        
        const globPattern = `${dir}/**/${cleanPattern}.test.ts`;
        const matches = await glob(globPattern, { 
          cwd: this.cwd,
          absolute: true
        });
        
        files.push(...matches);
      } else {
        const globPattern = `${dir}/**/*.test.ts`;
        const matches = await glob(globPattern, { cwd: this.cwd });
        files.push(...matches.map(f => resolve(this.cwd, f)));
      }
    }

    if (files.length === 0) {
      this.logger.error('Test Discovery', `No test files found in directories: ${testDirs.join(', ')}`);
      process.exit(1);
    }

    return files;
  }

  private async createTestContext(context: BrowserContext): Promise<TestContext> {
    if (!this.testContext) {
      // Create a properly typed playwright object
      const playwrightObj = {
        ...playwright,
        request: {
          ...request,
          newContext: async (options?: { extraHTTPHeaders?: Record<string, string> }) => {
            const requestContext = await request.newContext({
              baseURL: this.config.baseUrl,
              ...options
            });
            return requestContext;
          }
        }
      } as typeof playwright & {
        request: APIRequest & {
          newContext: (options?: { extraHTTPHeaders?: Record<string, string> }) => Promise<APIRequestContext>;
        };
      };

      this.testContext = {
        page: context.pages()[0],
        browser: this.browserManager.getBrowser()!,
        playwright: playwrightObj
      };
    }
    return this.testContext;
  }

  private async executeTest(test: TestFunction, context: BrowserContext) {
    // If it's direct execution, skip AI
    if (test.directExecution) {
      try {
        const testContext = await this.createTestContext(context);
        await test.fn?.(testContext);
        return { result: 'pass' as const, reason: 'Direct execution successful' };
      } catch (error) {
        return { 
          result: 'fail' as const, 
          reason: error instanceof Error ? error.message : 'Direct execution failed' 
        };
      }
    }

    // Use the shared context
    const testContext = await this.createTestContext(context);
    const browserTool = new SnapshotBrowserTool(testContext.page, this.browserManager, {
      width: 1920,
      height: 1080,
      testContext: {
        ...testContext,
        currentTest: test,
        currentStepIndex: 0
      }
    });

    const baseAiClient = new AIClient({
      apiKey: this.config.anthropicKey,
      model: 'claude-3-5-sonnet-20241022',
      maxMessages: 10,
      debug: this.debugAI
    }, this.debugAI);

    const aiClient = new SnapshotAIClient(baseAiClient);

    // First get page state
    const initialState = await browserTool.execute({ 
      action: 'screenshot' 
    });

    // Build prompt with initial state and screenshot
    const prompt = [
      `Test: "${test.name}"`,
      test.payload ? `Context: ${JSON.stringify(test.payload)}` : '',
      `Callback function: ${test.fn ? ' [HAS_CALLBACK]' : ' [NO_CALLBACK]'}`,
      
      // Add expectations if they exist
      ...(test.expectations?.length ? [
        '\nExpect:',
        ...test.expectations.map((exp, i) => 
          `${i + 1}. ${exp.description}${exp.fn ? ' [HAS_CALLBACK]' : '[NO_CALLBACK]'}`
        )
      ] : []),
      
      '\nCurrent Page State:',
      `URL: ${initialState.metadata?.window_info?.url || 'unknown'}`,
      `Title: ${initialState.metadata?.window_info?.title || 'unknown'}`
    ].filter(Boolean).join('\n');

    // Execute test with enhanced prompt
    const result = await aiClient.processAction(prompt, browserTool);

    if (!result) {
      throw new Error('AI processing failed: no result returned');
    }

    // Parse AI result first
    const finalMessage = result.finalResponse.content.find(block => 
      block.type === 'text' && 
      (block as Anthropic.Beta.Messages.BetaTextBlock).text.includes('"result":')
    );

    if (!finalMessage || finalMessage.type !== 'text') {
      throw new Error('No test result found in AI response');
    }

    const jsonMatch = (finalMessage as Anthropic.Beta.Messages.BetaTextBlock).text.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error('Invalid test result format');
    }

    const aiResult = JSON.parse(jsonMatch[0]) as TestResult;

    // Execute after function if present
    if (test.afterFn) {
      try {
        await test.afterFn(testContext);
      } catch (error) {
        return {
          result: 'fail' as const,
          reason: aiResult.result === 'fail'
            ? `AI: ${aiResult.reason}, After: ${error instanceof Error ? error.message : String(error)}`
            : error instanceof Error ? error.message : String(error)
        };
      }
    }

    return aiResult;
  }

  private async executeTestFile(file: string) {
    try {
      const registry = (global as any).__shortest__.registry;

      registry.tests.clear();
      registry.currentFileTests = [];
      
      this.logger.startFile(file);
      const compiledPath = await this.compiler.compileFile(file);
      await import(compiledPath);

      const context = await this.browserManager.launch();
      const testContext = await this.createTestContext(context);

      try {
        // Execute beforeAll hooks with shared context
        for (const hook of registry.beforeAllFns) {
          await hook(testContext);
        }

        // Execute tests in order they were defined
        for (const test of registry.currentFileTests) {
          // Execute beforeEach hooks with shared context
          for (const hook of registry.beforeEachFns) {
            await hook(testContext);
          }

          const result = await this.executeTest(test, context);
          this.logger.reportTest(
            test.name, 
            result.result === 'pass' ? 'passed' : 'failed',
            result.result === 'fail' ? new Error(result.reason) : undefined
          );

          // Execute afterEach hooks with shared context
          for (const hook of registry.afterEachFns) {
            await hook(testContext);
          }
        }

        // Execute afterAll hooks with shared context
        for (const hook of registry.afterAllFns) {
          await hook(testContext);
        }

      } finally {
        await this.browserManager.close();
        this.testContext = null;  // Reset the context
        registry.beforeAllFns = [];
        registry.afterAllFns = [];
        registry.beforeEachFns = [];
        registry.afterEachFns = [];
      }

    } catch (error) {
      this.testContext = null;  // Reset on error
      if (error instanceof Error) {
        this.logger.reportError('Test Execution', error.message);
      }
    }
  }

  async runFile(pattern: string) {
    await this.initialize();
    const files = await this.findTestFiles(pattern);
    
    if (files.length === 0) {
      this.logger.error('Test Discovery', `No test files found matching: ${pattern}`);
      process.exit(1);
    }

    for (const file of files) {
      await this.executeTestFile(file);
    }
    
    this.logger.summary();

    if (this.exitOnSuccess && this.logger.allTestsPassed()) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }

  async runAll() {
    await this.initialize();
    const files = await this.findTestFiles();
    
    for (const file of files) {
      await this.executeTestFile(file);
    }
    
    this.logger.summary();

    if (this.exitOnSuccess && this.logger.allTestsPassed()) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

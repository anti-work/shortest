import { AIClient } from '../src/ai/client';
import { BrowserTool } from '../src/browser/core/browser-tool';
import { BrowserManager } from '../src/browser/manager';
import { getConfig, initialize } from '../src/index';
import type { TestFunction } from '../src/types/test';
import pc from 'picocolors';

async function testAI() {
  console.log(pc.cyan('\n🧪 Testing AI Integration'));
  console.log(pc.cyan('======================='));

  const browserManager = new BrowserManager(getConfig());

  try {
    await initialize();
    console.log('🚀 Launching browser...');
    const context = await browserManager.launch();
    const page = context.pages()[0];

    // Mock test data with callback
    const mockTest: TestFunction = {
      name: 'Test with callback',
      fn: async () => {
        console.log('Callback executed: Main test');
      },
      expectations: [
        {
          description: 'action performed',
          fn: async () => {
            console.log('Callback executed: Expectation');
          }
        }
      ]
    };

    const browserTool = new BrowserTool(page, browserManager, {
      width: 1920,
      height: 1080,
      testContext: {
        page,
        currentTest: mockTest,
        currentStepIndex: 0
      }
    });

    // Test first callback
    console.log('\n🔍 Testing first callback:');
    const result = await browserTool.execute({ 
      action: 'run_callback' 
    });
    console.log('Result:', result);

    // Update test context for expectation callback
    browserTool.updateTestContext({
      page,
      currentTest: mockTest,
      currentStepIndex: 1
    });

    // Test expectation callback
    console.log('\n🔍 Testing expectation callback:');
    const result2 = await browserTool.execute({ 
      action: 'run_callback' 
    });
    console.log('Result:', result2);

  } catch (error) {
    console.error(pc.red('❌ Test failed:'), error);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browserManager.close();
  }
}

console.log('🤖 AI Integration Test');
console.log('=====================');
testAI().catch(console.error);
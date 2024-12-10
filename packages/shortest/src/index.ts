import dotenv from 'dotenv';
import { join } from 'path';
import { expect as jestExpect } from 'expect';
import { TestCompiler } from './core/compiler';
import { 
  TestFunction,
  TestAPI,
  TestContext,
  TestChain,
  ShortestConfig,
  TestHookFunction
} from './types';

// Initialize config
let globalConfig: ShortestConfig | null = null;
const compiler = new TestCompiler();

// Initialize shortest namespace and globals
declare const global: {
  __shortest__: any;
  expect: any;
} & typeof globalThis;

if (!global.__shortest__) {
  global.__shortest__ = {
    expect: jestExpect,
    registry: {
      tests: new Map<string, TestFunction[]>(),
      currentFileTests: [],
      beforeAllFns: [],
      afterAllFns: [],
      beforeEachFns: [],
      afterEachFns: []
    }
  };

  // Attach to global scope
  global.expect = global.__shortest__.expect;

  dotenv.config({ path: join(process.cwd(), '.env') });
  dotenv.config({ path: join(process.cwd(), '.env.local') });
}

function validateConfig(config: Partial<ShortestConfig>) {
  const missingFields: string[] = [];
  
  if (config.headless === undefined) missingFields.push('headless');
  if (!config.baseUrl) missingFields.push('baseUrl');
  if (!config.testDir) missingFields.push('testDir');
  if (!config.anthropicKey && !process.env.ANTHROPIC_API_KEY) missingFields.push('anthropicKey');

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields in shortest.config.ts:\n` +
      missingFields.map(field => `  - ${field}`).join('\n')
    );
  }
}

export async function initialize() {
  if (globalConfig) return globalConfig;

  dotenv.config({ path: join(process.cwd(), '.env') });
  dotenv.config({ path: join(process.cwd(), '.env.local') });
  
  const configFiles = [
    'shortest.config.ts',
    'shortest.config.js',
    'shortest.config.mjs'
  ];

  for (const file of configFiles) {
    try {
      const module = await compiler.loadModule(file, process.cwd());
      if (module.default) {
        const config = module.default;
        validateConfig(config);
        
        globalConfig = {
          ...config,
          anthropicKey: process.env.ANTHROPIC_API_KEY || config.anthropicKey
        };
        
        return globalConfig;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Config Error: ${error.message}`);
      }
      continue;
    }
  }

  throw new Error(
    'No config file found. Create shortest.config.ts in your project root.\n' +
    'Required fields:\n' +
    '  - headless: boolean\n' +
    '  - baseUrl: string\n' +
    '  - testDir: string | string[]\n' +
    '  - anthropicKey: string'
  );
}

export function getConfig(): ShortestConfig {
  if (!globalConfig) {
    throw new Error('Config not initialized. Call initialize() first');
  }
  return globalConfig;
}

// New Test API Implementation
function createTestChain(name: string, payload?: any, fn?: (context: TestContext) => Promise<void>): TestChain {
  const test: TestFunction = {
    name,
    payload,
    fn,
    expectations: []
  };

  global.__shortest__.registry.tests.set(name, 
    [...(global.__shortest__.registry.tests.get(name) || []), test]
  );
  
  global.__shortest__.registry.currentFileTests.push(test);

  const chain: TestChain = {
    expect(description: string, payloadOrFn?: any, fn?: (context: TestContext) => Promise<void>) {
      test.expectations = test.expectations || [];
      
      // Handle different overloads
      if (typeof payloadOrFn === 'function') {
        fn = payloadOrFn;
        payloadOrFn = undefined;
      }
      
      test.expectations.push({
        description,
        payload: payloadOrFn,
        fn
      });
      return chain;
    }
  };

  return chain;
}

export const test: TestAPI = Object.assign(
  (name: string, payload?: any, fn?: (context: TestContext) => Promise<void>) => 
    createTestChain(name, payload, fn),
  {
    beforeAll: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === 'function' ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.beforeAllFns.push(hook);
    },
    afterAll: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === 'function' ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.afterAllFns.push(hook);
    },
    beforeEach: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === 'function' ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.beforeEachFns.push(hook);
    },
    afterEach: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === 'function' ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.afterEachFns.push(hook);
    }
  }
);

export type { ShortestConfig };

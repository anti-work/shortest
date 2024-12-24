import type { TestFunction, TestChain, TestContext } from '../../types';

export class TestBuilder {
  static generatePrompt(test: TestFunction): string {
    const lines = [
      `Test: "${test.name}"`,
    ];

    if (test.payload) {
      lines.push(`Context: ${JSON.stringify(test.payload)}`);
    }

    if (test.requires?.length) {
      lines.push(`Requires: ${test.requires.join(', ')}`);
    }

    const hasCallback = Boolean(test.fn);
    
    lines.push(
      'Steps:',
      `1. Execute test function${hasCallback ? ' [HAS_CALLBACK]' : ' [NO_CALLBACK]'}`
    );

    if (test.expectations && test.expectations.length > 0) {
      lines.push('Expected Results:');
      test.expectations.forEach(exp => {
        lines.push(`- ${exp.description}${exp.fn ? ' [HAS_CALLBACK]' : ' [NO_CALLBACK]'}`);
      });
    }

    return lines.filter(Boolean).join('\n');
  }

  static async parseModule(compiledModule: any): Promise<TestFunction[]> {
    const registry = (global as any).__shortest__.registry;
    const tests = Array.from(registry.tests.values()).flat();
    registry.tests.clear();
    return tests as TestFunction[];
  }

  private createTestChain(test: TestFunction): TestChain {
    const chain: TestChain = {
      expect: (...args: any[]) => {
        let description: string | undefined;
        let expectFn: ((context: TestContext) => Promise<void>) | undefined;
        let expectPayload: any;

        if (typeof args[0] === 'function') {
          expectFn = args[0];
        } else if (typeof args[0] === 'string') {
          description = args[0];
          if (args[1] && typeof args[1] === 'function') {
            expectFn = args[1];
          } else if (args[2] && typeof args[2] === 'function') {
            expectFn = args[2];
            expectPayload = args[1];
          }
        }

        if (!test.expectations) {
          test.expectations = [];
        }

        test.expectations.push({
          description,
          fn: expectFn,
          payload: expectPayload,
          directExecution: false
        });

        return chain;
      },
      after: (fn: (context: TestContext) => void | Promise<void>) => {
        test.afterFn = fn;
        return chain;
      },
      requires: (...testNames: string[]) => {
        test.requires = testNames;
        return chain;
      },
      run: (fn: (context: TestContext) => Promise<void>) => {
        test.fn = fn;
        return chain;
      }
    };
    return chain;
  }

  test(name: string, payload?: any, fn?: (context: TestContext) => Promise<void>): TestChain {
    const test: TestFunction = {
      name,
      payload,
      fn,
      expectations: []
    };

    const registry = (global as any).__shortest__.registry;
    if (!registry.tests.has(name)) {
      registry.tests.set(name, []);
    }
    registry.tests.get(name)!.push(test);
    registry.currentFileTests.push(test);

    return this.createTestChain(test);
  }
}

import { test } from '../src/index';
import pc from 'picocolors';

async function testDependencies() {
  console.log(pc.cyan('\n🧪 Testing Test Dependencies'));
  console.log(pc.cyan('========================='));

  try {
    // Test 1: Basic dependency chain
    console.log(pc.cyan('\nTest 1: Basic dependency chain'));
    test('Database setup')
      .run(async ({ page }) => {
        // Mock database setup
        await new Promise(r => setTimeout(r, 100));
      });

    test('Create user')
      .requires('Database setup')
      .run(async ({ page }) => {
        // Mock user creation
        await new Promise(r => setTimeout(r, 100));
      });

    // Test 2: Multiple dependencies
    console.log(pc.cyan('\nTest 2: Multiple dependencies'));
    test('Create post')
      .requires('Database setup', 'Create user')
      .run(async ({ page }) => {
        // Mock post creation
        await new Promise(r => setTimeout(r, 100));
      });

    // Test 3: Circular dependency detection
    console.log(pc.cyan('\nTest 3: Circular dependency detection'));
    try {
      test('Test A')
        .requires('Test B')
        .run(async () => {});

      test('Test B')
        .requires('Test A')
        .run(async () => {});

      console.log(pc.red('❌ Failed: Should detect circular dependency'));
    } catch (error) {
      console.log(pc.green('✅ Passed: Detected circular dependency'));
    }

    // Test 4: Missing dependency
    console.log(pc.cyan('\nTest 4: Missing dependency'));
    try {
      test('Orphan test')
        .requires('Non-existent test')
        .run(async () => {});

      console.log(pc.red('❌ Failed: Should detect missing dependency'));
    } catch (error) {
      console.log(pc.green('✅ Passed: Detected missing dependency'));
    }

    console.log(pc.green('\n✅ All dependency tests complete'));

  } catch (error) {
    console.error(pc.red('\n❌ Test failed:'), error);
  }
}

console.log(pc.cyan('🧪 Test Dependencies Test'));
console.log(pc.cyan('======================='));
testDependencies().catch(console.error); 
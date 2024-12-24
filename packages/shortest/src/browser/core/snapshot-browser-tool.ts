import { writeFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { BrowserTool } from './browser-tool';
import { ActionInput, ToolResult } from '../../types/browser';
import { TestContext } from '../../types/test';

export class SnapshotBrowserTool extends BrowserTool {
  private snapshotDir: string;
  private snapshotFile?: string;
  private shouldRecord: boolean = false;

  constructor(...args: ConstructorParameters<typeof BrowserTool>) {
    super(...args);
    
    // Create snapshots directory
    this.snapshotDir = join(process.cwd(), '.shortest', 'snapshots');
    mkdirSync(this.snapshotDir, { recursive: true });

    // Initialize snapshot file when test context is available
    if (args[2].testContext?.currentTest?.name) {
      this.initializeSnapshotFile(args[2].testContext.currentTest.name);
    }
  }

  private initializeSnapshotFile(testName: string): void {
    this.snapshotFile = join(this.snapshotDir, `${testName}.test.snapshot.jsonl`);
    // Only set up recording if snapshot doesn't exist
    this.shouldRecord = !existsSync(this.snapshotFile);
    
    if (this.shouldRecord) {
      // Create/clear the file only if we're going to record
      writeFileSync(this.snapshotFile!, '');
    }
  }

  async execute(input: ActionInput): Promise<ToolResult> {
    // Only record if we should and have a file
    if (this.shouldRecord && this.snapshotFile) {
      appendFileSync(this.snapshotFile, JSON.stringify(input) + '\n');
    }

    console.log(`\n🔍 Executing action: ${input.action}`, input);
    // Execute normally using parent class 
    return super.execute(input);
  }

  updateTestContext(newContext: TestContext): void {
    super.updateTestContext(newContext);
    
    // Initialize new snapshot file when test changes
    if (newContext?.currentTest?.name) {
      this.initializeSnapshotFile(newContext.currentTest.name);
    }
  }
} 
import pc from "picocolors";
import { FileResult, TestResult, TestStatus } from "@/core/runner/index";
import { AssertionError, TestFunction } from "@/types/test";
import { Log } from "@/log/index";
export class TestReporter {
  private currentFile: string = "";
  private testResults: Record<string, TestResult> = {};
  private startTime: number = Date.now();
  private currentTest: TestResult | null = null;
  private legacyOutputEnabled: boolean;
  private reporterLog: Log;

  // token pricing (Claude 3.5 Sonnet)
  private readonly COST_PER_1K_INPUT_TOKENS = 0.003;
  private readonly COST_PER_1K_OUTPUT_TOKENS = 0.015;

  private filesCount: number = 0;
  private testsCount: number = 0;
  private passedTestsCount: number = 0;
  private failedTestsCount: number = 0;
  private totalInputTokens: number = 0;
  private totalOutputTokens: number = 0;
  private aiCost: number = 0;

  constructor(legacyOutputEnabled: boolean) {
    this.legacyOutputEnabled = legacyOutputEnabled;
    this.reporterLog = getReporterLog();
  }

  onRunStart(filesCount: number) {
    this.filesCount = filesCount;
    // this.reporterLog.info(`Found ${filesCount} test file(s)`);
    if (this.legacyOutputEnabled) {
      console.log(`Found ${filesCount} test file(s)`);
    }
  }

  onFileStart(filePath: string, testsCount: number) {
    // this.reporterLog.setGroup(filePath);
    // this.reporterLog.info(`Running ${testsCount} test(s) in ${filePath}`);
    if (this.legacyOutputEnabled) {
      console.log("📄", pc.blue(pc.bold(filePath)), testsCount, "test(s)");
    }
  }

  onTestStart(test: TestFunction) {
    this.testsCount++;
    // this.reporterLog.setGroup(testName);
    // this.reporterLog.info(testName, {
    //   test: testName,
    //   status: "started",
    // });
    if (this.legacyOutputEnabled) {
      console.log(this.getStatusIcon("running"), test.name);
    }
  }

  onTestEnd(testResult: TestResult) {
    switch (testResult.status) {
      case "passed":
        this.passedTestsCount++;
        break;
      case "failed":
        this.failedTestsCount++;
        break;
    }
    let testAICost = 0;
    if (testResult.tokenUsage) {
      this.totalInputTokens += testResult.tokenUsage.input;
      this.totalOutputTokens += testResult.tokenUsage.output;
      testAICost = this.calculateCost(
        testResult.tokenUsage.input,
        testResult.tokenUsage.output,
      );
      this.aiCost += testAICost;
    }
    // this.reporterLog.info(
    //   `${testResult.status} (${testResult.reason}) - ${testAICost.toFixed(4)} USD`,
    // );
    // this.reporterLog.resetGroup();

    if (this.legacyOutputEnabled) {
      const symbol = testResult.status === "passed" ? "✓" : "✗";
      const color = testResult.status === "passed" ? pc.green : pc.red;
      console.log(`  ${color(`${symbol} ${testResult.status}`)}`);

      if (testResult.tokenUsage.input > 0 || testResult.tokenUsage.output > 0) {
        const totalTokens =
          testResult.tokenUsage.input + testResult.tokenUsage.output;
        const cost = this.calculateCost(
          testResult.tokenUsage.input,
          testResult.tokenUsage.output,
        );
        console.log(
          pc.dim(
            `    ↳ ${totalTokens.toLocaleString()} tokens ` +
              `(≈ $${cost.toFixed(2)})`,
          ),
        );
      }

      if (testResult.status === "failed") {
        this.reportError("Test Execution", testResult.reason);
      }
    }
  }

  onFileEnd(fileResult: FileResult) {
    if (fileResult.status === "failed") {
      console.error("Error processing file", fileResult.reason);
    }
    // this.reporterLog.resetGroup();
  }

  onRunEnd() {
    this.summary();
  }

  onFileEnd() {
    this.reporterLog.resetGroup();
  }

  onRunEnd() {
    this.summary();
  }

  // initializeTest(test: TestFunction, legacyOutputEnabled: boolean) {
  //   const testName = test.name || "Untitled";
  //   const testKey = `${this.currentFile}:${testName}`;

  //   this.reporterLog.setGroup(testName);
  //   this.currentTest = {
  //     name: testName,
  //     status: "pending",
  //   };
  //   this.testResults[testKey] = this.currentTest;
  //   this.legacyOutputEnabled = legacyOutputEnabled;
  // }

  // startFile(file: string) {
  //   this.currentFile = file;
  //   this.reporterLog.setGroup(file);
  //   this.reporterLog.info("📄 Starting", { file: this.currentFile });
  //   if (this.legacyOutputEnabled) {
  //     console.log("📄", pc.blue(pc.bold(this.currentFile)));
  //   }
  // }

  // startTest(test: TestFunction) {
  //   this.reporterLog.info(test.name ?? "Untitled", {
  //     test: test.name,
  //     status: "running",
  //   });
  //   if (this.legacyOutputEnabled) {
  //     console.log(this.getStatusIcon("running"), test.name);
  //   }
  // }

  // endTest(
  //   status: "passed" | "failed",
  //   reason: string,
  //   tokenUsage?: TokenMetrics,
  // ) {
  //   if (!this.currentTest) return;

  //   const testKey = `${this.currentFile}:${this.currentTest.name}`;
  //   this.testResults[testKey].status = status;
  //   this.testResults[testKey].error = error;
  //   this.testResults[testKey].tokenUsage = tokenUsage;

  //   const symbol = status === "passed" ? "✓" : "✗";
  //   const color = status === "passed" ? pc.green : pc.red;

  //   this.reporterLog.info(`${color(symbol)} Test ended`, {
  //     test: this.currentTest.name,
  //     status,
  //     error,
  //     tokenUsage,
  //   });
  //   if (error) {
  //     this.reporterLog.error(error.message, {
  //       error,
  //     });
  //   }
  //   if (tokenUsage) {
  //     this.reporterLog.info("Token usage", {
  //       input: tokenUsage.input,
  //       output: tokenUsage.output,
  //       costAmount: this.calculateCost(tokenUsage.input, tokenUsage.output),
  //       costCurrency: "USD",
  //     });
  //   }
  //   this.reporterLog.resetGroup();

  //   if (this.legacyOutputEnabled) {
  //     console.log(`  ${color(`${symbol} ${status}`)}`);

  //     if (tokenUsage) {
  //       const totalTokens = tokenUsage.input + tokenUsage.output;
  //       const cost = this.calculateCost(tokenUsage.input, tokenUsage.output);
  //       console.log(
  //         pc.dim(
  //           `    ↳ ${totalTokens.toLocaleString()} tokens ` +
  //             `(≈ $${cost.toFixed(2)})`,
  //         ),
  //       );
  //     }

  //     if (error) {
  //       this.reportError("Test Execution", error.message);
  //     }
  //   }
  //   this.currentTest = null;
  // }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * this.COST_PER_1K_INPUT_TOKENS;
    const outputCost = (outputTokens / 1000) * this.COST_PER_1K_OUTPUT_TOKENS;
    return Math.round((inputCost + outputCost) * 1000) / 1000;
  }

  private getStatusIcon(status: TestStatus): string {
    switch (status) {
      case "pending":
        return pc.yellow("○");
      case "running":
        return pc.blue("●");
      case "passed":
        return pc.green("✓");
      case "failed":
        return pc.red("✗");
    }
  }

  private summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const totalTokens = this.totalInputTokens + this.totalOutputTokens;
    const aiCost = this.calculateCost(
      this.totalInputTokens,
      this.totalOutputTokens,
    );

    // this.reporterLog.setGroup("Summary");
    // this.reporterLog.info("Total tests", { count: totalTests });
    // this.reporterLog.info("Passed tests", { count: passedTests });
    // this.reporterLog.info("Failed tests", { count: failedTests });
    // this.reporterLog.info("Started at", { timestamp: this.startTime });
    // this.reporterLog.info("Duration", { seconds: duration });

    // if (totalInputTokens > 0 || totalOutputTokens > 0) {
    //   this.reporterLog.info("Token usage", {
    //     input: totalInputTokens,
    //     output: totalOutputTokens,
    //     costAmount: aiCost.toFixed(4),
    //     costCurrency: "USD",
    //   });
    // }

    // if (this.failedTestsCount > 0) {
    //   // this.reporterLog.info("Failed tests");
    //   Object.entries(this.testResults)
    //     .filter(([, test]) => test.status === "failed")
    //     .forEach(([key, test]) => {
    //       this.reporterLog.info(pc.red(`  ${key}`));
    //       if (test.error) {
    //         this.reporterLog.error(test.error.message);
    //       }
    //     });
    // }
    // this.reporterLog.resetGroup();

    if (this.legacyOutputEnabled) {
      console.log(pc.dim("⎯".repeat(50)), "\n");

      const LABEL_WIDTH = 15;
      console.log(
        pc.bold(" Tests".padEnd(LABEL_WIDTH)),
        this.failedTestsCount
          ? `${pc.red(`${this.failedTestsCount} failed`)} | ${pc.green(`${this.passedTestsCount} passed`)}`
          : pc.green(`${this.passedTestsCount} passed`),
        pc.dim(`(${this.testsCount})`),
      );

      console.log(
        pc.bold(" Duration".padEnd(LABEL_WIDTH)),
        pc.dim(`${duration}s`),
      );
      console.log(
        pc.bold(" Started at".padEnd(LABEL_WIDTH)),
        pc.dim(new Date(this.startTime).toLocaleTimeString()),
      );
      console.log(
        pc.bold(" Tokens".padEnd(LABEL_WIDTH)),
        pc.dim(
          `${totalTokens.toLocaleString()} tokens ` +
            `(≈ $${aiCost.toFixed(2)})`,
        ),
      );
      console.log("\n", pc.dim("⎯".repeat(50)));
    }
  }

  // allTestsPassed(): boolean {
  //   return !Object.values(this.testResults).some(
  //     (test) => test.status === "failed",
  //   );
  // }

  allTestsPassed(): boolean {
    return this.testsCount === this.passedTestsCount;
  }

  error(context: string, message: string) {
    // this.reporterLog.error(message, { context });
    if (this.legacyOutputEnabled) {
      console.error(pc.red(`${context}: ${message}`));
    }
  }

  reportError(context: string, message: string) {
    // this.reporterLog.error(message, { context });
    if (this.legacyOutputEnabled) {
      console.error(pc.red(`${context}: ${message}`));
    }
  }

  reportAssertion(
    step: string,
    status: "passed" | "failed",
    error?: AssertionError,
  ): void {
    this.reporterLog.debug("Assertion", { step, status, error });
    if (this.legacyOutputEnabled) {
      if (status === "passed") {
        console.log(pc.green(`✓ ${step}`));
      } else {
        console.log(pc.red(`✗ ${step}`));
        if (error) {
          console.log(pc.dim(error.message));
        }
      }
    }
  }
}

let reporterLogInstance: Log | null = null;

export function getReporterLog(): Log {
  if (reporterLogInstance) {
    return reporterLogInstance;
  }
  reporterLogInstance = new Log({
    level: "info",
    format: "reporter",
  });
  return reporterLogInstance;
}

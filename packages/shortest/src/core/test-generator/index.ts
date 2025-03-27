import fs from "fs/promises";
import { createRequire } from "module";
import path from "path";
import * as t from "@babel/types";
import { TestPlan, TestPlanner } from "../test-planner";
import { DOT_SHORTEST_DIR_PATH } from "@/cache";
import { SHORTEST_NAME } from "@/cli/commands/shortest";
import { formatCode } from "@/core/test-generator/utils/format-code";
import { lintCode } from "@/core/test-generator/utils/lint-code";
import { getLogger } from "@/log";
import { getErrorDetails } from "@/utils/errors";

export const SHORTEST_DIR_NAME = "shortest";
export const SHORTEST_DIR_PATH = path.join(process.cwd(), SHORTEST_DIR_NAME);
const SHORTEST_EXPECT_NAME = "expect";

const require = createRequire(import.meta.url);
const generate = require("@babel/generator").default;

export class TestGenerator {
  private rootDir: string;
  private framework: string;
  private log = getLogger();

  private readonly outputPath: string;
  private readonly TEST_FILE_NAME = "functional.test.ts";
  private readonly frameworkDir: string;

  constructor(rootDir: string, framework: string) {
    this.rootDir = rootDir;
    this.framework = framework;
    this.frameworkDir = path.join(DOT_SHORTEST_DIR_PATH, this.framework);
    this.outputPath = path.join(SHORTEST_DIR_PATH, this.TEST_FILE_NAME);
  }

  public async execute(options: { force?: boolean } = {}): Promise<void> {
    this.log.trace("Generating tests...", { framework: this.framework });

    if (!options.force) {
      if (await this.testFileExists()) {
        this.log.trace("Test file already exists, skipping generation", {
          path: this.outputPath,
        });
        return;
      }
    }

    await this.generateTestFile();
  }

  private async testFileExists(): Promise<boolean> {
    try {
      await fs.access(this.outputPath);
      return true;
    } catch {
      return false;
    }
  }

  private async generateTestFile(): Promise<void> {
    const rawFileContent = await this.generateRawFileOutput();
    const formattedCode = await formatCode(rawFileContent, this.rootDir);
    const lintedCode = await lintCode(formattedCode, this.rootDir);

    try {
      await fs.mkdir(SHORTEST_DIR_PATH, { recursive: true });
      await fs.writeFile(this.outputPath, lintedCode);
      this.log.info("Test file generated successfully", {
        path: this.outputPath,
      });
    } catch (error) {
      this.log.error("Failed to write tests to file", getErrorDetails(error));
      throw error;
    }
  }

  private async generateRawFileOutput(): Promise<string> {
    const testPlans = await this.getTestPlans();

    const importStatement = t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier(SHORTEST_NAME),
          t.identifier(SHORTEST_NAME),
        ),
      ],
      t.stringLiteral("@antiwork/shortest"),
    );

    const testStatements = testPlans
      .map((plan) => {
        const statements: t.Statement[] = [];

        const shortestCall = t.callExpression(t.identifier(SHORTEST_NAME), [
          t.stringLiteral(plan.steps[0].statement),
        ]);

        const expectChain = plan.steps.slice(1).reduce((acc, step) => {
          const expectArgs: any[] = [t.stringLiteral(step.statement)];

          if (step.requiresAuth) {
            expectArgs.push(
              t.objectExpression([
                t.objectProperty(
                  t.identifier("email"),
                  t.memberExpression(
                    t.memberExpression(
                      t.identifier("process"),
                      t.identifier("env"),
                    ),
                    t.identifier("SHORTEST_EMAIL"),
                  ),
                ),
              ]),
            );
          }

          const expectCall = t.callExpression(
            t.memberExpression(acc, t.identifier(SHORTEST_EXPECT_NAME)),
            expectArgs,
          );
          return expectCall;
        }, shortestCall);

        statements.push(t.expressionStatement(expectChain));
        return statements;
      })
      .flat();

    const program = t.program([importStatement, ...testStatements]);

    return generate(program, {
      retainLines: true,
      compact: false,
    }).code;
  }

  private async getTestPlans(): Promise<TestPlan[]> {
    const testPlanJsonPath = path.join(
      this.frameworkDir,
      TestPlanner.TEST_PLAN_FILE_NAME,
    );
    const testPlanJson = await fs.readFile(testPlanJsonPath, "utf-8");
    return JSON.parse(testPlanJson).data.testPlans;
  }
}

#!/usr/bin/env node

import { execSync } from "child_process";
import { appendFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { detect, resolveCommand } from "package-manager-detector";
import pc from "picocolors";
import { getConfig } from "..";
import { GitHubTool } from "../browser/integrations/github";
import { TestRunner } from "../core/runner";

process.removeAllListeners("warning");
process.on("warning", (warning) => {
  if (
    warning.name === "DeprecationWarning" &&
    warning.message.includes("punycode")
  ) {
    return;
  }
  console.warn(warning);
});

const VALID_FLAGS = [
  "--headless",
  "--github-code",
  "--debug-ai",
  "--help",
  "--no-cache",
  "-h",
];
const VALID_PARAMS = ["--target", "--secret"];

function showHelp() {
  console.log(`
${pc.bold("Shortest")} - AI-powered end-to-end testing framework
${pc.dim("https://github.com/anti-work/shortest")}

${pc.bold("Usage:")}
  shortest [options] [test-pattern]

${pc.bold("Options:")}
  --headless          Run tests in headless browser mode
  --debug-ai          Show AI conversation and decision process
  --target=<url>      Set target URL for tests (default: http://localhost:3000)
  --github-code       Generate GitHub 2FA code for authentication
  --no-cache          Disable caching (storing browser actions between tests)

${pc.bold("Authentication:")}
  --secret=<key>      GitHub TOTP secret key (or use .env.local)

${pc.bold("Examples:")}
  ${pc.dim("# Run all tests")}
  shortest

  ${pc.dim("# Run specific test file")}
  shortest login.test.ts

  ${pc.dim("# Run tests in headless mode")}
  shortest --headless

  ${pc.dim("# Generate GitHub 2FA code")}
  shortest --github-code --secret=<OTP_SECRET>

${pc.bold("Environment Setup:")}
  Required variables in .env.local:
  - ANTHROPIC_API_KEY     Required for AI test execution
  - GITHUB_TOTP_SECRET    Required for GitHub authentication
  - GITHUB_USERNAME       GitHub login credentials
  - GITHUB_PASSWORD       GitHub login credentials

${pc.bold("Documentation:")}
  Visit ${pc.cyan(
    "https://github.com/anti-work/shortest",
  )} for detailed setup and usage
`);
}

async function handleGitHubCode(args: string[]) {
  try {
    const secret = args
      .find((arg) => arg.startsWith("--secret="))
      ?.split("=")[1];
    const github = new GitHubTool(secret);
    const { code, timeRemaining } = github.generateTOTPCode();

    console.log("\n" + pc.bgCyan(pc.black(" GitHub 2FA Code ")));
    console.log(pc.cyan("Code: ") + pc.bold(code));
    console.log(pc.cyan("Expires in: ") + pc.bold(`${timeRemaining}s`));
    console.log(
      pc.dim(`Using secret from: ${secret ? "CLI flag" : ".env file"}\n`),
    );

    process.exit(0);
  } catch (error) {
    console.error(pc.red("\n✖ Error:"), (error as Error).message, "\n");
    process.exit(1);
  }
}

function isValidArg(arg: string): boolean {
  // Check if it's a flag
  if (VALID_FLAGS.includes(arg)) {
    return true;
  }

  // Check if it's a parameter with value
  const paramName = arg.split("=")[0];
  if (VALID_PARAMS.includes(paramName)) {
    return true;
  }

  return false;
}

export function detectProjectType(): "typescript" | "javascript" {
  return existsSync("tsconfig.json") ? "typescript" : "javascript";
}

export function getConfigTemplate(
  projectType: "typescript" | "javascript",
): string {
  if (projectType === "typescript") {
    return `import type { ShortestConfig } from "@antiwork/shortest";

export default {
  headless: false,
  baseUrl: "http://localhost:3000",
  testPattern: "**/*.test.ts",
  anthropicKey: process.env.ANTHROPIC_API_KEY,
} satisfies ShortestConfig;
`;
  } else {
    return `/** @type {import('@antiwork/shortest').ShortestConfig} */
module.exports = {
  headless: false,
  baseUrl: "http://localhost:3000",
  testPattern: "**/*.test.js",
  anthropicKey: process.env.ANTHROPIC_API_KEY,
};
`;
  }
}

export function getEnvTemplate(): string {
  return `# Shortest Environment Variables
ANTHROPIC_API_KEY=

# Optional Configuration
# MAILOSAUR_API_KEY=
# MAILOSAUR_SERVER_ID=
`;
}

export const getShortestInstallationCommand = async () => {
  const packageManager = await detect();

  if (!packageManager) {
    throw new Error("No package manager detected");
  }

  const command = resolveCommand(packageManager.agent, "install", [
    "@antiwork/shortest",
    "--save-dev",
  ]);

  if (!command) {
    throw new Error("Failed to resolve installation command");
  }

  return `${command.command} ${command.args.join(" ")}`;
};

async function initCommand() {
  console.log(pc.blue("Setting up Shortest..."));

  const projectType = detectProjectType();
  try {
    if (
      !existsSync(join(process.cwd(), "node_modules", "@antiwork/shortest"))
    ) {
      console.log("Installing @antiwork/shortest...");
      const installCmd = await getShortestInstallationCommand();

      execSync(installCmd, { stdio: "inherit" });
      console.log(pc.green("✔ Dependencies installed"));
    }

    const configPath = join(process.cwd(), "shortest.config.ts");
    writeFileSync(configPath, getConfigTemplate(projectType));
    console.log(pc.green("✔ Configuration file created"));

    const gitignorePath = join(process.cwd(), ".gitignore");

    if (!existsSync(gitignorePath)) {
      writeFileSync(gitignorePath, ".shortest/\n");
      console.log(pc.green("✔ .gitignore file created"));
    } else {
      appendFileSync(gitignorePath, "\n.shortest/\n");
      console.log(pc.green("✔ .gitignore file updated"));
    }

    const envPath = join(process.cwd(), ".env.local");
    if (!existsSync(envPath)) {
      writeFileSync(envPath, getEnvTemplate());
      console.log(pc.green("✔ Environment file created"));
    } else {
      appendFileSync(envPath, getEnvTemplate());
      console.log(pc.green("✔ Environment file updated"));
    }

    console.log(pc.green("\nInitialization complete! Next steps:"));
    console.log("1. Add your ANTHROPIC_API_KEY to .env.local");
    console.log("2. Create your first test file: my-test.test.ts");
    console.log("3. Run tests with: shortest my-test.test.ts");
  } catch (error) {
    console.error(pc.red("Initialization failed:"), error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "init") {
    await initCommand();
    process.exit(0);
  }

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  if (args.includes("--github-code")) {
    await handleGitHubCode(args);
  }

  const invalidFlags = args
    .filter((arg) => arg.startsWith("--"))
    .filter((arg) => !isValidArg(arg));

  if (invalidFlags.length > 0) {
    console.error(`Error: Invalid argument(s): ${invalidFlags.join(", ")}`);
    process.exit(1);
  }

  const headless = args.includes("--headless");
  const targetUrl = args
    .find((arg) => arg.startsWith("--target="))
    ?.split("=")[1];
  const cliTestPattern = args.find((arg) => !arg.startsWith("--"));
  const debugAI = args.includes("--debug-ai");
  const noCache = args.includes("--no-cache");

  try {
    const runner = new TestRunner(
      process.cwd(),
      true,
      headless,
      targetUrl,
      debugAI,
      noCache,
    );
    await runner.initialize();
    const config = getConfig();
    const testPattern = cliTestPattern || config.testPattern;
    await runner.runTests(testPattern);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Config")) {
        console.error(pc.red("\nConfiguration Error:"));
        console.error(pc.dim(error.message));
        console.error(
          pc.dim(
            "\nMake sure you have a valid shortest.config.ts with all required fields:",
          ),
        );
        console.error(pc.dim("  - headless: boolean"));
        console.error(pc.dim("  - baseUrl: string"));
        console.error(pc.dim("  - testPattern: string"));
        console.error(pc.dim("  - anthropicKey: string"));
        console.error();
      } else {
        console.error(pc.red("\nError:"), error.message);
      }
    } else {
      console.error(pc.red("\nUnknown error occurred"));
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

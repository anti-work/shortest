#!/usr/bin/env node
import pc from "picocolors";
import { GitHubTool } from "@/browser/integrations/github";
import { ENV_LOCAL_FILENAME } from "@/constants";
import { TestRunner } from "@/core/runner";
import { getConfig } from "@/index";
import { LogLevel } from "@/log/config";
import { getLogger } from "@/log/index";

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
  "--debug-ai",
  "--github-code",
  "--headless",
  "--help",
  "--log-enabled",
  "--no-cache",
  "--no-legacy-output",
  "-h",
];
const VALID_PARAMS = ["--target", "--secret", "--log-level"];

const showHelp = () => {
  console.log(`
${pc.bold("Shortest")} - AI-powered end-to-end testing framework
${pc.dim("https://github.com/anti-work/shortest")}

${pc.bold("Usage:")}
  shortest [options] [test-pattern]

${pc.bold("Options:")}
  --headless            Run tests in headless browser mode
  --log-level=<level>   Set log level (default: silent). Options: silent, error, warn, info, debug, trace
  --target=<url>        Set target URL for tests (default: http://localhost:3000)
  --github-code         Generate GitHub 2FA code for authentication
  --no-cache           Disable caching (storing browser actions between tests)

${pc.bold("Authentication:")}
  --secret=<key>      GitHub TOTP secret key (or use ${ENV_LOCAL_FILENAME})

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
  Required variables in ${ENV_LOCAL_FILENAME}:
  - ANTHROPIC_API_KEY     Required for AI test execution
  - GITHUB_TOTP_SECRET    Required for GitHub authentication
  - GITHUB_USERNAME       GitHub login credentials
  - GITHUB_PASSWORD       GitHub login credentials

${pc.bold("Documentation:")}
  Visit ${pc.cyan(
    "https://github.com/anti-work/shortest",
  )} for detailed setup and usage
`);
};

const handleGitHubCode = async (args: string[]) => {
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
};

const isValidArg = (arg: string): boolean => {
  if (VALID_FLAGS.includes(arg)) {
    return true;
  }

  // Check if it's a parameter with value
  const paramName = arg.split("=")[0];
  if (VALID_PARAMS.includes(paramName)) {
    return true;
  }

  return false;
};

const getParamValue = (
  args: string[],
  paramName: string,
): string | undefined => {
  const param = args.find((arg) => arg.startsWith(paramName));
  if (param) {
    return param.split("=")[1];
  }
  return undefined;
};

const main = async () => {
  const args = process.argv.slice(2);
  const logLevel = getParamValue(args, "--log-level");
  const log = getLogger({
    level: logLevel as LogLevel,
  });

  const debugAI = args.includes("--debug-ai");
  if (debugAI) {
    log.config.level = "debug";
    log.warn("--debug-ai is deprecated, use --log-level=debug instead");
  }

  log.trace("Starting Shortest CLI", { args: process.argv });
  log.trace("Log config", { ...log.config });

  if (args[0] === "init") {
    await require("./init").default();
    process.exit(0);
  }

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  if (args.includes("--github-code")) {
    log.trace("Handling GitHub code argument");
    await handleGitHubCode(args);
  }

  const invalidFlags = args
    .filter((arg) => arg.startsWith("--"))
    .filter((arg) => !isValidArg(arg));

  if (invalidFlags.length > 0) {
    console.error("Invalid argument(s)", { invalidFlags });
    process.exit(1);
  }

  const headless = args.includes("--headless");
  const targetUrl = args
    .find((arg) => arg.startsWith("--target="))
    ?.split("=")[1];
  const cliTestPattern = args.find((arg) => !arg.startsWith("--"));
  const noCache = args.includes("--no-cache");

  log.trace("Initializing TestRunner");
  try {
    const runner = new TestRunner(
      process.cwd(),
      true,
      headless,
      targetUrl,
      noCache,
    );
    await runner.initialize();
    const config = getConfig();
    const testPattern = cliTestPattern || config.testPattern;
    await runner.runTests(testPattern);
  } catch (error: any) {
    console.error(pc.red(error.name), error.message);
    process.exit(1);
  }
};

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});

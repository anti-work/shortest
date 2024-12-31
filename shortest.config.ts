import type { ShortestConfig } from "@antiwork/shortest";

export default {
  headless: false,
  baseUrl: "http://localhost:3000",
  testDir: ["app/__tests__", "examples"],
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  mailosaur: {
    apiKey: process.env.MAILOSAUR_API_KEY,
    serverId: process.env.MAILOSAUR_SERVER_ID,
  },
} satisfies ShortestConfig;

import type { ShortestConfig } from '@antiwork/shortest';

export default {
  headless: true,
  baseUrl: 'http://localhost:3000',
  testDir: 'app/__tests__',
  anthropicKey: process.env.ANTHROPIC_API_KEY
} satisfies ShortestConfig; 
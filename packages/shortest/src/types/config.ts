import { BrowserConfig } from './browser';
import { AIConfig } from './ai';

export interface ShortestConfig {
  headless: boolean;
  baseUrl: string;
  testDir: string | string[];
  anthropicKey: string;
}
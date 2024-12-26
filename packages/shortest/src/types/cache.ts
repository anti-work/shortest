import { BrowserAction, ActionInput } from './browser';

export interface CacheAction {
  type: 'tool_use' | 'text';
  name: BrowserAction;
  input: ActionInput;
}

export interface CacheStep {
  reasoning: string; // WHY I DID
  action: CacheAction | null; // WHAT I DID
  timestamp: number; // WHEN I DID
  extras?: any;
}

export interface CacheEntry {
  data: {
    steps?: CacheStep[];
  };
  timestamp: number;
}

export interface CacheStore {
  [key: string]: CacheEntry | undefined;
}

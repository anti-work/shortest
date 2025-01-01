export interface BaseConfig {
  baseUrl?: string
  headless?: boolean
  timeout?: number
  retries?: number
}

export interface ShortestConfig extends BaseConfig {
  platform?: 'ios' | 'android' | 'web'
  capabilities?: {
    platformName?: 'iOS' | 'Android'
    platformVersion?: string
    deviceName?: string
    app?: string
    automationName?: string
    noReset?: boolean
    fullReset?: boolean
    [key: string]: any
  }
  baseUrl: string
  headless: boolean
  testDir: string | string[];
  anthropicKey: string;
  mailosaur?: {
    apiKey: string;
    serverId: string;
  };
}
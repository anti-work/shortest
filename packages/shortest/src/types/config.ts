export interface ShortestConfig {
  headless: boolean;
  baseUrl: string;
  testPattern: string;
  anthropicKey?: string;
  useBedrock?: boolean;
  awsAccessKey?: string;
  awsSecretKey?: string;
  awsRegion?: string;
  mailosaur?: {
    apiKey?: string;
    serverId?: string;
  };
}

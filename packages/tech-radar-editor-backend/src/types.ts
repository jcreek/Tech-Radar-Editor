import { LoggerService, RootConfigService } from '@backstage/backend-plugin-api';

export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
}

export interface AzureCredentials {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

export interface AzureDevOpsTarget {
  organization: string;
  project: string;
  repository: string;
  filePath: string;
  targetBranch: string;
}

import { RootConfigService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { RouterOptions, AzureCredentials, AzureDevOpsTarget } from './types';

function getAzureCredentials(config: RootConfigService): AzureCredentials {
  const integrations = config.getConfigArray('integrations.azure');
  const azureIntegration = integrations[0];
  const credentials = azureIntegration.getConfigArray('credentials');
  const cred = credentials[0];

  return {
    clientId: cred.getString('clientId'),
    clientSecret: cred.getString('clientSecret'),
    tenantId: cred.getString('tenantId'),
  };
}

function getTarget(config: RootConfigService): AzureDevOpsTarget {
  return {
    organization: config.getString('techRadarEditor.organization'),
    project: config.getString('techRadarEditor.project'),
    repository: config.getString('techRadarEditor.repository'),
    filePath: config.getOptionalString('techRadarEditor.filePath') ?? '/tech-radar.json',
    targetBranch: config.getOptionalString('techRadarEditor.targetBranch') ?? 'main',
  };
}

async function getAzureToken(credentials: AzureCredentials): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    scope: '499b84ac-1321-427f-aa17-267ca6975798/.default',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get Azure token: ${response.status} ${text}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

async function azureDevOpsApi(
  token: string,
  url: string,
  options?: { method?: string; body?: unknown },
): Promise<unknown> {
  const response = await fetch(url, {
    method: options?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Azure DevOps API error: ${response.status} ${text}`);
  }

  return response.json();
}

export async function createRouter(options: RouterOptions): Promise<express.Router> {
  const { logger, config } = options;
  const router = Router();
  router.use(express.json({ limit: '1mb' }));

  const credentials = getAzureCredentials(config);
  const target = getTarget(config);

  // Proxy endpoint for the web component to fetch tech radar data without auth
  router.get('/data', async (_req, res) => {
    try {
      const token = await getAzureToken(credentials);
      const apiUrl =
        `https://dev.azure.com/${target.organization}/${target.project}` +
        `/_apis/git/repositories/${target.repository}/items` +
        `?path=${encodeURIComponent(target.filePath)}` +
        `&versionDescriptor.version=${target.targetBranch}` +
        `&versionDescriptor.versionType=branch` +
        `&api-version=7.1`;

      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text();
        logger.error(`Failed to fetch tech radar data: ${response.status} ${text}`);
        res.status(502).json({ message: 'Failed to fetch tech radar data' });
        return;
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      logger.error(`Error fetching tech radar data: ${error}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Save endpoint: creates a branch and PR with the updated tech radar JSON
  router.post('/save', async (req, res) => {
    const { data, title, description, userToken } = req.body as {
      data: string;
      title?: string;
      description?: string;
      userToken?: string;
    };

    if (!data) {
      res.status(400).json({ message: 'Missing "data" field in request body' });
      return;
    }

    // Validate JSON
    try {
      JSON.parse(data);
    } catch {
      res.status(400).json({ message: 'Invalid JSON data' });
      return;
    }

    try {
      // Use the user's token if provided (PR will be authored as the user),
      // otherwise fall back to the service principal token.
      const token = userToken || await getAzureToken(credentials);
      const baseApiUrl =
        `https://dev.azure.com/${target.organization}/${target.project}` +
        `/_apis/git/repositories/${target.repository}`;

      // 1. Get the latest commit SHA on the target branch
      const refsResult = await azureDevOpsApi(
        token,
        `${baseApiUrl}/refs?filter=heads/${target.targetBranch}&api-version=7.1`,
      ) as { value: Array<{ objectId: string }> };

      if (!refsResult.value?.length) {
        res.status(500).json({ message: `Branch '${target.targetBranch}' not found` });
        return;
      }

      const mainBranchCommitId = refsResult.value[0].objectId;
      const branchName = `tech-radar-update-${Date.now()}`;

      // 2. Create a new branch from the target branch HEAD
      await azureDevOpsApi(
        token,
        `${baseApiUrl}/refs?api-version=7.1`,
        {
          method: 'POST',
          body: [
            {
              name: `refs/heads/${branchName}`,
              oldObjectId: '0000000000000000000000000000000000000000',
              newObjectId: mainBranchCommitId,
            },
          ],
        },
      );

      // 3. Push a commit to the new branch with the updated file
      await azureDevOpsApi(
        token,
        `${baseApiUrl}/pushes?api-version=7.1`,
        {
          method: 'POST',
          body: {
            refUpdates: [
              {
                name: `refs/heads/${branchName}`,
                oldObjectId: mainBranchCommitId,
              },
            ],
            commits: [
              {
                comment: title ?? 'Update tech radar data',
                changes: [
                  {
                    changeType: 'edit',
                    item: { path: target.filePath },
                    newContent: {
                      content: data,
                      contentType: 'rawtext',
                    },
                  },
                ],
              },
            ],
          },
        },
      );

      logger.info(`Created branch '${branchName}' with updated tech radar data`);

      // 4. Create a pull request
      const prResult = await azureDevOpsApi(
        token,
        `${baseApiUrl}/pullrequests?api-version=7.1`,
        {
          method: 'POST',
          body: {
            sourceRefName: `refs/heads/${branchName}`,
            targetRefName: `refs/heads/${target.targetBranch}`,
            title: title ?? 'Update tech radar data',
            description:
              description ??
              'This PR was created from the Tech Radar Editor in Backstage.',
          },
        },
      ) as { pullRequestId: number; url: string };

      const prUrl =
        `https://dev.azure.com/${target.organization}/${target.project}` +
        `/_git/${target.repository}/pullrequest/${prResult.pullRequestId}`;

      logger.info(`Created PR #${prResult.pullRequestId}: ${prUrl}`);

      res.json({
        pullRequestId: prResult.pullRequestId,
        pullRequestUrl: prUrl,
      });
    } catch (error) {
      logger.error(`Error creating tech radar PR: ${error}`);
      res.status(500).json({ message: `Failed to create PR: ${error}` });
    }
  });

  return router;
}

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN || 'default_token',
});

const REPO_OWNER = process.env.GITHUB_OWNER || 'operatorgpt';
const REPO_NAME = process.env.GITHUB_REPO || 'agents';

export interface GitHubCommitResult {
  commitSha: string;
  url: string;
}

export async function pushAgentToGitHub(
  agentName: string,
  code: string,
  blueprint: string
): Promise<GitHubCommitResult> {
  try {
    // Create or update agent file
    const agentPath = `agents/${agentName}.py`;
    const blueprintPath = `blueprints/v1-${agentName}.md`;

    // Get current file SHA if it exists (for updates)
    let agentSha: string | undefined;
    let blueprintSha: string | undefined;

    try {
      const agentFile = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: agentPath,
      });
      if ('sha' in agentFile.data) {
        agentSha = agentFile.data.sha;
      }
    } catch (error) {
      // File doesn't exist, that's fine for new agents
    }

    try {
      const blueprintFile = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: blueprintPath,
      });
      if ('sha' in blueprintFile.data) {
        blueprintSha = blueprintFile.data.sha;
      }
    } catch (error) {
      // File doesn't exist, that's fine for new blueprints
    }

    // Create commits for both files
    const agentCommit = await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: agentPath,
      message: `Add/Update agent: ${agentName}`,
      content: Buffer.from(code).toString('base64'),
      sha: agentSha,
    });

    const blueprintCommit = await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: blueprintPath,
      message: `Add blueprint for agent: ${agentName}`,
      content: Buffer.from(blueprint).toString('base64'),
      sha: blueprintSha,
    });

    return {
      commitSha: agentCommit.data.commit.sha,
      url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/commit/${agentCommit.data.commit.sha}`,
    };
  } catch (error) {
    console.error('GitHub push error:', error);
    throw new Error(`Failed to push to GitHub: ${error.message}`);
  }
}

export async function createGitHubRepository(): Promise<void> {
  try {
    await octokit.rest.repos.createForAuthenticatedUser({
      name: REPO_NAME,
      description: 'OperatorGPT Autonomous Agents Repository',
      private: false,
      auto_init: true,
    });

    // Create initial directory structure
    const initialFiles = [
      { path: 'agents/README.md', content: '# Agents\n\nThis directory contains all generated agents.' },
      { path: 'blueprints/README.md', content: '# Blueprints\n\nThis directory contains agent blueprints.' },
      { path: 'logs/README.md', content: '# Logs\n\nThis directory contains agent logs.' },
    ];

    for (const file of initialFiles) {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: file.path,
        message: `Initialize ${file.path}`,
        content: Buffer.from(file.content).toString('base64'),
      });
    }
  } catch (error) {
    if (error.status !== 422) { // Repository already exists
      throw error;
    }
  }
}

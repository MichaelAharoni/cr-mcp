import dotenv from 'dotenv';

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_URL = process.env.GITHUB_API_URL || 'https://api.github.com';
const GITHUB_HEADERS = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'GitHub-PR-Comments-MCP-Server', // Adding required User-Agent header
};

// Define common constants
export const BRANCH_TYPES = {
  MASTER: 'master',
  MAIN: 'main',
};

// Default organization
export const DEFAULT_OWNER = 'Natural-Intelligence';

// Interface for branch details
export interface BranchDetails {
  name: string;
  sha: string;
  protected: boolean;
}

/**
 * Lists all repositories for Natural-Intelligence organization
 */
export async function listOrganizationRepos(): Promise<string[]> {
  try {
    console.log(`Listing repos for organization: ${DEFAULT_OWNER}`);
    console.log(`Using headers: ${JSON.stringify(GITHUB_HEADERS, null, 2)}`);

    const response = await fetch(`${GITHUB_API_URL}/orgs/${DEFAULT_OWNER}/repos`, {
      headers: GITHUB_HEADERS,
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error response: ${errorText}`);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos = (await response.json()) as { name: string }[];

    return repos.map((repo) => repo.name);
  } catch (error) {
    console.error('Error fetching organization repositories:', error);
    throw new Error(
      `Failed to fetch organization repositories: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch all branches for a repository
 */
export async function fetchRepoBranches(owner: string, repo: string): Promise<BranchDetails[]> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/branches`, {
      headers: GITHUB_HEADERS,
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error response: ${errorText}`);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const branches = (await response.json()) as { name: string; commit: { sha: string }; protected: boolean }[];

    return branches.map((branch) => ({
      name: branch.name,
      sha: branch.commit.sha,
      protected: branch.protected,
    }));
  } catch (error) {
    console.error('Error fetching repository branches:', error);
    throw new Error(`Failed to fetch repository branches: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch files affected by a pull request
 */
export async function fetchPullRequestFiles(owner: string, repo: string, pullNumber: number): Promise<string[]> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls/${pullNumber}/files`, {
      headers: GITHUB_HEADERS,
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error response: ${errorText}`);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const files = (await response.json()) as { filename: string }[];

    return files.map((file) => file.filename);
  } catch (error) {
    console.error('Error fetching pull request files:', error);
    throw new Error(`Failed to fetch pull request files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the full repository name (owner/repo)
 */
export function getFullRepoName(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

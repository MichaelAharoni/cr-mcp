import { GITHUB_API_URL, DEFAULT_OWNER, BRANCH_TYPES, getGitHubHeaders } from './constants/github.constants';
import { BranchDetails } from './types/github.types';

/**
 * Fetch all branches for a repository
 */
export async function fetchRepoBranches(owner: string, repo: string): Promise<BranchDetails[]> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/branches`, {
      headers: getGitHubHeaders(),
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
      headers: getGitHubHeaders(),
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

// Export constants for use elsewhere
export { DEFAULT_OWNER, BRANCH_TYPES };

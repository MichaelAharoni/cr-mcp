/**
 * GitHub API configuration
 */
// Token must be provided via CLI arguments
let githubToken = '';
export const GITHUB_API_URL = 'https://api.github.com';

// Import logger for debug messages
import { logger } from '../constants';

// Define the GitHub headers interface with index signature
interface GitHubHeaders {
  Authorization: string;
  Accept: string;
  'User-Agent': string;
  [key: string]: string; // Add index signature for string keys
}

// Function to get GitHub headers with the current token
export const getGitHubHeaders = (): GitHubHeaders => {
  logger.debug('Fetching GitHub headers with token');
  if (!githubToken) {
    throw new Error('GitHub API token is required. Please provide it using the --gh_api_key flag.');
  }

  return {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-PR-Comments-MCP-Server',
  };
};

/**
 * Default organization for GitHub API requests
 */
export const DEFAULT_OWNER = 'Natural-Intelligence';

/**
 * Constants for branch types
 */
export const BRANCH_TYPES = {
  MASTER: 'master',
  MAIN: 'main',
};

/**
 * Sets the GitHub token to be used for API requests
 * @param token The GitHub API token
 */
export function setGitHubToken(token: string): void {
  if (token) {
    githubToken = token;
    logger.info('GitHub API token has been set from CLI arguments');
  }
}

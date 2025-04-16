import { logger, MESSAGE_DICTIONARY } from './common.constants';

export const GITHUB_API_URL = 'https://api.github.com';

// Token and owner must be provided via CLI arguments
let githubToken = '';
let githubOwner = '';

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
    throw new Error(MESSAGE_DICTIONARY.MISSING_API_KEY);
  }

  return {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-PR-Comments-MCP-Server',
  };
};

/**
 * Getter for the GitHub owner (organization or user)
 * @returns The configured GitHub owner
 * @throws Error if owner is not set
 */
export function getGitHubOwner(): string {
  if (!githubOwner) {
    throw new Error(MESSAGE_DICTIONARY.MISSING_OWNER);
  }

  return githubOwner;
}

/**
 * Sets the GitHub token to be used for API requests
 * @param token The GitHub API token
 */
export function setGitHubToken(token: string): void {
  if (token) {
    githubToken = token;
    logger.info(MESSAGE_DICTIONARY.API_KEY_SET);
  } else {
    throw new Error(MESSAGE_DICTIONARY.MISSING_API_KEY);
  }
}

/**
 * Sets the GitHub owner (organization or user)
 * @param owner The GitHub owner
 */
export function setGitHubOwner(owner: string): void {
  if (owner) {
    githubOwner = owner;
    logger.info(MESSAGE_DICTIONARY.OWNER_SET);
  } else {
    throw new Error(MESSAGE_DICTIONARY.MISSING_OWNER);
  }
}

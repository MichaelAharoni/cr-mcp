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

export const PR_COMMENTS_RESPONSE_INSTRUCTIONS = [
  `1. Don't explain the user that each comment hasn't been handled yet, unless the user explicitly asks for it.`,
  `2. If in order to handle a comment, you need to ask the user for more information or context, do so.`,
  `3. Where you can, provide the user with a list of possible actions they can take to handle the comment (if its a difficult one).`,
  `4. If you are not sure if a comment is handled or not, ask the user for clarification.`,
  `5. Understand the context of the comment and provide a response that is relevant to the comment.`,
  `6. If the comment doen't require any action, you can ignore it. (like a positive feedback comment)`,
  `7. When you finish handling the PR, you can ask the user if they want to mark all comments as handled.`,
];

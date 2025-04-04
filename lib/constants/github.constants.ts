/**
 * GitHub API configuration
 */
// Token and owner must be provided via CLI arguments
let githubToken = '';
let githubOwner = '';
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
 * Getter for the GitHub owner (organization or user)
 * @returns The configured GitHub owner
 * @throws Error if owner is not set
 */
export function getGitHubOwner(): string {
  if (!githubOwner) {
    throw new Error('GitHub owner is required. Please provide it using the --gh_owner flag.');
  }

  return githubOwner;
}

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

<<<<<<< HEAD
/**
 * Sets the GitHub owner (organization or user) to be used for API requests
 * @param owner The GitHub owner (organization or user)
 */
export function setGitHubOwner(owner: string): void {
  if (owner) {
    githubOwner = owner;
    logger.info('GitHub owner has been set from CLI arguments');
  } else {
    throw new Error('GitHub owner cannot be empty');
  }
}

=======
>>>>>>> 6bb00ec (adding another tool)
export const PR_COMMENTS_RESPONSE_INSTRUCTIONS = [
  `1. Don't explain the user that each comment hasn't been handled yet, unless the user explicitly asks for it.`,
  `2. If in order to handle a comment, you need to ask the user for more information or context, do so.`,
  `3. Where you can, provide the user with a list of possible actions they can take to handle the comment (if its a difficult one).`,
  `4. If you are not sure if a comment is handled or not, ask the user for clarification.`,
  `5. Understand the context of the comment and provide a response that is relevant to the comment.`,
  `6. If the comment doen't require any action, you can ignore it. (like a positive feedback comment)`,
  `7. When you finish handling the PR, you can ask the user if they want to mark all comments as handled.`,
];
<<<<<<< HEAD

export const PR_REPLIES_RESPONSE_INSTRUCTIONS = [
  `1. Ask the user if he want's to commit and push the changes.`,
  `2. If the user wants to commit and push the changes, Suggest him a suitable commit message.`,
  `3. If the user doesn't want your suggestion, ask him to provide a commit message.`,
  `4. Use the user's GIT CLI to execute from the user commandline the add, commit and push changes as followed: A. ""git add ."" B. ""git commit -m "<commit message>"" C. ""git push""`,
  `5. If for some reason the push command fails, Analyze the error output and ask him to handle it.`,
];
=======
>>>>>>> 6bb00ec (adding another tool)

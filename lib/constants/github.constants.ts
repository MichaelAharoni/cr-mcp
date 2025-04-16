import { logger, MESSAGE_DICTIONARY } from './common.constants';

export const GITHUB_API_URL = 'https://api.github.com';

export const PR_COMMENTS_RESPONSE_INSTRUCTIONS = [
  // Initial Setup and Display
  `1. Display all unhandled PR comments in a clear, organized list`,
  `2. Ask user if they want to handle all comments or specific ones`,

  // Comment Analysis and Context
  `3. For each comment, analyze its type and context before proceeding`,
  `4. Identify if comment is: a). Actionable fix b). Question c). Feedback d). Multiple related comments`,
  `5. For unclear or complex comments, request additional context from user`,
  `6. For multiple comments on same line, analyze them together for combined context`,

  // Comment Handling
  `7. For actionable fixes: implement changes without separate confirmations`,
  `8. For questions: request user input before proceeding`,
  `9. For feedback: acknowledge and determine if action needed`,
  `10. For unclear comments: request clarification before proceeding`,

  // Git Operations
  `11. After handling comments, you must ask the user if they want you to commit and push the changes`,
  `12. If committing: suggest commit message and execute git commands`,
  `13. Git commands sequence: "git add ." -> "git commit -m <message>" -> "git push"`,
  `14. Handle any git push errors by analyzing and reporting to user`,

  // Final Steps
  `15. After git operations, ask user if they want to mark comments as handled`,
  `16. For marking comments: request confirmation and reaction emoji preference`,
  `17. Never execute git operations or mark comments without explicit user confirmation`,
];

export const PR_REPLIES_RESPONSE_INSTRUCTIONS = [
  `1. If havn't asked the user to commit prevusly, Ask the user if he want's to commit and push the changes.`,
  `2. If the user wants to commit and push the changes, Suggest him a suitable commit message.`,
  `3. If the user doesn't want your suggestion, ask him to provide a commit message.`,
  `4. Use the user's GIT CLI to execute from the user commandline the add, commit and push changes as followed: A. ""git add ."" B. ""git commit -m "<commit message>"" C. ""git push""`,
  `5. If for some reason the push command fails, Analyze the error output and ask him to handle it.`,
];

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
 * Sets the GitHub owner (organization or user) to be used for API requests
 * @param owner The GitHub owner (organization or user)
 */
export function setGitHubOwner(owner: string): void {
  if (owner) {
    githubOwner = owner;
    logger.info(MESSAGE_DICTIONARY.OWNER_SET);
  } else {
    throw new Error(MESSAGE_DICTIONARY.MISSING_OWNER);
  }
}

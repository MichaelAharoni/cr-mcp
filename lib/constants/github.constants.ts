import { logger, MESSAGE_DICTIONARY } from './common.constants';

export const GITHUB_API_URL = 'https://api.github.com';

export const PR_COMMENTS_RESPONSE_INSTRUCTIONS = [
  // Initial Setup and Display
  `1. Display all unhandled PR comments in a clear, organized list`,
  `2. Ask user if they want to handle all comments or specific ones`,

  // Comment Analysis and Context
  `3. For each comment, analyze its type and context before proceeding`,
  `4. Identify if comment is: a) Actionable fix b) Question c) Feedback d) Multiple related comments`,
  `5. For unclear or complex comments, request additional context from user`,
  `6. For multiple comments on same line, analyze them together for combined context`,
  `7. For each comment, outline a short plan (included examples: Required file changes, New files to create, Tests to add/modify, Dependencies to update, Impact analysis)`,

  // Code Move and Refactoring Instructions
  `8. When moving code between files: a). First identify all usages of the code being moved b). Update all import statements in files using the moved code c). Remove the original code only after all imports are updated d). Never leave unused imports in the original file`,
  `9. For code moves: a). Use semantic search to find all usages b). Verify each usage is properly updated c). Test the changes to ensure functionality is preserved`,
  `10. After moving code: a). Run the code to verify it works b). Check for any compilation errors c). Verify all imports are correct d). Remove any unused imports`,

  // Comment Handling
  `11. For actionable fixes: implement changes without separate confirmations`,
  `12. For questions: request user input before proceeding`,
  `13. For feedback: acknowledge and determine if action needed`,
  `14. For unclear comments: request clarification before proceeding`,
  `15. Design each solution end-to-end, considering: a) Code best practices b) Existing logic reuse c) Unused variable removal d) Import fixes e) Cross-file impact f) Error verification`,
  `16. Ensure solution maintains existing functionality while implementing fixes`,
  `17. Verify all changes for potential side effects and edge cases`,

  // Git Operations
  `18. After handling comments, you must ask the user if they want you to commit and push the changes`,
  `19. If committing: suggest commit message and execute git commands`,
  `20. Git commands sequence: "git add ." -> "git commit -m <message>" -> "git push"`,
  `21. Handle any git push errors by analyzing and reporting to user`,

  // Final Steps
  `22. After git operations, ask user if they want to mark comments as handled`,
  `23. For marking comments: request confirmation and reaction emoji preference`,
  `24. Never execute git operations or mark comments without explicit user confirmation`,
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

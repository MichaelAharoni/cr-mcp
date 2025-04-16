import { logger, MESSAGE_DICTIONARY } from './common.constants';

export const GITHUB_API_URL = 'https://api.github.com';

export const PR_COMMENTS_RESPONSE_INSTRUCTIONS = [
  `1. Show the user the PR comments that haven't been handled yet as a nice list before you start handling them.`,
  `2. Ask the user if he want's to handle all comments or just some of them.`,
  `2. Don't explain the user for each comment if it hasn't been handled or unhandled yet, unless the user explicitly asks for it.`,
  `3. If in order to handle a comment, you need to ask the user for more information or context, do so. (And either if the context seems to be missing or the comment is not clear or too complex, ask the user for more information before proceeding)`,
  `4. Where you can, provide the user with a list of possible actions they can take and wait for the user to choose one of them to handle the comment fixing (if its a difficult one).`,
  `5. If you are not sure if a comment is handled or not, ask the user for clarification.`,
  `6. Understand if the comment is a positive feedback, or a question back (like a question back to the user) in this case you will need to ask the user for more information before proceeding (maybe you will have to reply back based on the user response).`,
  `7. Understand the context of the comment and provide a response that is relevant to the comment.`,
  '8. In some cases, there is few comments for the same line, combine them and understand be the chaining if the comment needs to be handled or not.',
  `9. If the comment doen't require any action, you can ignore it. (like a positive feedback comment, some question that doesn't require any code changes, etc... (If questions does exists, make sure to tell the user that someone has asked a question back to them that not require any code changes and tell him to answer the question))`,
  `10. For comments that you can fix, fix them without asking the user for confirmation each one of them separately.`,
  `10. If havn't asked the user to commit prevusly, Ask the user if he want's to commit and push the changes.`,
  `11. If the user wants to commit and push the changes, Suggest him a suitable commit message.`,
  `12. Use the user's GIT CLI to execute from the user commandline the add, commit and push changes as followed: A. ""git add ."" B. ""git commit -m "<commit message>"" C. ""git push""`,
  `13. When you finish handling the PR, only after you asked the user to commit and push his changes`,
  `14. Afte all of that, wether the user want's to commit and push his changes or not, ask the user if they want to mark all comments as handled.`,
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

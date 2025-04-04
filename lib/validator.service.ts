import { MESSAGE_DICTIONARY } from './constants';
import { FixedComment, GitHubPullRequest } from './types/github.types';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { STATUS_CODES } from './constants/server.constants';

/**
 * Validator service for validating API inputs and request parameters
 */

/**
 * Validates required input for fix_pr_comments tool
 * @param repo Repository name
 * @param branch Branch name
 * @throws McpError if validation fails
 */
export function validateFixPrCommentsInput(repo: string, branch: string): void {
  if (!repo || !branch) {
    throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.MISSING_REQUIRED_PARAMS);
  }
}

/**
 * Validates required input for mark_comments_as_handled tool
 * @param repo Repository name
 * @param fixedComments Array of fixed comments
 * @throws McpError if validation fails
 */
export function validateMarkCommentsInput(repo: string, fixedComments: FixedComment[]): void {
  if (!repo) {
    throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.MISSING_REPO_PARAM);
  }

  if (!fixedComments || !Array.isArray(fixedComments) || fixedComments.length === 0) {
    throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.MISSING_INVALID_COMMENTS);
  }

  // Validate each fixed comment entry
  for (const comment of fixedComments) {
    if (typeof comment.fixedCommentId !== 'number') {
      throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.INVALID_COMMENT_ID);
    }
  }
}

/**
 * Validates pull request was found for a branch
 * @param pullRequest The pull request object or null
 * @param branchName Branch name to check
 * @throws Error if no pull request was found
 */
export function validatePullRequestExists(pullRequest: GitHubPullRequest | null, branchName: string): void {
  if (!pullRequest) {
    throw new Error(`${MESSAGE_DICTIONARY.NO_PR_FOR_BRANCH} ${branchName}`);
  }
}

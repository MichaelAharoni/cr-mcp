import { FixedComment, GitHubPullRequest } from '../types/github.types';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { MESSAGE_DICTIONARY, STATUS_CODES } from '../constants/server.constants';
import { logger } from '../constants/common.constants';

/**
 * Validator service for validating API inputs and request parameters
 */

/**
 * Validates repository name format and content
 * @param repo Repository name to validate
 * @throws McpError if validation fails
 */
export function validateRepo(repo: string): void {
  if (!repo) {
    throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.MISSING_REPO_PARAM);
  }

  // Check if repo contains only valid characters (alphanumeric, hyphen, underscore, forward slash)
  const validRepoRegex = /^[a-zA-Z0-9-_/]+$/;
  if (!validRepoRegex.test(repo)) {
    throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.INVALID_REPO_FORMAT);
  }

  // Check if repo is in the format owner/repo
  const parts = repo.split('/');
  if (parts.length > 2) {
    throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.INVALID_REPO_STRUCTURE);
  }
}

/**
 * Validates required input for fix_pr_comments tool
 * @param repo Repository name
 * @param branch Branch name
 * @throws McpError if validation fails
 */
export function validateFixPrCommentsInput(repo: string, branch: string): void {
  validateRepo(repo);

  if (!branch) {
    throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.MISSING_BRANCH_PARAM);
  }

  // Validate branch name format
  const validBranchRegex = /^[a-zA-Z0-9-_/]+$/;
  if (!validBranchRegex.test(branch)) {
    throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.INVALID_BRANCH_FORMAT);
  }
}

/**
 * Validates required input for mark_comments_as_handled tool
 * @param repo Repository name
 * @param fixedComments Array of fixed comments
 * @throws McpError if validation fails
 */
export function validateMarkCommentsInput(repo: string, fixedComments: FixedComment[]): void {
  logger.debug(
    `Validating mark comments input - repo: ${repo}, fixedComments type: ${typeof fixedComments}, isArray: ${Array.isArray(fixedComments)}`
  );

  validateRepo(repo);

  if (!fixedComments || !Array.isArray(fixedComments)) {
    logger.error(`Invalid fixedComments: ${JSON.stringify(fixedComments)}`);
    throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.MISSING_INVALID_COMMENTS);
  }

  if (fixedComments.length === 0) {
    throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.MISSING_INVALID_COMMENTS);
  }

  // Validate each fixed comment entry
  for (const comment of fixedComments) {
    logger.debug(`Validating comment: ${JSON.stringify(comment)}`);
    if (typeof comment.fixedCommentId !== 'number') {
      throw new McpError(
        STATUS_CODES.BAD_REQUEST,
        MESSAGE_DICTIONARY.INVALID_COMMENT_ID.replace('%s', String(comment.fixedCommentId))
      );
    }

    if (comment.fixedCommentId <= 0) {
      throw new McpError(
        STATUS_CODES.BAD_REQUEST,
        MESSAGE_DICTIONARY.INVALID_COMMENT_ID.replace('%s', String(comment.fixedCommentId))
      );
    }
  }
}

/**
 * Validates pull request was found for a branch
 * @param pullRequest The pull request object or null
 * @param branchName Branch name to check
 * @throws McpError if no pull request was found
 */
export function validatePullRequestExists(pullRequest: GitHubPullRequest | null, branchName: string): void {
  if (!pullRequest) {
    throw new McpError(
      STATUS_CODES.NOT_FOUND,
      `${MESSAGE_DICTIONARY.NO_PR_FOR_BRANCH} ${branchName}. Please ensure the branch exists and has an open pull request.`
    );
  }
}

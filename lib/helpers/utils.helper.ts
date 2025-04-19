import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { GITHUB_API_URL, getGitHubHeaders } from '../constants/github.constants';
import { logger, MESSAGE_DICTIONARY } from '../constants/common.constants';
import { GitHubComment, GitHubPullRequest, BranchDetails, MarkCommentsResponse } from '../types/github.types';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { STATUS_CODES } from '../constants/server.constants';

/**
 * Get appropriate error message based on HTTP status code
 */
function getGitHubErrorMessage(status: number, message: string): string {
  switch (status) {
    case STATUS_CODES.NOT_FOUND:
      return MESSAGE_DICTIONARY.GITHUB_NOT_FOUND;
    case STATUS_CODES.UNAUTHORIZED:
      return MESSAGE_DICTIONARY.GITHUB_UNAUTHORIZED;
    case STATUS_CODES.FORBIDDEN:
      return MESSAGE_DICTIONARY.GITHUB_FORBIDDEN;
    case STATUS_CODES.RATE_LIMIT:
      return MESSAGE_DICTIONARY.GITHUB_RATE_LIMIT;
    case STATUS_CODES.VALIDATION_FAILED:
      return MESSAGE_DICTIONARY.GITHUB_VALIDATION_FAILED.replace('%s', message);
    case STATUS_CODES.INTERNAL_SERVER_ERROR:
      return MESSAGE_DICTIONARY.GITHUB_SERVER_ERROR;
    default:
      return MESSAGE_DICTIONARY.API_ERROR.replace('%s', String(status)).replace('%s', message);
  }
}

/**
 * Makes a GitHub API request using axios
 */
export async function githubApiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  try {
    const url = `${GITHUB_API_URL}${path}`;
    logger.debug(`Making GitHub API request to: ${url}`);

    // Use dynamic headers to always get the current token
    const headers = {
      ...getGitHubHeaders(),
      ...(options.headers || {}),
    };

    const method = options.method || 'GET';
    const config: AxiosRequestConfig = {
      method,
      url,
      headers,
    };

    if (options.body) {
      config.data = options.body;
    }

    const response: AxiosResponse<T> = await axios(config);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || STATUS_CODES.INTERNAL_SERVER_ERROR;
      const statusText = error.response?.statusText || 'Unknown error';
      const errorData = error.response?.data || {};
      const errorMessage = errorData.message || statusText;

      logger.error(MESSAGE_DICTIONARY.API_ERROR.replace('%s', String(status)).replace('%s', statusText));
      logger.error(MESSAGE_DICTIONARY.ERROR_DETAILS.replace('%s', JSON.stringify(errorData)));

      const detailedMessage = getGitHubErrorMessage(status, errorMessage);
      throw new McpError(status, detailedMessage);
    }

    logger.error(
      MESSAGE_DICTIONARY.REQUEST_ERROR.replace('%s', path).replace(
        '%s',
        error instanceof Error ? error.message : String(error)
      )
    );
    throw new McpError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      MESSAGE_DICTIONARY.REQUEST_FAILED.replace('%s', error instanceof Error ? error.message : String(error))
    );
  }
}

/**
 * Extract pull request number from comment details
 * Returns the pull request number or undefined if not found
 */
export function extractPullNumberFromComment(comment: GitHubComment): number | undefined {
  if (comment?.pull_request_url) {
    const match = comment.pull_request_url.match(/\/pulls\/(\d+)$/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  return undefined;
}

/**
 * Transform GitHub API branch data into simplified BranchDetails
 */
export function transformBranchData(branches: { name: string; commit: { sha: string } }[]): BranchDetails[] {
  return branches.map((branch) => ({
    name: branch.name,
    commit: {
      sha: branch.commit.sha,
    },
  }));
}

/**
 * Extract filenames from pull request files response
 */
export function extractFilenames(files: { filename: string }[]): string[] {
  return files.map((file) => file.filename);
}

/**
 * Get the full repository name (owner/repo)
 */
export function getFullRepoName(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

/**
 * Format a reply for a handled comment
 */
export function formatHandledReply(fixSummary: string): string {
  return `${fixSummary} (By AI)`;
}

/**
 * Find pull request by branch name
 */
export function findPullRequestByBranch(
  pullRequests: GitHubPullRequest[],
  branchName: string
): GitHubPullRequest | null {
  const matchingPR = pullRequests.find((pr) => pr.head.ref === branchName);

  return matchingPR || null;
}

/**
 * Process results of marking comments as handled
 */
export function processHandledCommentResults(
  results: Array<{ commentId: number; success: boolean; message: string }>
): MarkCommentsResponse[] {
  return results.map((result) => ({
    commentId: result.commentId,
    success: result.success,
    message: result.message,
  }));
}

/**
 * Cleans repository name by removing owner part if present (owner/repo format)
 * @param repo Repository name that might be in owner/repo format
 * @returns Clean repository name
 */
export function cleanRepositoryName(repo: string): string {
  if (!repo) return '';

  // Check if repo is in the format "owner/repo"
  const parts = repo.trim().split('/');
  if (parts.length > 1) {
    // Return just the repo part
    return parts[parts.length - 1].trim();
  }

  // Return the trimmed repo name
  return repo.trim();
}

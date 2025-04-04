import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { GITHUB_API_URL, getGitHubHeaders, PR_REPLIES_RESPONSE_INSTRUCTIONS } from '../constants/github.constants';
import { logger, MESSAGE_DICTIONARY } from '../constants/common.constants';
import { GitHubComment, GitHubPullRequest, BranchDetails, MarkCommentsResponse } from '../types/github.types';

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
      logger.error(`${MESSAGE_DICTIONARY.API_ERROR} ${error.response?.status} ${error.response?.statusText}`);
      logger.error(`${MESSAGE_DICTIONARY.ERROR_DETAILS} ${JSON.stringify(error.response?.data || {})}`);
      throw new Error(`${MESSAGE_DICTIONARY.API_ERROR} ${error.response?.status} ${error.response?.statusText}`);
    }

    logger.error(`${MESSAGE_DICTIONARY.REQUEST_ERROR} ${path}:`, error);
    throw new Error(`${MESSAGE_DICTIONARY.REQUEST_FAILED} ${error instanceof Error ? error.message : String(error)}`);
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
export function transformBranchData(
  branches: { name: string; commit: { sha: string }; protected: boolean }[]
): BranchDetails[] {
  return branches.map((branch) => ({
    name: branch.name,
    sha: branch.commit.sha,
    protected: branch.protected,
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
  return `Done - ${fixSummary} (By AI)`;
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
): MarkCommentsResponse {
  const successful = results.filter((result) => result.success).length;
  const failed = results.length - successful;

  return {
    results,
    summary: {
      total: results.length,
      successful,
      failed,
    },
    stepsForward: PR_REPLIES_RESPONSE_INSTRUCTIONS,
  };
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

import { GitHubComment, GitHubPullRequest, GitHubReview } from './types/github.types';
import { githubApiRequest, extractPullNumberFromComment } from './helpers/utils.helper';

/**
 * Repository API endpoints
 */
export const GitHubRepository = {
  /**
   * Fetch repo branches from GitHub API
   */
  async fetchRepoBranches(
    owner: string,
    repo: string
  ): Promise<Array<{ name: string; commit: { sha: string }; protected: boolean }>> {
    const path = `/repos/${owner}/${repo}/branches`;

    return githubApiRequest(path);
  },

  /**
   * Fetch files affected by a pull request
   */
  async fetchPullRequestFiles(owner: string, repo: string, pullNumber: number): Promise<Array<{ filename: string }>> {
    const path = `/repos/${owner}/${repo}/pulls/${pullNumber}/files`;

    return githubApiRequest(path);
  },

  /**
   * Fetch detailed information about a comment
   */
  async fetchCommentDetails(owner: string, repo: string, commentId: number): Promise<GitHubComment> {
    const path = `/repos/${owner}/${repo}/pulls/comments/${commentId}`;

    return githubApiRequest<GitHubComment>(path);
  },

  /**
   * Reply to a pull request comment
   */
  async replyToComment(
    owner: string,
    repo: string,
    pullNumber: number,
    commentId: number,
    body: string
  ): Promise<unknown> {
    const path = `/repos/${owner}/${repo}/pulls/${pullNumber}/comments/${commentId}/replies`;

    return githubApiRequest(path, {
      method: 'POST',
      body: { body },
    });
  },

  /**
   * Add a reaction to a pull request comment
   */
  async addReactionToComment(owner: string, repo: string, commentId: number, reaction: string): Promise<unknown> {
    const path = `/repos/${owner}/${repo}/pulls/comments/${commentId}/reactions`;

    return githubApiRequest(path, {
      method: 'POST',
      body: { content: reaction },
      headers: {
        Accept: 'application/vnd.github.squirrel-girl-preview+json',
      },
    });
  },

  /**
   * Fetch all pull requests for a repository
   */
  async fetchPullRequests(owner: string, repo: string): Promise<GitHubPullRequest[]> {
    const path = `/repos/${owner}/${repo}/pulls?state=open`;

    return githubApiRequest(path);
  },

  /**
   * Fetch reviews for a pull request
   */
  async fetchPullRequestReviews(owner: string, repo: string, pullNumber: number): Promise<GitHubReview[]> {
    const path = `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`;

    return githubApiRequest(path);
  },

  /**
   * Fetch detailed information about a pull request
   */
  async fetchPullRequestDetails(owner: string, repo: string, pullNumber: number): Promise<GitHubPullRequest> {
    const path = `/repos/${owner}/${repo}/pulls/${pullNumber}`;

    return githubApiRequest(path);
  },

  /**
   * Fetch review comments from a pull request (comments on specific lines of code)
   */
  async fetchPrReviewComments(owner: string, repo: string, pullNumber: number): Promise<GitHubComment[]> {
    const path = `/repos/${owner}/${repo}/pulls/${pullNumber}/comments`;

    return githubApiRequest(path);
  },

  /**
   * Fetch general issue comments from a pull request
   */
  async fetchPrIssueComments(owner: string, repo: string, pullNumber: number): Promise<GitHubComment[]> {
    const path = `/repos/${owner}/${repo}/issues/${pullNumber}/comments`;

    return githubApiRequest(path);
  },

  /**
   * Extract pull request number from comment details
   * Returns the pull request number or undefined if not found
   */
  extractPullNumberFromComment,
};

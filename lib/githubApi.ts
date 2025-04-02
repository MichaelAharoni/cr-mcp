/**
 * GitHub API integration for fetching PR comments and related data
 */
import { GITHUB_API_URL, GITHUB_HEADERS } from './constants/github.constants';

import { GitHubComment, GitHubPullRequest, GitHubReview, FetchCommentsOptions } from './types/github.types';

/**
 * Makes a GitHub API request using fetch
 */
async function githubApiRequest<T>(path: string): Promise<T> {
  try {
    console.log(`Making GitHub API request to: ${GITHUB_API_URL}${path}`);
    console.log(`Using headers: ${JSON.stringify(GITHUB_HEADERS, null, 2)}`);

    const response = await fetch(`${GITHUB_API_URL}${path}`, {
      headers: GITHUB_HEADERS,
      method: 'GET', // Explicitly set the method
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error response: ${errorText}`);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Error in GitHub API request to ${path}:`, error);

    throw new Error(`GitHub API request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch all pull requests for a repository
 */
async function fetchPullRequests(options: FetchCommentsOptions): Promise<GitHubPullRequest[]> {
  const path = `/repos/${options.owner}/${options.repo}/pulls?state=open`;

  return await githubApiRequest<GitHubPullRequest[]>(path);
}

/**
 * Fetch reviews for a pull request
 */
async function fetchPullRequestReviews(owner: string, repo: string, pullNumber: number): Promise<GitHubReview[]> {
  const path = `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`;

  return await githubApiRequest<GitHubReview[]>(path);
}

/**
 * Determine which comments are resolved or outdated
 */
async function getResolvedAndOutdatedComments(
  owner: string,
  repo: string,
  pullNumber: number,
  comments: GitHubComment[]
): Promise<Map<number, boolean>> {
  try {
    // Get all reviews to check for resolved comments
    const reviews = await fetchPullRequestReviews(owner, repo, pullNumber);

    // Map to track which comments are handled (resolved or outdated)
    const handledComments = new Map<number, boolean>();

    // Check each comment
    for (const comment of comments) {
      // A comment is outdated if position is null but original_position has a value
      const isOutdated = comment.position === null && comment.original_position !== null;

      // Check if the comment is part of a review that was approved or changes requested
      let isResolved = false;
      if (comment.pull_request_review_id) {
        const associatedReview = reviews.find((review) => review.id === comment.pull_request_review_id);
        if (associatedReview && ['APPROVED', 'CHANGES_REQUESTED'].includes(associatedReview.state)) {
          isResolved = true;
        }
      }

      // Mark the comment as handled if it's either outdated or resolved
      handledComments.set(comment.id, isOutdated || isResolved);
    }

    return handledComments;
  } catch (error) {
    console.error('Error determining resolved/outdated comments:', error);

    // Return an empty map if there was an error
    return new Map<number, boolean>();
  }
}

/**
 * Fetch detailed information about a pull request
 */
async function fetchPullRequestDetails(owner: string, repo: string, pullNumber: number): Promise<GitHubPullRequest> {
  const path = `/repos/${owner}/${repo}/pulls/${pullNumber}`;

  return await githubApiRequest<GitHubPullRequest>(path);
}

/**
 * Find pull request number from branch name
 */
async function getPullNumberFromBranch(options: FetchCommentsOptions): Promise<number | null> {
  if (!options.branch) {
    throw new Error('Branch name is required');
  }

  const pullRequests = await fetchPullRequests(options);
  const matchingPR = pullRequests.find((pr) => pr.head.ref === options.branch);

  return matchingPR ? matchingPR.number : null;
}

/**
 * Fetch review comments from a pull request (comments on specific lines of code)
 */
async function fetchPrReviewComments(owner: string, repo: string, pullNumber: number): Promise<GitHubComment[]> {
  const path = `/repos/${owner}/${repo}/pulls/${pullNumber}/comments`;

  return await githubApiRequest<GitHubComment[]>(path);
}

/**
 * Fetch general issue comments from a pull request
 */
async function fetchPrIssueComments(owner: string, repo: string, pullNumber: number): Promise<GitHubComment[]> {
  const path = `/repos/${owner}/${repo}/issues/${pullNumber}/comments`;

  return await githubApiRequest<GitHubComment[]>(path);
}

/**
 * Fetch all comments from a pull request with handling status and author info
 */
export async function fetchPullRequestComments(options: FetchCommentsOptions): Promise<{
  comments: GitHubComment[];
  handledStatus: Map<number, boolean>;
  prAuthor: string;
}> {
  try {
    let pullNumber = options.pull_number;

    // If pull_number is not provided but branch is, find the PR number
    if (!pullNumber && options.branch) {
      const prNumber = await getPullNumberFromBranch(options);
      if (!prNumber) {
        throw new Error(`No open pull request found for branch: ${options.branch}`);
      }

      pullNumber = prNumber;
    }

    if (!pullNumber) {
      throw new Error('Pull request number is required');
    }

    // Fetch PR details to get the author
    const prDetails = await fetchPullRequestDetails(options.owner, options.repo, pullNumber);
    const prAuthor = prDetails.user.login;

    console.log(`Found PR author: ${prAuthor}`);

    // Get both types of comments
    const [reviewComments, issueComments] = await Promise.all([
      fetchPrReviewComments(options.owner, options.repo, pullNumber),
      fetchPrIssueComments(options.owner, options.repo, pullNumber),
    ]);

    // Combine both types of comments
    const allComments = [...reviewComments, ...issueComments];

    console.log(`Found ${allComments.length} comments for PR #${pullNumber}`);

    // Determine which comments are handled (resolved or outdated)
    const handledStatus = await getResolvedAndOutdatedComments(options.owner, options.repo, pullNumber, allComments);

    return {
      comments: allComments,
      handledStatus,
      prAuthor,
    };
  } catch (error) {
    console.error('Error fetching PR comments:', error);

    throw new Error(`Failed to fetch pull request comments: ${error instanceof Error ? error.message : String(error)}`);
  }
}

import { DEFAULT_OWNER, BRANCH_TYPES, PR_COMMENTS_RESPONSE_INSTRUCTIONS } from './constants/github.constants';
import {
  BranchDetails,
  GitHubComment,
  GitHubReview,
  GitHubPullRequest,
  FixedComment,
  MarkCommentsResponse,
} from './types/github.types';
import { logger } from './constants';
import { simplifyGitHubComments } from './comments.helper';
import { SimplifiedComment } from './types';
import { GitHubRepository } from './github.repository';

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
 * Determine which comments are resolved or outdated
 */
export function determineHandledComments(comments: GitHubComment[], reviews: GitHubReview[]): Map<number, boolean> {
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
  };
}

/**
 * Fetch pull request comments and review information
 */
export async function fetchPullRequestComments({
  owner,
  repo,
  branch,
}: {
  owner: string;
  repo: string;
  branch: string;
}): Promise<{
  comments: GitHubComment[];
  handledStatus: Map<number, boolean>;
  prAuthor: string;
}> {
  logger.info(`Fetching pull request comments for ${owner}/${repo}, branch: ${branch}`);

  // Step 1: Get all pull requests for the repository
  const pullRequests = await GitHubRepository.fetchPullRequests(owner, repo);

  // Step 2: Find the matching pull request for the branch
  const pullRequest = findPullRequestByBranch(pullRequests, branch);

  if (!pullRequest) {
    throw new Error(`No open pull request found for branch: ${branch}`);
  }

  const pullNumber = pullRequest.number;
  const prAuthor = pullRequest.user.login;

  logger.info(`Found pull request #${pullNumber} for branch ${branch}`);

  // Step 3: Fetch all comments from the pull request (both review comments and issue comments)
  const [reviewComments, issueComments, reviews] = await Promise.all([
    GitHubRepository.fetchPrReviewComments(owner, repo, pullNumber),
    GitHubRepository.fetchPrIssueComments(owner, repo, pullNumber),
    GitHubRepository.fetchPullRequestReviews(owner, repo, pullNumber),
  ]);

  // Step 4: Combine comments
  const allComments = [...reviewComments, ...issueComments];

  // Step 5: Determine which comments are resolved or outdated
  const handledStatus = determineHandledComments(allComments, reviews);

  return {
    comments: allComments,
    handledStatus,
    prAuthor,
  };
}

/**
 * Mark comments as handled
 */
export async function markCommentsAsHandled({
  owner,
  repo,
  fixedComments,
}: {
  owner: string;
  repo: string;
  fixedComments: FixedComment[];
}): Promise<Array<{ commentId: number; success: boolean; message: string }>> {
  logger.info(`Marking ${fixedComments.length} comments as handled in ${owner}/${repo}`);

  // Process each fixed comment
  const results = await Promise.all(
    fixedComments.map(async (comment) => {
      const { fixedCommentId, fixSummary, reaction = 'rocket' } = comment;

      try {
        // Step 1: Get the comment details to extract the pull request number
        const commentDetails = await GitHubRepository.fetchCommentDetails(owner, repo, fixedCommentId);

        // Step 2: Extract the pull request number from the comment details
        const pullNumber = GitHubRepository.extractPullNumberFromComment(commentDetails);

        if (!pullNumber) {
          return {
            commentId: fixedCommentId,
            success: false,
            message: `Failed to extract pull request number for comment #${fixedCommentId}`,
          };
        }

        // Step 3: Reply to the comment with pull number
        if (fixSummary?.length) {
          const replyBody = formatHandledReply(fixSummary);
          await GitHubRepository.replyToComment(owner, repo, pullNumber, fixedCommentId, replyBody);
        }

        // Step 4: Add a reaction to the comment
        await GitHubRepository.addReactionToComment(owner, repo, fixedCommentId, reaction);

        return {
          commentId: fixedCommentId,
          success: true,
          message: `Successfully marked comment #${fixedCommentId} as handled`,
        };
      } catch (error) {
        logger.error(`Error marking comment #${fixedCommentId} as handled:`, error);

        return {
          commentId: fixedCommentId,
          success: false,
          message: `Failed to mark comment #${fixedCommentId} as handled: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    })
  );

  return results;
}

/**
 * Get PR comments with status information
 * This is the main business logic function for the fix_pr_comments tool
 */
export async function getPullRequestComments(options: {
  repo: string;
  branch: string;
  explicitPrAuthor?: string;
}): Promise<{
  branch: string;
  comments: SimplifiedComment[];
  stepsForward: string[];
}> {
  const { repo, branch, explicitPrAuthor } = options;

  logger.info(`Fetching PR comments for ${DEFAULT_OWNER}/${repo}, branch: ${branch}`);

  // Fetch PR comments from GitHub with handling status and PR author information
  const {
    comments,
    handledStatus,
    prAuthor: detectedPrAuthor,
  } = await fetchPullRequestComments({
    repo,
    owner: DEFAULT_OWNER,
    branch,
  });

  // Use explicitly provided PR author if available, otherwise use the one detected from GitHub
  const prAuthor = explicitPrAuthor || detectedPrAuthor;
  logger.info(`Using PR author: ${prAuthor} (${explicitPrAuthor ? 'explicitly provided' : 'auto-detected'})`);

  // Transform the comments to the simplified structure with proper handling status
  const simplifiedComments = simplifyGitHubComments(comments, handledStatus, prAuthor);
  logger.info('Simplified comments:', simplifiedComments);

  return {
    branch: branch,
    comments: simplifiedComments,
    stepsForward: PR_COMMENTS_RESPONSE_INSTRUCTIONS,
  };
}

/**
 * Mark comments as handled and return processed results
 * This is the main business logic function for the mark_comments_as_handled tool
 */
export async function handleFixedComments(options: {
  repo: string;
  fixedComments: FixedComment[];
}): Promise<MarkCommentsResponse> {
  const { repo, fixedComments } = options;

  logger.info(`Marking ${fixedComments.length} comments as handled in ${DEFAULT_OWNER}/${repo}`);

  // Mark comments as handled using the repository function
  const results = await markCommentsAsHandled({
    owner: DEFAULT_OWNER,
    repo,
    fixedComments,
  });

  // Process and return the results
  return processHandledCommentResults(results);
}

/**
 * Fetches repository branches
 */
export async function fetchBranches(repo: string): Promise<BranchDetails[]> {
  logger.info(`Fetching branches for ${DEFAULT_OWNER}/${repo}`);

  const branches = await GitHubRepository.fetchRepoBranches(DEFAULT_OWNER, repo);

  return transformBranchData(branches);
}

/**
 * Fetches files affected by a pull request
 */
export async function fetchPullRequestFiles(repo: string, pullNumber: number): Promise<string[]> {
  logger.info(`Fetching files for PR #${pullNumber} in ${DEFAULT_OWNER}/${repo}`);

  const files = await GitHubRepository.fetchPullRequestFiles(DEFAULT_OWNER, repo, pullNumber);

  return extractFilenames(files);
}

// Export constants for use elsewhere
export { DEFAULT_OWNER, BRANCH_TYPES };

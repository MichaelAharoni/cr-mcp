import { getGitHubOwner } from './constants/github.constants';
import { PR_COMMENTS_RESPONSE_INSTRUCTIONS } from './constants/instructions.constants';
import { BranchDetails, GitHubComment, GitHubReview, FixedComment, MarkCommentsResponse } from './types/github.types';
import { logger, MESSAGE_DICTIONARY } from './constants/common.constants';
import { simplifyGitHubComments } from './helpers/comments.helper';
import { SimplifiedComment } from './types';
import { GitHubRepository } from './github.repository';
import { validatePullRequestExists } from './helpers/validator.helper';
import {
  cleanRepositoryName,
  transformBranchData,
  formatHandledReply,
  findPullRequestByBranch,
  processHandledCommentResults,
} from './helpers/utils.helper';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { STATUS_CODES } from './constants/server.constants';

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
}): Promise<{ comments: GitHubComment[]; handledStatus: Map<number, boolean>; prAuthor: string }> {
  try {
    logger.info(`Fetching pull request comments for ${owner}/${repo}, branch: ${branch}`);

    // Step 1: Get all pull requests for the repository
    const pullRequests = await GitHubRepository.fetchPullRequests(owner, repo);

    // Step 2: Find the matching pull request for the branch
    const pullRequest = findPullRequestByBranch(pullRequests, branch);

    // Validate that a pull request was found
    validatePullRequestExists(pullRequest, branch);

    // At this point, pullRequest is guaranteed not to be null because validatePullRequestExists would throw an error
    const pullNumber = pullRequest!.number;
    const prAuthor = pullRequest!.user.login;

    logger.info(MESSAGE_DICTIONARY.FOUND_PR_FOR_BRANCH.replace('%s', String(pullNumber)).replace('%s', branch));

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

    return { comments: allComments, handledStatus, prAuthor };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Failed to fetch pull request comments: ${error instanceof Error ? error.message : String(error)}`
    );
  }
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
}): Promise<Array<{ commentId: number; success: boolean; message: string; error?: string }>> {
  try {
    logger.info(
      MESSAGE_DICTIONARY.MARKING_COMMENTS_HANDLED.replace('%s', String(fixedComments.length))
        .replace('%s', owner)
        .replace('%s', repo)
    );

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
              message: MESSAGE_DICTIONARY.FAILED_EXTRACT_PR.replace('%s', String(fixedCommentId)),
              error: 'Could not extract pull request number from comment',
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
            message: MESSAGE_DICTIONARY.MARK_COMMENT_SUCCESS.replace('%s', String(fixedCommentId)),
          };
        } catch (error) {
          logger.error(MESSAGE_DICTIONARY.MARK_COMMENT_ERROR.replace('%s', String(fixedCommentId)), error);

          return {
            commentId: fixedCommentId,
            success: false,
            message: MESSAGE_DICTIONARY.FAILED_MARK_COMMENT.replace('%s', String(fixedCommentId)).replace(
              '%s',
              error instanceof Error ? error.message : String(error)
            ),
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    return results;
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      `Failed to mark comments as handled: ${error instanceof Error ? error.message : String(error)}`
    );
  }
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
  const { repo: rawRepo, branch, explicitPrAuthor } = options;

  // Clean repository name (remove owner if present)
  const repo = cleanRepositoryName(rawRepo);

  logger.info(
    MESSAGE_DICTIONARY.FETCHING_PR_COMMENTS.replace('%s', getGitHubOwner()).replace('%s', repo).replace('%s', branch)
  );

  // Fetch PR comments from GitHub with handling status and PR author information
  const {
    comments,
    handledStatus,
    prAuthor: detectedPrAuthor,
  } = await fetchPullRequestComments({ repo, owner: getGitHubOwner(), branch });

  // Use explicitly provided PR author if available, otherwise use the one detected from GitHub
  const prAuthor = explicitPrAuthor || detectedPrAuthor;
  logger.info(
    MESSAGE_DICTIONARY.USING_PR_AUTHOR.replace('%s', prAuthor).replace(
      '%s',
      explicitPrAuthor ? 'explicitly provided' : 'auto-detected'
    )
  );

  // Transform the comments to the simplified structure with proper handling status
  const simplifiedComments = simplifyGitHubComments(comments, handledStatus, prAuthor);
  logger.info('Simplified comments:', simplifiedComments);

  return { branch: branch, comments: simplifiedComments, stepsForward: PR_COMMENTS_RESPONSE_INSTRUCTIONS };
}

/**
 * Mark comments as handled and return processed results
 * This is the main business logic function for the mark_comments_as_handled tool
 */
export async function handleFixedComments(options: {
  repo: string;
  fixedComments: FixedComment[];
}): Promise<MarkCommentsResponse[]> {
  const { repo: rawRepo, fixedComments } = options;

  // Clean repository name (remove owner if present)
  const repo = cleanRepositoryName(rawRepo);

  logger.info(
    MESSAGE_DICTIONARY.MARKING_COMMENTS_HANDLED.replace('%s', String(fixedComments.length))
      .replace('%s', getGitHubOwner())
      .replace('%s', repo)
  );

  // Mark comments as handled using the repository function
  const results = await markCommentsAsHandled({ owner: getGitHubOwner(), repo, fixedComments });

  // Process and return the results
  return processHandledCommentResults(results);
}

/**
 * Fetches repository branches
 */
export async function fetchBranches(repo: string): Promise<BranchDetails[]> {
  // Clean repository name (remove owner if present)
  const cleanRepo = cleanRepositoryName(repo);

  logger.info(`Fetching branches for ${getGitHubOwner()}/${cleanRepo}`);

  const branches = await GitHubRepository.fetchRepoBranches(getGitHubOwner(), cleanRepo);

  return transformBranchData(branches);
}

/**
 * Fetches files affected by a pull request
 */
export function getFullRepoName(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

import { GitHubComment } from './types/github.types';
import { SimplifiedComment } from './types/comment.types';

/**
 * Groups comments by their endLine to determine which ones to keep
 */
function filterLastAuthorCommentsByEndLine(comments: SimplifiedComment[], prAuthor: string): SimplifiedComment[] {
  console.log(`Filtering comments for PR author: ${prAuthor}`);

  // First, identify comment threads (grouped by file path and line numbers)
  const commentThreads = new Map<string, SimplifiedComment[]>();

  // Group comments by file path + line number combination
  comments.forEach((comment) => {
    if (comment.startLine === null && comment.endLine === null) return;

    const key = `${comment.filePath}:${comment.startLine}:${comment.endLine}`;
    if (!commentThreads.has(key)) {
      commentThreads.set(key, []);
    }

    commentThreads.get(key)?.push(comment);
  });

  // Comments that will be kept in the final result
  const result: SimplifiedComment[] = [];

  // Process comments that don't have line numbers (general comments)
  const commentsWithoutLines = comments.filter((comment) => comment.startLine === null && comment.endLine === null);
  result.push(...commentsWithoutLines.filter((comment) => !comment.isHandled));

  // Process each thread to determine if it should be kept or filtered out
  for (const [key, thread] of commentThreads) {
    console.log(`Processing thread at ${key} with ${thread.length} comments`);

    // Sort comments by creation time (newest first)
    thread.sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());

    // Check if both author and reviewers participated in this thread
    const hasAuthorComment = thread.some((comment) => comment.fromUserName === prAuthor);
    const hasReviewerComment = thread.some((comment) => comment.fromUserName !== prAuthor);

    // Get the newest comment
    const newestComment = thread[0];

    // If both author and reviewers commented AND the author was the last to comment,
    // skip the entire thread (author is waiting for reviewer response)
    if (hasAuthorComment && hasReviewerComment && newestComment.fromUserName === prAuthor) {
      console.log(`Filtering out entire thread at ${key} - author ${prAuthor} is waiting for reviewer response`);
      continue; // Skip this entire thread
    }

    // Otherwise keep all unhandled comments in this thread
    const unhandledComments = thread.filter((comment) => !comment.isHandled);
    result.push(...unhandledComments);
  }

  console.log(`After filtering: ${result.length} comments remaining`);

  return result;
}

/**
 * Transforms GitHub API comments into a simplified structure for easier consumption
 * @param comments The GitHub comments to simplify
 * @param handledStatus Map of comment IDs to their handled status (resolved or outdated)
 * @param prAuthor The username of the PR author (for filtering)
 */
export function simplifyGitHubComments(
  comments: GitHubComment[],
  handledStatus: Map<number, boolean>,
  prAuthor?: string
): SimplifiedComment[] {
  const allComments = comments
    .filter((comment) => comment.path) // Only include comments that have a file path
    .map((comment, index) => {
      // The start line is either start_line, original_start_line, or line
      const startLine = comment.start_line || comment.original_start_line || comment.line || null;

      // The end line is either line or original_line
      const endLine = comment.line || comment.original_line || startLine || null;

      // Check if the comment is handled
      const isHandled = handledStatus.get(comment.id) || false;

      return {
        commentNumber: index + 1, // Start from 1
        filePath: comment.path || '',
        fromUserName: comment.user.login,
        commentMessage: comment.body,
        isHandled,
        startLine,
        endLine,
        creationTime: comment.created_at, // Add creation time
      };
    });

  // First filter out handled comments
  const unhandledComments = allComments.filter((comment) => !comment.isHandled);

  // If PR author is provided, filter comments that have the PR author as the last commenter for each endLine
  if (prAuthor) {
    return filterLastAuthorCommentsByEndLine(unhandledComments, prAuthor);
  }

  // Otherwise just return all unhandled comments
  return unhandledComments;
}

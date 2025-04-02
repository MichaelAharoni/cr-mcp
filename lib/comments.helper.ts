/**
 * Functions for processing and analyzing GitHub code review comments
 */
import { GitHubComment } from './types/github.types';

import { ProcessedComment, SimplifiedComment, SentimentType, PriorityLevel } from './types/comment.types';

import {
  REFACTORING_KEYWORDS,
  HIGH_PRIORITY_KEYWORDS,
  MEDIUM_PRIORITY_KEYWORDS,
  ACTION_PATTERNS,
  SENTIMENT_WORDS,
  REFACTORING_PATTERNS,
} from './constants/comment.constants';

/**
 * Extracts the code context from a diff hunk
 */
function extractCodeContext(diffHunk?: string): string | undefined {
  if (!diffHunk) return undefined;

  // Extract the actual code being commented on
  const lines = diffHunk.split('\n');
  // Get only the lines that are part of the code (not the diff metadata)
  const codeLine = lines
    .filter((line) => !line.startsWith('@@') && !line.startsWith('-'))
    .map((line) => (line.startsWith('+') ? line.substring(1) : line))
    .join('\n');

  return codeLine;
}

/**
 * Determines if a comment is requesting code refactoring
 */
function isRefactoringRequest(comment: string): boolean {
  const lowerComment = comment.toLowerCase();

  return REFACTORING_KEYWORDS.some((keyword) => lowerComment.includes(keyword));
}

/**
 * Determines the priority of a comment based on content
 */
function determinePriority(comment: string): PriorityLevel {
  const lowerComment = comment.toLowerCase();

  if (HIGH_PRIORITY_KEYWORDS.some((keyword) => lowerComment.includes(keyword))) {
    return 'high';
  } else if (MEDIUM_PRIORITY_KEYWORDS.some((keyword) => lowerComment.includes(keyword))) {
    return 'medium';
  }

  return 'low';
}

/**
 * Extract code blocks from markdown comments if present
 */
function extractCodeBlock(comment: string): string | undefined {
  const codeBlockRegex = /```(?:[\w]*)\s*([\s\S]*?)```/g;
  const matches = comment.match(codeBlockRegex);

  if (matches && matches.length > 0) {
    // Extract content inside code blocks
    return matches[0]
      .replace(/```(?:[\w]*)\s*/, '')
      .replace(/```$/, '')
      .trim();
  }

  return undefined;
}

/**
 * Analyze the sentiment of the comment
 */
function analyzeSentiment(comment: string): SentimentType {
  const lowerComment = comment.toLowerCase();

  const positiveCount = SENTIMENT_WORDS.positive.filter((word) => lowerComment.includes(word)).length;
  const negativeCount = SENTIMENT_WORDS.negative.filter((word) => lowerComment.includes(word)).length;

  if (positiveCount > negativeCount) {
    return 'positive';
  } else if (negativeCount > positiveCount) {
    return 'negative';
  }

  return 'neutral';
}

/**
 * Extract suggested action from the comment
 */
function extractSuggestedAction(comment: string): string | undefined {
  for (const pattern of ACTION_PATTERNS) {
    const match = comment.match(pattern);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }

  return undefined;
}

/**
 * Extract refactoring tags from a comment
 */
function extractRefactoringTags(comment: string): string[] {
  const tags: string[] = [];
  const lowerComment = comment.toLowerCase();

  // Check for each pattern
  Object.entries(REFACTORING_PATTERNS).forEach(([tag, keywords]) => {
    if (keywords.some((keyword) => lowerComment.includes(keyword))) {
      tags.push(tag);
    }
  });

  return tags;
}

/**
 * Process GitHub comments into a structured format for AI processing
 */
export function processCodeReviewComments(comments: GitHubComment[]): ProcessedComment[] {
  return comments.map((comment) => {
    // Determine if this is a review comment (on code) or a general PR comment
    const isReviewComment = !!comment.path;
    const codeSuggestion = extractCodeBlock(comment.body);
    const suggestedAction = extractSuggestedAction(comment.body);
    const refactoringTags = extractRefactoringTags(comment.body);
    const sentiment = analyzeSentiment(comment.body);

    return {
      id: comment.id,
      author: comment.user.login,
      comment: comment.body,
      file: comment.path,
      line: comment.line || undefined,
      codeContext: extractCodeContext(comment.diff_hunk),
      url: comment.html_url,
      timestamp: comment.created_at,
      type: isReviewComment ? 'review' : 'general',
      refactoringRequested: isRefactoringRequest(comment.body),
      priority: determinePriority(comment.body),
      codeBlockSuggestion: codeSuggestion,
      suggestedAction: suggestedAction,
      aiAnalysis: {
        sentiment: sentiment,
        codeSuggestion: !!codeSuggestion,
        refactoringTags: refactoringTags,
      },
    };
  });
}

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

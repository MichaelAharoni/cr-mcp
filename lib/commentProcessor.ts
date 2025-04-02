interface GitHubComment {
  id: number;
  user: {
    login: string;
  };
  body: string;
  created_at: string;
  updated_at: string;
  path?: string;
  position?: number | null;
  line?: number | null;
  commit_id?: string;
  diff_hunk?: string;
  html_url: string;
  // Adding missing properties that are coming from GitHub's API response
  start_line?: number | null;
  original_start_line?: number | null;
  original_line?: number | null;
  start_side?: string;
  side?: string;
  pull_request_review_id?: number;
}

export interface ProcessedComment {
  id: number;
  author: string;
  comment: string;
  file?: string;
  line?: number;
  codeContext?: string;
  url: string;
  timestamp: string;
  type: 'review' | 'general';
  refactoringRequested: boolean;
  priority: 'high' | 'medium' | 'low';
  suggestedAction?: string;
  codeBlockSuggestion?: string;
  aiAnalysis?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    codeSuggestion: boolean;
    refactoringTags: string[];
  };
}

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
  const refactoringKeywords = [
    'refactor',
    'clean up',
    'simplify',
    'optimize',
    'improve',
    'rewrite',
    'restructure',
    'better approach',
    'better way',
    'should be changed',
    'could be better',
    'needs improvement',
    'fix this',
    'update this',
    'change this',
  ];

  const lowerComment = comment.toLowerCase();

  return refactoringKeywords.some((keyword) => lowerComment.includes(keyword));
}

/**
 * Determines the priority of a comment based on content
 */
function determinePriority(comment: string): 'high' | 'medium' | 'low' {
  const highPriorityKeywords = [
    'critical',
    'urgent',
    'important',
    'security',
    'bug',
    'fix immediately',
    'vulnerability',
    'crash',
    'error',
    'must fix',
    'high priority',
  ];

  const mediumPriorityKeywords = [
    'should',
    'recommended',
    'consider',
    'might want to',
    'suggestion',
    'could improve',
    'better if',
    'would be nice',
  ];

  const lowerComment = comment.toLowerCase();

  if (highPriorityKeywords.some((keyword) => lowerComment.includes(keyword))) {
    return 'high';
  } else if (mediumPriorityKeywords.some((keyword) => lowerComment.includes(keyword))) {
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
function analyzeSentiment(comment: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['good', 'great', 'excellent', 'nice', 'well done', 'perfect', 'yes'];
  const negativeWords = ['bad', 'wrong', 'incorrect', 'error', 'mistake', 'fix', 'issue', 'bug', 'no'];

  const lowerComment = comment.toLowerCase();

  const positiveCount = positiveWords.filter((word) => lowerComment.includes(word)).length;
  const negativeCount = negativeWords.filter((word) => lowerComment.includes(word)).length;

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
  // Common patterns for suggested actions in code reviews
  const actionPatterns = [
    /should\s+(\w+)/i,
    /need\s+to\s+(\w+)/i,
    /must\s+(\w+)/i,
    /please\s+(\w+)/i,
    /consider\s+(\w+ing)/i,
    /try\s+(\w+ing)/i,
  ];

  for (const pattern of actionPatterns) {
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

  // Common refactoring patterns
  const patterns = {
    performance: ['slow', 'performance', 'optimize', 'faster', 'efficient'],
    security: ['security', 'vulnerability', 'secure', 'sanitize', 'protect'],
    readability: ['readable', 'clarity', 'clearer', 'understand', 'naming'],
    maintainability: ['maintain', 'complex', 'simplify', 'technical debt'],
    duplication: ['duplicate', 'redundant', 'repeat', 'reuse', 'dry'],
  };

  // Check for each pattern
  Object.entries(patterns).forEach(([tag, keywords]) => {
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
 * Simplified comment structure for easier consumption by the AI agent
 */
export interface SimplifiedComment {
  commentNumber: number;
  filePath: string;
  fromUserName: string;
  commentMessage: string;
  isHandled: boolean;
  startLine: number | null;
  endLine: number | null;
  creationTime: string; // Adding creation time
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

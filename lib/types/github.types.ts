/**
 * Options for fetching comments from GitHub
 */
export interface FetchCommentsOptions {
  owner: string;
  repo: string;
  pull_number?: number;
  branch?: string;
}

/**
 * GitHub Comment interface
 */
export interface GitHubComment {
  id: number;
  body: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  path?: string;
  position?: number | null;
  original_position?: number | null;
  pull_request_review_id?: number;
  line?: number | null;
  commit_id?: string;
  diff_hunk?: string;
  html_url: string;
  start_line?: number | null;
  original_start_line?: number | null;
  original_line?: number | null;
  start_side?: string;
  side?: string;
  pull_request_url: string;
}

/**
 * GitHub Pull Request interface
 */
export interface GitHubPullRequest {
  number: number;
  head: {
    ref: string; // branch name
  };
  user: {
    login: string; // PR author
  };
}

/**
 * GitHub Review interface
 */
export interface GitHubReview {
  id: number;
  user: {
    login: string;
  };
  state: string;
  submitted_at: string;
}

/**
 * Branch details interface
 */
export interface BranchDetails {
  name: string;
  commit: {
    sha: string;
  };
}

/**
 * Options for marking a comment as fixed/handled
 */
export interface FixedComment {
  /**
   * The ID of the GitHub comment that has been fixed
   */
  fixedCommentId: number;

  /**
   * A concise summary (3-15 words) describing how the comment was addressed
   * This will be added to the PR comment with "Done - " prefix
   */
  fixSummary?: string;

  /**
   * The reaction to add to the comment (optional)
   * Available reactions: +1, -1, laugh, confused, heart, hooray, rocket, eyes
   * Default: "rocket"
   */
  reaction?: string;
}

/**
 * Response from marking comments as handled
 */
export interface MarkCommentsResponse {
  commentId: number;
  success: boolean;
  message: string;
  error?: string;
}

export interface FetchPrCommentsOptions {
  owner: string;
  repo: string;
  branch: string;
}

export interface MarkCommentsOptions {
  owner: string;
  repo: string;
  fixedComments: FixedComment[];
}

export interface GetPrCommentsOptions {
  repo: string;
  branch: string;
  explicitPrAuthor?: string;
}

export interface HandleFixedCommentsOptions {
  repo: string;
  fixedComments: FixedComment[];
}

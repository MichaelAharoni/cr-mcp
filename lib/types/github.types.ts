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
  start_line?: number | null;
  original_start_line?: number | null;
  original_line?: number | null;
  start_side?: string;
  side?: string;
  pull_request_review_id?: number;
  original_position?: number | null;
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
  body: string;
  state: string; // "APPROVED", "COMMENTED", "CHANGES_REQUESTED", "DISMISSED", etc.
  submitted_at: string;
  commit_id: string;
  pull_request_url: string;
}

/**
 * Branch details interface
 */
export interface BranchDetails {
  name: string;
  sha: string;
  protected: boolean;
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
  fixSummary: string;

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
  /**
   * Results for each comment
   */
  results: {
    commentId: number;
    success: boolean;
    message: string;
  }[];

  /**
   * Summary of the operation
   */
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

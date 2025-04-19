/**
 * Server port configuration
 */
export const PORT = 3322;

/**
 * Error and info message dictionary
 */
export const MESSAGE_DICTIONARY = {
  SERVER_STARTED: 'GitHub PR Comments MCP Server started and ready for requests',
  FOUND_PR_FOR_BRANCH: 'Found pull request #%s for branch %s',
  FETCHING_PR_COMMENTS: 'Fetching PR comments for %s/%s, branch: %s',
  MARKING_COMMENTS_HANDLED: 'Marking %s comments as handled in %s/%s',
  MARK_COMMENT_ERROR: 'Error marking comment #%s as handled:',
  USING_PR_AUTHOR: 'Using PR author: %s (%s)',
  API_KEY_SET: 'GitHub API key has been set',
  OWNER_SET: 'GitHub owner has been set',

  // API Configuration messages
  MISSING_API_KEY: 'Error: GitHub API key is required. Please provide it using the --gh_api_key flag.',
  MISSING_OWNER: 'Error: GitHub owner is required. Please provide it using the --gh_owner flag.',

  INVALID_COMMENT_ID: 'Invalid comment ID: %s',

  // Validation messages
  MISSING_REPO_PARAM: 'Repository name is required',
  MISSING_BRANCH_PARAM: 'Branch name is required',
  MISSING_INVALID_COMMENTS: 'Fixed comments must be a non-empty array',
  INVALID_REPO_FORMAT:
    'Invalid repository name format. Repository name can only contain alphanumeric characters, hyphens, underscores, and forward slashes',
  INVALID_BRANCH_FORMAT:
    'Invalid branch name format. Branch name can only contain alphanumeric characters, hyphens, underscores, and forward slashes',
  INVALID_REPO_STRUCTURE:
    "Invalid repository name structure. Repository name should be in the format 'owner/repo' or just 'repo'",

  // Error messages
  FAILED_MARK_COMMENTS: 'Failed to mark comments as handled:',
  FAILED_FETCH_PR_COMMENTS: 'Failed to fetch PR comments:',
  FAILED_MARK_COMMENT: 'Failed to mark comment #%s as handled: %s',
  FAILED_EXTRACT_PR: 'Failed to extract pull request number for comment #%s',

  MARK_COMMENTS_ERROR: 'Error marking comments as handled:',
  MARK_COMMENT_SUCCESS: 'Successfully marked comment #%s as handled',

  TOOL_NOT_FOUND: 'Tool not found',
  NO_PR_FOR_BRANCH: 'No open pull request found for branch:',
  REQUEST_FAILED: 'GitHub API request failed: %s',
  API_ERROR: 'GitHub API error (HTTP %s): %s',
  ERROR_DETAILS: 'Error details: %s',
  REQUEST_ERROR: 'Error in GitHub API request to %s: %s',
  UNKNOWN_ERROR: 'Unknown error',

  // GitHub API specific errors
  GITHUB_NOT_FOUND: 'GitHub resource not found. Please verify that the repository exists and you have access to it.',
  GITHUB_UNAUTHORIZED: 'GitHub API authentication failed. Please check your API token.',
  GITHUB_FORBIDDEN: 'Access forbidden. Please verify your permissions for this repository.',
  GITHUB_RATE_LIMIT: 'GitHub API rate limit exceeded. Please try again later.',
  GITHUB_SERVER_ERROR: 'GitHub server error. Please try again later.',
  GITHUB_VALIDATION_FAILED: 'GitHub API validation failed: %s',
};

/**
 * HTTP Status codes
 */
export const STATUS_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  RATE_LIMIT: 429,
  INTERNAL_SERVER_ERROR: 500,
};

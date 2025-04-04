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

  MISSING_REQUIRED_PARAMS: 'Missing required parameters. Please provide repo and branch',
  MISSING_API_KEY: 'Error: GitHub API key is required. Please provide it using the --gh_api_key flag.',
  MISSING_OWNER: 'Error: GitHub owner is required. Please provide it using the --gh_owner flag.',
  MISSING_REPO_PARAM: 'Missing required parameter: repo',
  MISSING_INVALID_COMMENTS: 'Missing or invalid fixedComments array',

  INVALID_COMMENT_ID: 'Each fixedComment must have a fixedCommentId (number)',
  INVALID_COMMENT_DATA: 'Each fixedComment must have a fixedCommentId (number) and fixSummary (string)',

  FAILED_MARK_COMMENTS: 'Failed to mark comments as handled:',
  FAILED_FETCH_PR_COMMENTS: 'Failed to fetch PR comments:',
  FAILED_MARK_COMMENT: 'Failed to mark comment #%s as handled: %s',
  FAILED_EXTRACT_PR: 'Failed to extract pull request number for comment #%s',

  MARK_COMMENTS_ERROR: 'Error marking comments as handled:',
  MARK_COMMENT_SUCCESS: 'Successfully marked comment #%s as handled',

  TOOL_NOT_FOUND: 'Tool not found',
  NO_PR_FOR_BRANCH: 'No open pull request found for branch:',
  REQUEST_FAILED: 'GitHub API request failed:',
  API_ERROR: 'GitHub API error:',
  ERROR_DETAILS: 'Error details:',
  REQUEST_ERROR: 'Error in GitHub API request to',
};

/**
 * HTTP Status codes
 */
export const STATUS_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

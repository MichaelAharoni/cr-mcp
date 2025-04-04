/**
 * Server port configuration
 */
export const PORT = 3322;

/**
 * Tool name constants
 */
export const TOOL_NAMES = {
  FIX_PR_COMMENTS: 'fix_pr_comments',
  MARK_COMMENTS_AS_HANDLED: 'mark_comments_as_handled',
};

/**
 * Tool name prefix used by VS Code MCP
 */
export const TOOL_NAME_PREFIX = '9f1_';

/**
 * Prefixed tool names (how VS Code will call them)
 */
export const PREFIXED_TOOL_NAMES = {
  FIX_PR_COMMENTS: `${TOOL_NAME_PREFIX}${TOOL_NAMES.FIX_PR_COMMENTS}`,
  MARK_COMMENTS_AS_HANDLED: `${TOOL_NAME_PREFIX}${TOOL_NAMES.MARK_COMMENTS_AS_HANDLED}`,
};

/**
 * Error and info message dictionary
 */
export const MESSAGE_DICTIONARY = {
  MISSING_REQUIRED_PARAMS: 'Missing required parameters. Please provide repo and branch',
  FAILED_FETCH_PR_COMMENTS: 'Failed to fetch PR comments:',
  MISSING_REPO_PARAM: 'Missing required parameter: repo',
  MISSING_INVALID_COMMENTS: 'Missing or invalid fixedComments array',
  INVALID_COMMENT_ID: 'Each fixedComment must have a fixedCommentId (number)',
  FAILED_MARK_COMMENTS: 'Failed to mark comments as handled:',
  TOOL_NOT_FOUND: 'Tool not found',
  SERVER_STARTED: 'GitHub PR Comments MCP Server started and ready for requests',
  NO_PR_FOR_BRANCH: 'No open pull request found for branch:',
  FOUND_PR_FOR_BRANCH: 'Found pull request #%s for branch %s',
  MARKING_COMMENTS_HANDLED: 'Marking %s comments as handled in %s/%s',
  MARK_COMMENT_ERROR: 'Error marking comment #%s as handled:',
  FAILED_MARK_COMMENT: 'Failed to mark comment #%s as handled: %s',
  MARK_COMMENT_SUCCESS: 'Successfully marked comment #%s as handled',
  FAILED_EXTRACT_PR: 'Failed to extract pull request number for comment #%s',
  FETCHING_PR_COMMENTS: 'Fetching PR comments for %s/%s, branch: %s',
  USING_PR_AUTHOR: 'Using PR author: %s (%s)',
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

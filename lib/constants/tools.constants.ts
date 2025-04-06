// String constants for the mark-comments-as-handled tool
export const MARK_COMMENTS_DICTIONARY = {
  DESCRIPTION: 'Mark GitHub PR comments as handled by replying with a resolution summary and adding a reaction',
  REPO_DESCRIPTION: 'The GitHub repository name containing the PR comments',
  FIXED_COMMENTS_DESCRIPTION: 'List of comments to mark as fixed',
  COMMENT_ID_DESCRIPTION: 'The ID of the GitHub comment that has been fixed',
  SUMMARY_DESCRIPTION: 'Optional: A concise summary (3-15 words) of how the comment was addressed',
  REACTION_DESCRIPTION: 'Optional: The reaction to add (e.g., rocket, heart, hooray). Default: rocket',
};

// String constants for the fix-pr-comments tool
export const FIX_PR_COMMENTS_DICTIONARY = {
  DESCRIPTION:
    'Fetching all of the comments from a GitHub pull request, filtering based on status and author and returning them in a simplified format that makes it easier to handle them. you will need to provide ONLY the repo name and branch name.',
  REPO_DESCRIPTION:
    'The GitHub repository name to fetch PR comments from (You can take it from the root package.json.name, if after trying you get an error, ask the user to provide it)',
  BRANCH_DESCRIPTION:
    'The branch name of the pull request. if the user didn\'t provide it, you can take it from the CLI using "git branch --show-current"',
  PR_AUTHOR_DESCRIPTION: 'Optional: Specific GitHub username to filter comments by',
};

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

// Map to translate between prefixed and non-prefixed tool names
export const TOOL_NAME_MAP = {
  [TOOL_NAMES.FIX_PR_COMMENTS]: PREFIXED_TOOL_NAMES.FIX_PR_COMMENTS,
  [TOOL_NAMES.MARK_COMMENTS_AS_HANDLED]: PREFIXED_TOOL_NAMES.MARK_COMMENTS_AS_HANDLED,
};

// Reverse map for looking up by prefixed name
export const REVERSE_TOOL_NAME_MAP = {
  [PREFIXED_TOOL_NAMES.FIX_PR_COMMENTS]: TOOL_NAMES.FIX_PR_COMMENTS,
  [PREFIXED_TOOL_NAMES.MARK_COMMENTS_AS_HANDLED]: TOOL_NAMES.MARK_COMMENTS_AS_HANDLED,
};

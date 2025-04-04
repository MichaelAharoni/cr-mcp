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

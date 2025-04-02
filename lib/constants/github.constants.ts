/**
 * GitHub API configuration
 */
export const GITHUB_TOKEN = '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';
export const GITHUB_API_URL = 'https://api.github.com';
export const GITHUB_HEADERS = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'GitHub-PR-Comments-MCP-Server',
};

/**
 * Default organization for GitHub API requests
 */
export const DEFAULT_OWNER = 'Natural-Intelligence';

/**
 * Constants for branch types
 */
export const BRANCH_TYPES = {
  MASTER: 'master',
  MAIN: 'main',
};

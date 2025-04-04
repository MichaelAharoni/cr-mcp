#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';

// Import necessary services and utilities
import { setDebugMode, logger, MESSAGE_DICTIONARY } from './lib/constants/common.constants';
import { TOOL_NAMES, PREFIXED_TOOL_NAMES, STATUS_CODES } from './lib/constants/server.constants';
import { setGitHubToken, setGitHubOwner } from './lib/constants/github.constants';
import { getPullRequestComments, handleFixedComments } from './lib/github.service';
import { parseCliArguments } from './lib/cli';
import { FixedComment } from './lib/types/github.types';
import { validateFixPrCommentsInput, validateMarkCommentsInput } from './lib/helpers/validator.helper';

// Parse command line arguments
const cliOptions = parseCliArguments();

// Set debug mode based on CLI option
setDebugMode(!!cliOptions.debug);

// Check if GitHub API key and owner are provided
if (!cliOptions.gh_api_key) {
  console.error(MESSAGE_DICTIONARY.MISSING_API_KEY);
  process.exit(1);
}

if (!cliOptions.gh_owner) {
  console.error(MESSAGE_DICTIONARY.MISSING_OWNER);
  process.exit(1);
}

// Set GitHub API key and owner for use across the application
setGitHubToken(cliOptions.gh_api_key);
setGitHubOwner(cliOptions.gh_owner);

// Create the MCP server
const server = new Server({ name: 'GitHub PR Comments MCP Server', version: '1.0.0' }, { capabilities: { tools: {} } });

// Create stdio transport for VS Code integration
const transport = new StdioServerTransport();

// IIFE to connect to the server and set up handlers
(async (): Promise<void> => {
  // Connect to the transport
  await server.connect(transport);

  // Define available tools - we use the display names (without prefix) here
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: TOOL_NAMES.FIX_PR_COMMENTS,
          description:
            'Fetching all of the comments from a GitHub pull request, filtering based on status and author and returning them in a simplified format that makes it easier to handle them. you will need to provide ONLY the repo name and branch name.',
          inputSchema: {
            type: 'object',
            properties: {
              repo: {
                type: 'string',
                description:
                  'The GitHub repository name to fetch PR comments from (You can take it from the root package.json.name, if after trying you get an error, ask the user to provide it)',
              },
              branch: {
                type: 'string',
                description:
                  'The branch name of the pull request. if the user didn\'t provide it, you can take it from the CLI using "git branch --show-current"',
              },
            },
            required: ['repo', 'branch'],
          },
        },
        {
          name: TOOL_NAMES.MARK_COMMENTS_AS_HANDLED,
          description: 'Mark GitHub PR comments as handled by replying with a resolution summary and adding a reaction',
          inputSchema: {
            type: 'object',
            properties: {
              repo: {
                type: 'string',
                description: 'The GitHub repository name containing the PR comments',
              },
              fixedComments: {
                type: 'array',
                description: 'List of comments to mark as fixed',
                items: {
                  type: 'object',
                  properties: {
                    fixedCommentId: {
                      type: 'number',
                      description: 'The ID of the GitHub comment that has been fixed',
                    },
                    fixSummary: {
                      type: 'string',
                      description: 'Optional: A concise summary (3-15 words) of how the comment was addressed',
                    },
                    reaction: {
                      type: 'string',
                      description: 'Optional: The reaction to add (e.g., rocket, heart, hooray). Default: rocket',
                    },
                  },
                  required: ['fixedCommentId'],
                },
              },
            },
            required: ['repo', 'fixedComments'],
          },
        },
      ],
    };
  });

  // Handle tool calls - we need to check for both prefixed and non-prefixed versions
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;

    // Check if this is the fix_pr_comments tool (with or without prefix)
    if (toolName === TOOL_NAMES.FIX_PR_COMMENTS || toolName === PREFIXED_TOOL_NAMES.FIX_PR_COMMENTS) {
      // Extract parameters from the request
      const {
        repo,
        branch,
        prAuthor: explicitPrAuthor,
      } = request.params.arguments as { repo: string; branch: string; prAuthor?: string };

      // Validate required parameters
      validateFixPrCommentsInput(repo, branch);

      try {
        // Use the service layer to handle the business logic
        const result = await getPullRequestComments({ repo, branch, explicitPrAuthor });

        // Return the result in the expected format
        return {
          isError: false,
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`${MESSAGE_DICTIONARY.FAILED_FETCH_PR_COMMENTS} ${message}`);
        throw new McpError(
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          `${MESSAGE_DICTIONARY.FAILED_FETCH_PR_COMMENTS} ${message}`
        );
      }
    }
    // Check if this is the mark_comments_as_handled tool (with or without prefix)
    else if (
      toolName === TOOL_NAMES.MARK_COMMENTS_AS_HANDLED ||
      toolName === PREFIXED_TOOL_NAMES.MARK_COMMENTS_AS_HANDLED
    ) {
      // Extract parameters from the request
      const { repo, fixedComments } = request.params.arguments as { repo: string; fixedComments: FixedComment[] };

      // Validate required parameters using the validator service
      validateMarkCommentsInput(repo, fixedComments);

      try {
        // Use the service layer to handle the business logic
        const response = await handleFixedComments({ repo, fixedComments });

        // Return the result in the expected format
        return {
          isError: false,
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`${MESSAGE_DICTIONARY.FAILED_MARK_COMMENTS} ${message}`);
        throw new McpError(STATUS_CODES.INTERNAL_SERVER_ERROR, `${MESSAGE_DICTIONARY.FAILED_MARK_COMMENTS} ${message}`);
      }
    } else if (request.params.name === 'mark_comments_as_handled') {
      // Extract parameters from the request
      const { repo, fixedComments } = request.params.arguments as { repo: string; fixedComments: FixedComment[] };

      // Validate required parameters
      if (!repo) {
        throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.MISSING_REPO_PARAM);
      }

      if (!fixedComments || !Array.isArray(fixedComments) || fixedComments.length === 0) {
        throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.MISSING_INVALID_COMMENTS);
      }

      // Validate each fixed comment entry
      for (const comment of fixedComments) {
        if (typeof comment.fixedCommentId !== 'number' || !comment.fixSummary) {
          throw new McpError(STATUS_CODES.BAD_REQUEST, MESSAGE_DICTIONARY.INVALID_COMMENT_DATA);
        }
      }

      try {
        // Use the service layer to handle the business logic
        const response = await handleFixedComments({ repo, fixedComments });

        // Return the result in the expected format
        return {
          isError: false,
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`${MESSAGE_DICTIONARY.MARK_COMMENTS_ERROR} ${message}`);
        throw new McpError(STATUS_CODES.INTERNAL_SERVER_ERROR, `${MESSAGE_DICTIONARY.FAILED_MARK_COMMENTS} ${message}`);
      }
    } else {
      // If the tool name doesn't match any of our tools
      throw new McpError(STATUS_CODES.NOT_FOUND, MESSAGE_DICTIONARY.TOOL_NOT_FOUND);
    }
  });

  // Only log startup message in debug mode
  if (cliOptions.debug) {
    console.error(MESSAGE_DICTIONARY.SERVER_STARTED);
  }
})();

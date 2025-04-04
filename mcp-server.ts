#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';

// Import necessary services and utilities
import { setDebugMode, logger } from './lib/constants';
import { setGitHubToken } from './lib/constants/github.constants';
import { getPullRequestComments, handleFixedComments } from './lib/github.service';
import { parseCliArguments } from './lib/cli';
import { FixedComment } from './lib/types/github.types';

// Parse command line arguments
const cliOptions = parseCliArguments();

// Set debug mode based on CLI option
setDebugMode(!!cliOptions.debug);

// Check if GitHub API key is provided
if (!cliOptions.gh_api_key) {
  console.error('Error: GitHub API key is required. Please provide it using the --gh_api_key flag.');
  process.exit(1);
}

// Set GitHub API key for use across the application
setGitHubToken(cliOptions.gh_api_key);

// Create the MCP server
const server = new Server(
  {
    name: 'GitHub PR Comments MCP Server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Create stdio transport for VS Code integration
const transport = new StdioServerTransport();

// IIFE to connect to the server and set up handlers
(async (): Promise<void> => {
  // Connect to the transport
  await server.connect(transport);

  // Define available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'fix_pr_comments',
          description: 'Get comments from a GitHub pull request, filtering based on status and author',
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
              prAuthor: {
                type: 'string',
                description:
                  'Optional: The GitHub username of the PR author. If not provided, it will be auto-detected',
              },
            },
            required: ['repo', 'branch'],
          },
        },
        {
          name: 'mark_comments_as_handled',
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

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'fix_pr_comments') {
      // Extract parameters from the request
      const {
        repo,
        branch,
        prAuthor: explicitPrAuthor,
      } = request.params.arguments as {
        repo: string;
        branch: string;
        prAuthor?: string;
      };

      // Validate required parameters
      if (!repo || !branch) {
        throw new McpError(400, 'Missing required parameters. Please provide repo and branch');
      }

      try {
        // Use the service layer to handle the business logic
        const result = await getPullRequestComments({
          repo,
          branch,
          explicitPrAuthor,
        });

        // Return the result in the expected format
        return {
          isError: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error fetching PR comments: ${message}`);
        throw new McpError(500, `Failed to fetch PR comments: ${message}`);
      }
    } else if (request.params.name === 'mark_comments_as_handled') {
      // Extract parameters from the request
      const { repo, fixedComments } = request.params.arguments as {
        repo: string;
        fixedComments: FixedComment[];
      };

      // Validate required parameters
      if (!repo) {
        throw new McpError(400, 'Missing required parameter: repo');
      }

      if (!fixedComments || !Array.isArray(fixedComments) || fixedComments.length === 0) {
        throw new McpError(400, 'Missing or invalid fixedComments array');
      }

      // Validate each fixed comment entry
      for (const comment of fixedComments) {
        if (typeof comment.fixedCommentId !== 'number') {
          throw new McpError(400, 'Each fixedComment must have a fixedCommentId (number)');
        }
      }

      try {
        // Use the service layer to handle the business logic
        const response = await handleFixedComments({
          repo,
          fixedComments,
        });

        // Return the result in the expected format
        return {
          isError: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error marking comments as handled: ${message}`);
        throw new McpError(500, `Failed to mark comments as handled: ${message}`);
      }
    } else {
      // If the tool name doesn't match any of our tools
      throw new McpError(404, 'Tool not found');
    }
  });

  // Only log startup message in debug mode
  if (cliOptions.debug) {
    console.error('GitHub PR Comments MCP Server started and ready for requests');
  }
})();

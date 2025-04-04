#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';

// Import necessary services and utilities
import { DEFAULT_OWNER, setDebugMode, logger } from './lib/constants';
import { setGitHubToken } from './lib/constants/github.constants';
import { fetchPullRequestComments } from './lib/github.repository';
import { simplifyGitHubComments } from './lib/comments.helper';
import { parseCliArguments } from './lib/cli';

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
                description: 'The GitHub repository name to fetch PR comments from',
              },
              branch: {
                type: 'string',
                description: 'The branch name of the pull request',
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

      logger.info(`Fetching PR comments for ${DEFAULT_OWNER}/${repo}, branch: ${branch}`);

      try {
        // Fetch PR comments from GitHub with handling status and PR author information
        const {
          comments,
          handledStatus,
          prAuthor: detectedPrAuthor,
        } = await fetchPullRequestComments({
          repo,
          owner: DEFAULT_OWNER,
          branch,
        });

        // Use explicitly provided PR author if available, otherwise use the one detected from GitHub
        const prAuthor = explicitPrAuthor || detectedPrAuthor;
        logger.info(`Using PR author: ${prAuthor} (${explicitPrAuthor ? 'explicitly provided' : 'auto-detected'})`);

        // Transform the comments to the simplified structure with proper handling status
        const simplifiedComments = simplifyGitHubComments(comments, handledStatus, prAuthor);
        logger.info('Simplified comments:', simplifiedComments);

        // Return the result in the expected format
        return {
          isError: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  branch: branch,
                  comments: simplifiedComments,
                  stepsForward: [
                    `1. Don't explain the user that each comment hasn't been handled yet, unless the user explicitly asks for it.`,
                    `2. If in order to handle a comment, you need to ask the user for more information or context, do so.`,
                    `3. Where you can, provide the user with a list of possible actions they can take to handle the comment (if its a difficult one).`,
                    `4. If you are not sure if a comment is handled or not, ask the user for clarification.`,
                    `5. Understand the context of the comment and provide a response that is relevant to the comment.`,
                    `6. If the comment doen't require any action, you can ignore it. (like a positive feedback comment)`,
                    `7. When you finish handling the PR, you can ask the user if they want to mark all comments as handled.`,
                  ],
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error fetching PR comments: ${message}`);
        throw new McpError(500, `Failed to fetch PR comments: ${message}`);
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

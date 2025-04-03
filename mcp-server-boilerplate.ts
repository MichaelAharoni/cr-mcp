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
          name: 'get_pr_comments',
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
    if (request.params.name === 'get_pr_comments') {
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
        logger.info(`3Using PR author: ${prAuthor} (${explicitPrAuthor ? 'explicitly provided' : 'auto-detected'})`);

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
                  repository: repo,
                  branch: branch,
                  prAuthor: prAuthor,
                  comments: simplifiedComments,
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

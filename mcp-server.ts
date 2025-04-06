#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';

// Import necessary services and utilities
import { parseCliArguments } from './lib/cli';
import { setDebugMode, logger, MESSAGE_DICTIONARY } from './lib/constants/common.constants';
import { STATUS_CODES } from './lib/constants/server.constants';
import { setGitHubToken, setGitHubOwner } from './lib/constants/github.constants';
import { PREFIXED_TOOL_NAMES, REVERSE_TOOL_NAME_MAP, TOOL_NAME_MAP } from './lib/constants/tools.constants';

// Import tools
import { FIX_PR_COMMENTS_TOOL, handleFixPrComments } from './lib/tools/fix-pr-comments.tool';
import { handleMarkCommentsAsHandled, MARK_COMMENTS_AS_HANDLED_TOOL } from './lib/tools/mark-comments-as-handled.tool';

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

setGitHubToken(cliOptions.gh_api_key);
setGitHubOwner(cliOptions.gh_owner);

// Create the MCP server
const server = new Server({ name: 'GitHub PR Comments MCP Server', version: '1.0.0' }, { capabilities: { tools: {} } });

// Create stdio transport for VS Code integration
const transport = new StdioServerTransport();

// IIFE to connect to the server and set up handlers
(async (): Promise<void> => {
  try {
    // Connect to the transport
    await server.connect(transport);

    // Override the original ListToolsRequestSchema handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Listing available tools');

      // Return non-prefixed tool definitions for better user experience
      return {
        tools: [FIX_PR_COMMENTS_TOOL, MARK_COMMENTS_AS_HANDLED_TOOL],
      };
    });

    // Intercept tool calls and handle name translation
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const originalToolName = request.params.name;
      logger.debug(`Original tool call received: ${originalToolName}`);

      // Determine which tool to use and map non-prefixed to prefixed internally
      let actualToolName = originalToolName;

      // If a non-prefixed name was used, map it to its prefixed version for internal use
      if (TOOL_NAME_MAP[originalToolName]) {
        actualToolName = TOOL_NAME_MAP[originalToolName];
        logger.debug(`Mapped non-prefixed tool name to: ${actualToolName}`);
      }

      // If a prefixed name was used, log that we're using it directly
      else if (REVERSE_TOOL_NAME_MAP[originalToolName]) {
        logger.debug(`Using prefixed tool name directly: ${actualToolName}`);
      }

      // Handle the tool call based on the mapped or original name
      switch (actualToolName) {
        case PREFIXED_TOOL_NAMES.FIX_PR_COMMENTS:
          logger.debug(`Executing fix_pr_comments tool with params: ${JSON.stringify(request.params.arguments)}`);

          return handleFixPrComments(request.params.arguments);

        case PREFIXED_TOOL_NAMES.MARK_COMMENTS_AS_HANDLED:
          logger.debug(
            `Executing mark_comments_as_handled tool with params: ${JSON.stringify(request.params.arguments)}`
          );

          return handleMarkCommentsAsHandled(request.params.arguments);

        default:
          logger.error(`Unknown tool requested: ${originalToolName} (mapped to: ${actualToolName})`);
          throw new McpError(STATUS_CODES.NOT_FOUND, MESSAGE_DICTIONARY.TOOL_NOT_FOUND);
      }
    });

    // Log startup message
    if (cliOptions.debug) {
      console.error(MESSAGE_DICTIONARY.SERVER_STARTED);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Server initialization failed: ${message}`);
    process.exit(1);
  }
})();

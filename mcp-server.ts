#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';

// Import necessary services and utilities
import { parseCliArguments } from './lib/cli';
import { setDebugMode, MESSAGE_DICTIONARY } from './lib/constants/common.constants';
import { STATUS_CODES } from './lib/constants/server.constants';
import { setGitHubToken, setGitHubOwner } from './lib/constants/github.constants';
import {
  FIX_PR_COMMENTS_DICTIONARY,
  MARK_COMMENTS_DICTIONARY,
  PREFIXED_TOOL_NAMES,
  TOOL_NAMES,
} from './lib/constants/tools.constants';

// Import tools
import { handleFixPrComments, fixPrCommentsJsonSchema } from './lib/tools/fix-pr-comments.tool';
import {
  handleMarkCommentsAsHandled,
  markCommentsAsHandledJsonSchema,
} from './lib/tools/mark-comments-as-handled.tool';

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
// Set GitHub API key and owner for use across the application

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
          description: FIX_PR_COMMENTS_DICTIONARY.DESCRIPTION,
          inputSchema: fixPrCommentsJsonSchema,
        },
        {
          name: TOOL_NAMES.MARK_COMMENTS_AS_HANDLED,
          description: MARK_COMMENTS_DICTIONARY.DESCRIPTION,
          inputSchema: markCommentsAsHandledJsonSchema,
        },
      ],
    };
  });

  // Handle tool calls - we need to check for both prefixed and non-prefixed versions
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;

    // Check if this is the fix_pr_comments tool (with or without prefix)
    switch (toolName) {
      case TOOL_NAMES.FIX_PR_COMMENTS:
      case PREFIXED_TOOL_NAMES.FIX_PR_COMMENTS:
        return handleFixPrComments(request.params.arguments);

      case TOOL_NAMES.MARK_COMMENTS_AS_HANDLED:
      case PREFIXED_TOOL_NAMES.MARK_COMMENTS_AS_HANDLED:
        return handleMarkCommentsAsHandled(request.params.arguments);

      default:
        throw new McpError(STATUS_CODES.NOT_FOUND, MESSAGE_DICTIONARY.TOOL_NOT_FOUND);
    }
  });

  // Only log startup message in debug mode
  if (cliOptions.debug) {
    console.error(MESSAGE_DICTIONARY.SERVER_STARTED);
  }
})();

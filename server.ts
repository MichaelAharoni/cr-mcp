#!/usr/bin/env node

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { PORT, MESSAGE_DICTIONARY, STATUS_CODES } from './lib/constants/server.constants';
import { setGitHubToken, setGitHubOwner } from './lib/constants/github.constants';
import { logger, setDebugMode } from './lib/constants/common.constants';
import { getPullRequestComments, handleFixedComments } from './lib/github.service';
import { parseCliArguments } from './lib/cli';
import { FixedComment } from './lib/types/github.types';
import { validateFixPrCommentsInput, validateMarkCommentsInput } from './lib/helpers/validator.helper';
import { cleanRepositoryName } from './lib/helpers/utils.helper';

// Express application instance (declared at module level for export)
const app = initializeServer();

/**
 * Initialize the Express server
 */
function initializeServer(): express.Express {
  const expressApp = express();

  // Middleware
  expressApp.use(bodyParser.json({ limit: '50mb' }));

  return expressApp;
}

/**
 * Configure routes for the Express application
 */
function configureRoutes(expressApp: express.Express): void {
  // Endpoint to get code review comments for a PR based on branch
  expressApp.post('/fix-pr-comments', handleFixPrComments);

  // Endpoint to mark comments as handled
  expressApp.post('/mark-comments-handled', handleMarkCommentsAsHandled);

  // Health check endpoint
  expressApp.get('/health', handleHealthCheck);
}

/**
 * Handle fix-pr-comments endpoint requests
 */
async function handleFixPrComments(req: Request, res: Response): Promise<void> {
  try {
    const { repo: rawRepo, branch, prAuthor: explicitPrAuthor } = req.body;

    try {
      // Validate required parameters
      validateFixPrCommentsInput(rawRepo, branch);

      // Clean repository name (remove owner if present)
      const repo = cleanRepositoryName(rawRepo);

      logger.info(`Processing fix-pr-comments request for ${repo}, branch: ${branch}`);

      // Use the service layer to get PR comments
      const result = await getPullRequestComments({
        repo,
        branch,
        explicitPrAuthor,
      });

      // Return the PR comments data
      res.status(STATUS_CODES.OK).json({
        repository: repo,
        branch: result.branch,
        comments: result.comments,
        stepsForward: result.stepsForward,
      });
    } catch (validationError) {
      // Handle validation errors (likely 400 Bad Request)
      if (validationError instanceof Error) {
        const statusCode = validationError instanceof McpError ? validationError.code : STATUS_CODES.BAD_REQUEST;

        res.status(statusCode).json({
          error: validationError.message,
        });
      }
    }
  } catch (error) {
    // Handle unexpected errors
    logger.error('Error fetching PR comments:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      error: MESSAGE_DICTIONARY.FAILED_FETCH_PR_COMMENTS,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle mark-comments-handled endpoint requests
 */
async function handleMarkCommentsAsHandled(req: Request, res: Response): Promise<void> {
  try {
    const { repo: rawRepo, fixedComments } = req.body as { repo: string; fixedComments: FixedComment[] };

    try {
      // Validate required parameters
      validateMarkCommentsInput(rawRepo, fixedComments);

      // Clean repository name (remove owner if present)
      const repo = cleanRepositoryName(rawRepo);

      logger.info(`Processing mark-comments-handled request for ${repo}, ${fixedComments.length} comments`);

      // Use the service layer to mark comments as handled
      const result = await handleFixedComments({
        repo,
        fixedComments,
      });

      // Return the results
      res.status(STATUS_CODES.OK).json(result);
    } catch (validationError) {
      // Handle validation errors (likely 400 Bad Request)
      if (validationError instanceof Error) {
        const statusCode = validationError instanceof McpError ? validationError.code : STATUS_CODES.BAD_REQUEST;

        res.status(statusCode).json({
          error: validationError.message,
        });
      }
    }
  } catch (error) {
    // Handle unexpected errors
    logger.error('Error marking comments as handled:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      error: MESSAGE_DICTIONARY.FAILED_MARK_COMMENTS,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle health check endpoint requests
 */
function handleHealthCheck(_req: Request, res: Response): void {
  res.status(STATUS_CODES.OK).json({ status: 'healthy' });
}

/**
 * Main function to start the server
 */
function startServer(): void {
  // Parse command line arguments
  const cliOptions = parseCliArguments();

  // Set debug mode based on CLI option
  setDebugMode(!!cliOptions.debug);

  // Check if GitHub API key and owner are provided
  if (!cliOptions.gh_api_key) {
    console.error('Error: GitHub API key is required. Please provide it using the --gh_api_key flag.');
    process.exit(1);
  }

  if (!cliOptions.gh_owner) {
    console.error('Error: GitHub owner is required. Please provide it using the --gh_owner flag.');
    process.exit(1);
  }

  // Set GitHub API key and owner
  setGitHubToken(cliOptions.gh_api_key);
  setGitHubOwner(cliOptions.gh_owner);

  // Use port from command line if provided, otherwise use default
  const port = cliOptions.port || PORT;

  // Configure routes for the Express application
  configureRoutes(app);

  // Start the server
  app.listen(port, () => {
    logger.info(`MCP server is running on port ${port}`);
    logger.info('GitHub API Token: Provided via CLI argument');
    logger.info(`GitHub Owner: ${cliOptions.gh_owner}`);
  });
}

// Start the server
startServer();

// Export for testing
export default app;

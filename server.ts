#!/usr/bin/env node

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { PORT } from './lib/constants/server.constants';
import { setGitHubToken } from './lib/constants/github.constants';
import { getPullRequestComments, handleFixedComments } from './lib/github.service';
import { parseCliArguments } from './lib/cli';
import { FixedComment } from './lib/types/github.types';

// Parse command line arguments
const cliOptions = parseCliArguments();

// Check if GitHub API key is provided
if (!cliOptions.gh_api_key) {
  console.error('Error: GitHub API key is required. Please provide it using the --gh_api_key flag.');
  process.exit(1);
}

// Set GitHub API key
setGitHubToken(cliOptions.gh_api_key);

// Use port from command line if provided, otherwise use default
const port = cliOptions.port || PORT;

const app = express();

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));

// Endpoint to get code review comments for a PR based on branch
app.post('/fix-pr-comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { repo, branch, prAuthor: explicitPrAuthor } = req.body;

    if (!repo || !branch) {
      res.status(400).json({
        error: 'Missing required parameters. Please provide repo and branch',
      });

      return;
    }

    console.log(`Processing fix-pr-comments request for ${repo}, branch: ${branch}`);

    // Use the service layer to get PR comments
    const result = await getPullRequestComments({
      repo,
      branch,
      explicitPrAuthor,
    });

    // Return the PR comments data
    res.status(200).json({
      repository: repo,
      branch: result.branch,
      comments: result.comments,
      stepsForward: result.stepsForward,
    });
  } catch (error) {
    console.error('Error fetching PR comments:', error);
    res.status(500).json({
      error: 'Failed to fetch PR comments',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// New endpoint to mark comments as handled
app.post('/mark-comments-handled', async (req: Request, res: Response): Promise<void> => {
  try {
    const { repo, fixedComments } = req.body as { repo: string; fixedComments: FixedComment[] };

    if (!repo) {
      res.status(400).json({
        error: 'Missing required parameter: repo',
      });

      return;
    }

    if (!fixedComments || !Array.isArray(fixedComments) || fixedComments.length === 0) {
      res.status(400).json({
        error: 'Missing or invalid fixedComments array',
      });

      return;
    }

    // Validate each fixed comment entry
    for (const comment of fixedComments) {
      if (typeof comment.fixedCommentId !== 'number') {
        res.status(400).json({
          error: 'Each fixedComment must have a fixedCommentId (number)',
        });

        return;
      }
    }

    console.log(`Processing mark-comments-handled request for ${repo}, ${fixedComments.length} comments`);

    // Use the service layer to mark comments as handled
    const result = await handleFixedComments({
      repo,
      fixedComments,
    });

    // Return the results
    res.status(200).json(result);
  } catch (error) {
    console.error('Error marking comments as handled:', error);
    res.status(500).json({
      error: 'Failed to mark comments as handled',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'healthy' });
});

// Start the server
app.listen(port, () => {
  console.log(`MCP server is running on port ${port}`);
  console.log(`GitHub API Token: Provided via CLI argument`);
});

export default app;

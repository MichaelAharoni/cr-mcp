#!/usr/bin/env node

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { DEFAULT_OWNER } from './lib/constants';
import { PORT } from './lib/constants/server.constants';
import { setGitHubToken } from './lib/constants/github.constants';
import { fetchPullRequestComments } from './lib/github.repository';
import { simplifyGitHubComments } from './lib/comments.helper';
import { parseCliArguments } from './lib/cli';

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

// New endpoint to get code review comments for a PR based on branch
app.post('/get-cr-comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { repo, branch, prAuthor: explicitPrAuthor } = req.body;
    const owner = DEFAULT_OWNER;

    if (!repo || !branch) {
      res.status(400).json({
        error: 'Missing required parameters. Please provide repo and branch',
      });

      return;
    }

    console.log(`Fetching PR comments for ${owner}/${repo}, branch: ${branch}`);

    // Fetch PR comments from GitHub with handling status and PR author information
    const {
      comments,
      handledStatus,
      prAuthor: detectedPrAuthor,
    } = await fetchPullRequestComments({
      repo,
      owner,
      branch,
    });

    // Use explicitly provided PR author if available, otherwise use the one detected from GitHub
    const prAuthor = explicitPrAuthor || detectedPrAuthor;
    console.log(`2Using PR author: ${prAuthor} (${explicitPrAuthor ? 'explicitly provided' : 'auto-detected'})`);

    // Transform the comments to the simplified structure with proper handling status
    // Pass the PR author for filtering
    const simplifiedComments = simplifyGitHubComments(comments, handledStatus, prAuthor);

    // Return the simplified comments
    res.status(200).json({
      repository: repo,
      branch: branch,
      prAuthor: prAuthor,
      comments: simplifiedComments,
    });
  } catch (error) {
    console.error('Error fetching PR comments:', error);
    res.status(500).json({
      error: 'Failed to fetch PR comments',
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

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import {
  fetchPullRequestComments,
  processCodeReviewComments,
  listOrganizationRepos,
  DEFAULT_OWNER,
  simplifyGitHubComments,
  PORT,
} from './lib';

const app = express();
// Use PORT constant directly instead of loading from .env
const port = PORT;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));

// Endpoint to list available repositories in the organization
app.get('/repos', async (_req: Request, res: Response): Promise<void> => {
  try {
    const repos = await listOrganizationRepos();

    res.status(200).json({
      organization: DEFAULT_OWNER,
      repositories: repos,
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({
      error: 'Failed to fetch repositories',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

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
    console.log(`Using PR author: ${prAuthor} (${explicitPrAuthor ? 'explicitly provided' : 'auto-detected'})`);

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

// MCP handler endpoint
app.post('/mcp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { repo, pull_number, branch } = req.body;
    // Always use Natural-Intelligence as the owner
    const owner = DEFAULT_OWNER;

    if (!repo || (!pull_number && !branch)) {
      res.status(400).json({
        error: 'Missing required parameters. Please provide repo and either pull_number or branch',
      });

      return;
    }

    console.log(`Processing GitHub PR comments for ${owner}/${repo}`);

    // Fetch PR comments from GitHub
    const { comments } = await fetchPullRequestComments({
      repo,
      owner,
      pull_number,
      branch,
    });

    // Process the comments for the LLM agent
    const processedComments = processCodeReviewComments(comments);

    // Return the processed comments
    res.status(200).json({
      context: {
        codeReviewComments: processedComments,
      },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: 'Failed to process request',
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
});

export default app;

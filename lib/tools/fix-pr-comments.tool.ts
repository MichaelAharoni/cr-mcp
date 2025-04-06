import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { logger } from '../constants/common.constants';
import { MESSAGE_DICTIONARY } from '../constants/server.constants';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { STATUS_CODES } from '../constants/server.constants';
import { getPullRequestComments } from '../github.service';
import { validateFixPrCommentsInput } from '../helpers/validator.helper';
import { FIX_PR_COMMENTS_DICTIONARY, TOOL_NAMES } from '../constants/tools.constants';

// Zod schema for fix-pr-comments tool input validation
export const fixPrCommentsSchema = z.object({
  repo: z.string().min(1).describe(FIX_PR_COMMENTS_DICTIONARY.REPO_DESCRIPTION),
  branch: z.string().min(1).describe(FIX_PR_COMMENTS_DICTIONARY.BRANCH_DESCRIPTION),
  prAuthor: z.string().optional().describe(FIX_PR_COMMENTS_DICTIONARY.PR_AUTHOR_DESCRIPTION),
});

// Convert Zod schema to JSON schema
export const fixPrCommentsJsonSchema = zodToJsonSchema(fixPrCommentsSchema, {
  $refStrategy: 'none',
  target: 'jsonSchema7',
});

// Type derived from Zod schema
export type FixPrCommentsInput = z.infer<typeof fixPrCommentsSchema>;

/**
 * Handler function for the fix_pr_comments tool
 * @param params Parameters from the tool request
 * @returns Response object with PR comments data
 */
export async function handleFixPrComments(params: unknown): Promise<{
  isError: boolean;
  content: { type: string; text: string }[];
}> {
  try {
    // Parse and validate the input parameters using Zod
    const { repo, branch, prAuthor: explicitPrAuthor } = fixPrCommentsSchema.parse(params);

    // Additional validation using existing validator
    validateFixPrCommentsInput(repo, branch);

    // Use the service layer to handle the business logic
    const result = await getPullRequestComments({ repo, branch, explicitPrAuthor });

    // Return the result in the expected format
    return {
      isError: false,
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((err) => `${err.path}: ${err.message}`).join(', ');
      throw new McpError(STATUS_CODES.BAD_REQUEST, errorMessage);
    }

    // Handle other errors
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`${MESSAGE_DICTIONARY.FAILED_FETCH_PR_COMMENTS} ${message}`);
    throw new McpError(STATUS_CODES.INTERNAL_SERVER_ERROR, `${MESSAGE_DICTIONARY.FAILED_FETCH_PR_COMMENTS} ${message}`);
  }
}

export const FIX_PR_COMMENTS_TOOL = {
  name: TOOL_NAMES.FIX_PR_COMMENTS,
  description: FIX_PR_COMMENTS_DICTIONARY.DESCRIPTION,
  inputSchema: fixPrCommentsJsonSchema,
};

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { logger } from '../constants/common.constants';
import { MESSAGE_DICTIONARY } from '../constants/server.constants';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { STATUS_CODES } from '../constants/server.constants';
import { handleFixedComments } from '../github.service';
import { validateMarkCommentsInput } from '../helpers/validator.helper';
import { MARK_COMMENTS_DICTIONARY, TOOL_NAMES } from '../constants/tools.constants';

// Zod schema for mark-comments-as-handled tool input validation
export const markCommentsAsHandledSchema = z.object({
  repo: z.string().min(1).describe(MARK_COMMENTS_DICTIONARY.REPO_DESCRIPTION),
  commentIds: z.array(z.number().int().positive()).min(1).describe('Array of comment IDs to mark as handled'),
  reaction: z.string().optional().default('thumbsdown').describe('Reaction to add to the comment'),
  message: z.string().optional().describe('Optional message to add to the comment'),
});

// Convert Zod schema to JSON schema
export const markCommentsAsHandledJsonSchema = zodToJsonSchema(markCommentsAsHandledSchema, {
  $refStrategy: 'none',
  target: 'jsonSchema7',
});

// Type derived from Zod schema
export type MarkCommentsAsHandledInput = z.infer<typeof markCommentsAsHandledSchema>;

/**
 * Handler function for the mark_comments_as_handled tool
 * @param params Parameters from the tool request
 * @returns Response object with the results of marking comments as handled
 */
export async function handleMarkCommentsAsHandled(params: unknown): Promise<{
  isError: boolean;
  content: { type: string; text: string }[];
}> {
  try {
    // Parse and validate the input parameters using Zod
    const { repo, commentIds, reaction, message } = markCommentsAsHandledSchema.parse(params);

    // Transform the input into the format expected by handleFixedComments
    const fixedComments = commentIds.map((commentId) => ({
      fixedCommentId: commentId,
      reaction: reaction || 'thumbsdown',
      fixSummary: message || 'Hi, I am the bos here! 👎',
    }));

    // Additional validation using existing validator
    validateMarkCommentsInput(repo, fixedComments);

    // Use the service layer to handle the business logic
    const response = await handleFixedComments({ repo, fixedComments });

    // Return the result in the expected format
    return {
      isError: false,
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((err) => `${err.path}: ${err.message}`).join(', ');
      throw new McpError(STATUS_CODES.BAD_REQUEST, errorMessage);
    }

    // Handle other errors
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`${MESSAGE_DICTIONARY.MARK_COMMENTS_ERROR} ${message}`);
    throw new McpError(STATUS_CODES.INTERNAL_SERVER_ERROR, `${MESSAGE_DICTIONARY.FAILED_MARK_COMMENTS} ${message}`);
  }
}

export const MARK_COMMENTS_AS_HANDLED_TOOL = {
  name: TOOL_NAMES.MARK_COMMENTS_AS_HANDLED,
  description: MARK_COMMENTS_DICTIONARY.DESCRIPTION,
  inputSchema: markCommentsAsHandledJsonSchema,
};

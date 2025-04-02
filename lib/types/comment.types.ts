/**
 * Types related to comment processing and analysis
 */

/**
 * Processed comment interface with AI-enhanced analysis
 */
export interface ProcessedComment {
  id: number;
  author: string;
  comment: string;
  file?: string;
  line?: number;
  codeContext?: string;
  url: string;
  timestamp: string;
  type: 'review' | 'general';
  refactoringRequested: boolean;
  priority: 'high' | 'medium' | 'low';
  suggestedAction?: string;
  codeBlockSuggestion?: string;
  aiAnalysis?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    codeSuggestion: boolean;
    refactoringTags: string[];
  };
}

/**
 * Simplified comment structure for easier consumption by the AI agent
 */
export interface SimplifiedComment {
  commentNumber: number;
  filePath: string;
  fromUserName: string;
  commentMessage: string;
  isHandled: boolean;
  startLine: number | null;
  endLine: number | null;
  creationTime: string;
}

/**
 * Type for sentiment analysis results
 */
export type SentimentType = 'positive' | 'negative' | 'neutral';

/**
 * Type for comment priority levels
 */
export type PriorityLevel = 'high' | 'medium' | 'low';

/**
 * Type for comment types
 */
export type CommentType = 'review' | 'general';

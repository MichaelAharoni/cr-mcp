/**
 * Simplified comment structure for easier consumption
 */
export interface SimplifiedComment {
  commentNumber: number;
  commentId: number;
  filePath: string;
  fromUserName: string;
  commentMessage: string;
  isHandled: boolean;
  startLine: number | null;
  endLine: number | null;
  creationTime: string;
}

/**
 * Constants related to comment analysis and processing
 */

/**
 * Keywords for refactoring detection in comments
 */
export const REFACTORING_KEYWORDS = [
  'refactor',
  'clean up',
  'simplify',
  'optimize',
  'improve',
  'rewrite',
  'restructure',
  'better approach',
  'better way',
  'should be changed',
  'could be better',
  'needs improvement',
  'fix this',
  'update this',
  'change this',
];

/**
 * Keywords for high priority comment detection
 */
export const HIGH_PRIORITY_KEYWORDS = [
  'critical',
  'urgent',
  'important',
  'security',
  'bug',
  'fix immediately',
  'vulnerability',
  'crash',
  'error',
  'must fix',
  'high priority',
];

/**
 * Keywords for medium priority comment detection
 */
export const MEDIUM_PRIORITY_KEYWORDS = [
  'should',
  'recommended',
  'consider',
  'might want to',
  'suggestion',
  'could improve',
  'better if',
  'would be nice',
];

/**
 * Regex patterns for extracting action suggestions from comments
 */
export const ACTION_PATTERNS = [
  /should\s+(\w+)/i,
  /need\s+to\s+(\w+)/i,
  /must\s+(\w+)/i,
  /please\s+(\w+)/i,
  /consider\s+(\w+ing)/i,
  /try\s+(\w+ing)/i,
];

/**
 * Patterns for sentiment analysis
 */
export const SENTIMENT_WORDS = {
  positive: ['good', 'great', 'excellent', 'nice', 'well done', 'perfect', 'yes'],
  negative: ['bad', 'wrong', 'incorrect', 'error', 'mistake', 'fix', 'issue', 'bug', 'no'],
};

/**
 * Patterns for identifying refactoring tags
 */
export const REFACTORING_PATTERNS = {
  performance: ['slow', 'performance', 'optimize', 'faster', 'efficient'],
  security: ['security', 'vulnerability', 'secure', 'sanitize', 'protect'],
  readability: ['readable', 'clarity', 'clearer', 'understand', 'naming'],
  maintainability: ['maintain', 'complex', 'simplify', 'technical debt'],
  duplication: ['duplicate', 'redundant', 'repeat', 'reuse', 'dry'],
};

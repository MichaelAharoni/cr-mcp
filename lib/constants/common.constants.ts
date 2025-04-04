// Re-export all constants from their respective files
export * from './github.constants';
export * from './server.constants';

// Debug mode flag
let isDebugMode = false;

export function setDebugMode(debug: boolean): void {
  isDebugMode = debug;
}

export function getDebugMode(): boolean {
  return isDebugMode;
}

// Logger utility that only logs when in debug mode
export const logger = {
  debug: (message: string, ...args: unknown[]): void => {
    if (isDebugMode) {
      console.error(`[DEBUG] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]): void => {
    if (isDebugMode) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]): void => {
    if (isDebugMode) {
      console.error(`[INFO] ${message}`, ...args);
    }
  },
};

/**
 * Retry utility for handling transient failures
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (error?.response?.status) {
      const status = error.response.status;
      return status >= 500 && status < 600;
    }
    // Retry on network errors (no response)
    return !error?.response;
  },
};

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt >= opts.maxAttempts) {
        break;
      }

      // Don't retry if the error is not retryable
      if (!opts.shouldRetry(error)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
      
      console.warn(
        `[RETRY] Attempt ${attempt}/${opts.maxAttempts} failed. Retrying in ${delay}ms...`,
        error
      );

      await sleep(delay);
    }
  }

  // All attempts failed
  throw lastError;
}

/**
 * Create a user-friendly error message from an error object
 */
export function formatErrorMessage(error: any, defaultMessage: string): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
}


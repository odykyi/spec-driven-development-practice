import { LLMError } from './types.js';

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Retries rate-limit and overload errors with capped exponential backoff and
 * full jitter, honouring a provider's `retry-after` hint when it sends one.
 * Non-retryable errors (bad request, auth) surface immediately.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 4, baseDelayMs = 1000, maxDelayMs = 30000, sleep = defaultSleep } = options;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const retryable = error instanceof LLMError && error.retryable;
      if (!retryable || attempt >= retries) {
        throw error;
      }
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const delay = error.retryAfterMs ?? Math.round(Math.random() * backoff);
      await sleep(delay);
    }
  }
}

/** HTTP statuses worth retrying: rate limited, overloaded, or transient server errors. */
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

export function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

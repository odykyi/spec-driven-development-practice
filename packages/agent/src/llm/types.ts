export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface CompletionRequest {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  usage: TokenUsage;
  latencyMs: number;
  /** Reported by providers that price the call themselves (the Claude CLI does). */
  costUsd?: number;
}

/**
 * The single seam between the agent and a model provider. Everything above this
 * interface (agent loop, judge, eval harness) is provider-agnostic and is tested
 * against `ScriptedClient`.
 */
export interface LLMClient {
  readonly provider: string;
  readonly model: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
}

export class LLMError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryable = false,
    readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
  };
}

export const ZERO_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0 };

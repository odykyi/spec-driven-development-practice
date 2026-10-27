import { CompletionRequest, CompletionResult, LLMClient, LLMError } from './types.js';
import { isRetryableStatus, parseRetryAfter, withRetry, RetryOptions } from './retry.js';

export interface OpenAICompatibleOptions {
  model: string;
  /** Defaults to a local Ollama server. Works with vLLM, LM Studio and OpenAI too. */
  baseUrl?: string;
  apiKey?: string;
  retry?: RetryOptions;
  fetchImpl?: typeof fetch;
}

interface ChatCompletionResponse {
  model: string;
  choices: Array<{ message: { content: string | null } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

/** Any server that speaks `POST /chat/completions`, so the eval can run on open-weight models. */
export class OpenAICompatibleClient implements LLMClient {
  readonly provider = 'openai-compatible';
  readonly model: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: OpenAICompatibleOptions) {
    this.model = options.model;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  complete(request: CompletionRequest): Promise<CompletionResult> {
    return withRetry(() => this.once(request), this.options.retry);
  }

  private async once(request: CompletionRequest): Promise<CompletionResult> {
    const started = Date.now();
    const baseUrl = (this.options.baseUrl ?? 'http://localhost:11434/v1').replace(/\/$/, '');
    const messages = request.system
      ? [{ role: 'system', content: request.system }, ...request.messages]
      : request.messages;

    const response = await this.fetchImpl(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new LLMError(
        `Chat completions ${response.status}: ${body.slice(0, 500)}`,
        response.status,
        isRetryableStatus(response.status),
        parseRetryAfter(response.headers.get('retry-after'))
      );
    }

    const data = (await response.json()) as ChatCompletionResponse;
    return {
      text: data.choices[0]?.message.content ?? '',
      model: data.model ?? this.model,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
      latencyMs: Date.now() - started,
    };
  }
}

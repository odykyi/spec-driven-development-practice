import { CompletionRequest, CompletionResult, LLMClient, LLMError } from './types.js';
import { isRetryableStatus, parseRetryAfter, withRetry, RetryOptions } from './retry.js';

export interface AnthropicClientOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  retry?: RetryOptions;
  fetchImpl?: typeof fetch;
}

interface AnthropicResponse {
  model: string;
  content: Array<{ type: string; text?: string }>;
  usage: { input_tokens: number; output_tokens: number };
}

/** Claude via the Messages API. No SDK dependency: one POST per completion. */
export class AnthropicClient implements LLMClient {
  readonly provider = 'anthropic';
  readonly model: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: AnthropicClientOptions) {
    this.model = options.model;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  complete(request: CompletionRequest): Promise<CompletionResult> {
    return withRetry(() => this.once(request), this.options.retry);
  }

  private async once(request: CompletionRequest): Promise<CompletionResult> {
    const started = Date.now();
    const response = await this.fetchImpl(
      `${this.options.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.options.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: request.maxTokens ?? 4096,
          temperature: request.temperature,
          system: request.system,
          messages: request.messages,
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new LLMError(
        `Anthropic API ${response.status}: ${body.slice(0, 500)}`,
        response.status,
        isRetryableStatus(response.status),
        parseRetryAfter(response.headers.get('retry-after'))
      );
    }

    const data = (await response.json()) as AnthropicResponse;
    return {
      text: data.content
        .filter(block => block.type === 'text')
        .map(block => block.text ?? '')
        .join(''),
      model: data.model,
      usage: { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens },
      latencyMs: Date.now() - started,
    };
  }
}

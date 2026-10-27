import { CompletionRequest, CompletionResult, LLMClient } from './types.js';

export type ScriptedReply = string | ((request: CompletionRequest) => string);

/**
 * Deterministic client for tests and offline replays: returns the scripted
 * replies in order and records every request it received.
 */
export class ScriptedClient implements LLMClient {
  readonly provider = 'scripted';
  readonly requests: CompletionRequest[] = [];
  private cursor = 0;

  constructor(
    private readonly replies: ScriptedReply[],
    readonly model = 'scripted-model'
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    this.requests.push(request);
    if (this.cursor >= this.replies.length) {
      throw new Error(`ScriptedClient ran out of replies after ${this.cursor} call(s)`);
    }
    const reply = this.replies[this.cursor++];
    const text = typeof reply === 'function' ? reply(request) : reply;
    const prompt = request.messages.map(message => message.content).join('\n');
    return {
      text,
      model: this.model,
      // A rough 4-characters-per-token estimate keeps budget logic testable.
      usage: {
        inputTokens: Math.ceil(((request.system ?? '').length + prompt.length) / 4),
        outputTokens: Math.ceil(text.length / 4),
      },
      latencyMs: 0,
    };
  }
}

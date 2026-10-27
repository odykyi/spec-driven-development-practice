import { describe, it, expect, vi } from 'vitest';
import { AnthropicClient } from '../llm/anthropic.js';
import { parseCliOutput, renderTranscript } from '../llm/claude-cli.js';
import { createClient } from '../llm/factory.js';
import { OpenAICompatibleClient } from '../llm/openai-compatible.js';
import { parseRetryAfter, withRetry } from '../llm/retry.js';
import { extractSpecMarkdown } from '../spec/extract.js';
import { LLMError } from '../llm/types.js';

const noSleep = { sleep: async () => undefined };

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('withRetry', () => {
  it('retries retryable errors and then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new LLMError('overloaded', 529, true))
      .mockResolvedValueOnce('ok');
    await expect(withRetry(fn, noSleep)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('surfaces non-retryable errors immediately', async () => {
    const fn = vi.fn().mockRejectedValue(new LLMError('bad key', 401, false));
    await expect(withRetry(fn, noSleep)).rejects.toThrow('bad key');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('gives up after the retry limit', async () => {
    const fn = vi.fn().mockRejectedValue(new LLMError('rate limited', 429, true));
    await expect(withRetry(fn, { ...noSleep, retries: 2 })).rejects.toThrow('rate limited');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('waits for the retry-after hint when given', async () => {
    const sleep = vi.fn(async () => undefined);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new LLMError('slow down', 429, true, 1500))
      .mockResolvedValueOnce('ok');
    await withRetry(fn, { sleep });
    expect(sleep).toHaveBeenCalledWith(1500);
  });

  it('parses retry-after seconds', () => {
    expect(parseRetryAfter('3')).toBe(3000);
    expect(parseRetryAfter(null)).toBeUndefined();
  });
});

describe('AnthropicClient', () => {
  it('posts a Messages API request and joins text blocks', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        model: 'claude-test',
        content: [
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'world' },
        ],
        usage: { input_tokens: 12, output_tokens: 3 },
      })
    );
    const client = new AnthropicClient({ apiKey: 'test-key', model: 'claude-test', fetchImpl });
    const result = await client.complete({
      system: 'be brief',
      messages: [{ role: 'user', content: 'hi' }],
      maxTokens: 64,
    });

    expect(result).toMatchObject({
      text: 'Hello world',
      usage: { inputTokens: 12, outputTokens: 3 },
    });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('test-key');
    expect(JSON.parse(init.body as string)).toMatchObject({ system: 'be brief', max_tokens: 64 });
  });

  it('marks 429 responses retryable with the retry-after delay', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ error: 'rate' }, 429, { 'retry-after': '2' })
    );
    const client = new AnthropicClient({
      apiKey: 'k',
      model: 'm',
      fetchImpl,
      retry: { retries: 0, ...noSleep },
    });
    const error = await client
      .complete({ messages: [{ role: 'user', content: 'x' }] })
      .catch(e => e);
    expect(error).toMatchObject({ status: 429, retryable: true, retryAfterMs: 2000 });
  });
});

describe('OpenAICompatibleClient', () => {
  it('prepends the system prompt and reads chat completion usage', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        model: 'qwen3:8b',
        choices: [{ message: { content: 'spec' } }],
        usage: { prompt_tokens: 20, completion_tokens: 5 },
      })
    );
    const client = new OpenAICompatibleClient({ model: 'qwen3:8b', fetchImpl });
    const result = await client.complete({
      system: 'sys',
      messages: [{ role: 'user', content: 'u' }],
    });

    expect(result).toMatchObject({ text: 'spec', usage: { inputTokens: 20, outputTokens: 5 } });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/v1/chat/completions');
    expect(JSON.parse(init.body as string).messages[0]).toEqual({ role: 'system', content: 'sys' });
  });
});

describe('Claude CLI helpers', () => {
  it('replays earlier turns as a tagged transcript', () => {
    const prompt = renderTranscript([
      { role: 'user', content: 'draft' },
      { role: 'assistant', content: 'v1' },
      { role: 'user', content: 'fix it' },
    ]);
    expect(prompt).toContain('<assistant_turn>\nv1\n</assistant_turn>');
    expect(prompt.trim().endsWith('<user_turn>\nfix it\n</user_turn>')).toBe(true);
  });

  it('sends a single turn verbatim', () => {
    expect(renderTranscript([{ role: 'user', content: 'only' }])).toBe('only');
  });

  it('parses JSON output after stray log lines', () => {
    expect(parseCliOutput('warning: x\n{"result":"ok","total_cost_usd":0.01}')).toMatchObject({
      result: 'ok',
      total_cost_usd: 0.01,
    });
  });
});

describe('createClient', () => {
  it('requires an API key for the anthropic provider', () => {
    expect(() => createClient({ provider: 'anthropic', env: {} })).toThrow('ANTHROPIC_API_KEY');
  });

  it('defaults models per provider', () => {
    expect(createClient({ provider: 'openai-compatible', env: {} }).model).toBe('qwen3:8b');
  });
});

describe('extractSpecMarkdown', () => {
  it('prefers the fenced block that holds requirements over small examples', () => {
    const reply = [
      'Example format:',
      '```markdown',
      '- **WHEN** x',
      '```',
      'Spec:',
      '```markdown',
      '# Title',
      '### Requirement: R',
      'The system SHALL work.',
      '```',
    ].join('\n');
    expect(extractSpecMarkdown(reply)).toBe(
      '# Title\n### Requirement: R\nThe system SHALL work.\n'
    );
  });

  it('falls back to the reply from its first heading when there is no fence', () => {
    expect(extractSpecMarkdown('Sure!\n# Title\n### Requirement: R\n')).toBe(
      '# Title\n### Requirement: R\n'
    );
  });
});

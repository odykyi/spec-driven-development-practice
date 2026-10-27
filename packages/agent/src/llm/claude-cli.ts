import { spawn } from 'child_process';
import { ChatMessage, CompletionRequest, CompletionResult, LLMClient, LLMError } from './types.js';
import { withRetry, RetryOptions } from './retry.js';

export interface ClaudeCliOptions {
  model: string;
  binary?: string;
  timeoutMs?: number;
  retry?: RetryOptions;
}

interface ClaudeCliJson {
  result?: string;
  is_error?: boolean;
  duration_ms?: number;
  total_cost_usd?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

/**
 * Runs completions through a locally signed-in Claude Code CLI (`claude -p`), so the
 * eval works without an API key. Tools, MCP servers, settings and session storage are
 * all disabled: the CLI is used as a plain text-in, text-out model endpoint.
 */
export class ClaudeCliClient implements LLMClient {
  readonly provider = 'claude-cli';
  readonly model: string;

  constructor(private readonly options: ClaudeCliOptions) {
    this.model = options.model;
  }

  complete(request: CompletionRequest): Promise<CompletionResult> {
    return withRetry(() => this.once(request), this.options.retry);
  }

  private once(request: CompletionRequest): Promise<CompletionResult> {
    const args = [
      '-p',
      '--output-format',
      'json',
      '--model',
      this.model,
      '--tools',
      '',
      '--strict-mcp-config',
      '--setting-sources',
      '',
      '--no-session-persistence',
    ];
    if (request.system) {
      args.push('--system-prompt', request.system);
    }

    const started = Date.now();
    return new Promise((resolve, reject) => {
      const child = spawn(this.options.binary ?? 'claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new LLMError('claude CLI timed out', undefined, true));
      }, this.options.timeoutMs ?? 300000);

      child.stdout.on('data', chunk => (stdout += chunk));
      child.stderr.on('data', chunk => (stderr += chunk));
      child.on('error', error => {
        clearTimeout(timer);
        reject(new LLMError(`claude CLI failed to start: ${error.message}`));
      });
      child.on('close', code => {
        clearTimeout(timer);
        try {
          const json = parseCliOutput(stdout);
          if (code !== 0 || json.is_error) {
            throw new LLMError(
              `claude CLI exited ${code}: ${(json.result ?? stderr).slice(0, 500)}`,
              undefined,
              true
            );
          }
          const usage = json.usage ?? {};
          resolve({
            text: json.result ?? '',
            model: this.model,
            usage: {
              inputTokens:
                (usage.input_tokens ?? 0) +
                (usage.cache_creation_input_tokens ?? 0) +
                (usage.cache_read_input_tokens ?? 0),
              outputTokens: usage.output_tokens ?? 0,
            },
            latencyMs: json.duration_ms ?? Date.now() - started,
            costUsd: json.total_cost_usd,
          });
        } catch (error) {
          reject(
            error instanceof LLMError
              ? error
              : new LLMError(`claude CLI returned unreadable output: ${stderr.slice(0, 300)}`)
          );
        }
      });

      child.stdin.end(renderTranscript(request.messages));
    });
  }
}

/** The CLI takes one prompt, so earlier turns are replayed as a tagged transcript. */
export function renderTranscript(messages: ChatMessage[]): string {
  if (messages.length === 1) {
    return messages[0].content;
  }
  const turns = messages.map(
    message => `<${message.role}_turn>\n${message.content}\n</${message.role}_turn>`
  );
  return [
    'This is a multi-turn conversation. Earlier turns are replayed below; reply to the final user turn only.',
    '',
    ...turns,
  ].join('\n');
}

/** The CLI prints one JSON object on stdout; tolerate leading log lines. */
export function parseCliOutput(stdout: string): ClaudeCliJson {
  const start = stdout.indexOf('{');
  if (start === -1) {
    throw new Error('no JSON object in claude CLI output');
  }
  return JSON.parse(stdout.slice(start)) as ClaudeCliJson;
}

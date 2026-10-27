import { AnthropicClient } from './anthropic.js';
import { ClaudeCliClient } from './claude-cli.js';
import { OpenAICompatibleClient } from './openai-compatible.js';
import { LLMClient } from './types.js';

export type ProviderName = 'anthropic' | 'claude-cli' | 'openai-compatible';

export interface ClientConfig {
  provider: ProviderName;
  model?: string;
  baseUrl?: string;
  env?: NodeJS.ProcessEnv;
}

const DEFAULT_MODELS: Record<ProviderName, string> = {
  anthropic: 'claude-haiku-5-5',
  'claude-cli': 'claude-haiku-5-5',
  'openai-compatible': 'qwen3:8b',
};

export function createClient(config: ClientConfig): LLMClient {
  const env = config.env ?? process.env;
  const model = config.model ?? DEFAULT_MODELS[config.provider];

  switch (config.provider) {
    case 'anthropic': {
      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not set (or use --provider claude-cli)');
      }
      return new AnthropicClient({ apiKey, model, baseUrl: config.baseUrl });
    }
    case 'claude-cli':
      return new ClaudeCliClient({ model });
    case 'openai-compatible':
      return new OpenAICompatibleClient({
        model,
        baseUrl: config.baseUrl ?? env.OPENAI_BASE_URL,
        apiKey: env.OPENAI_API_KEY,
      });
    default:
      throw new Error(`Unknown provider: ${config.provider satisfies never}`);
  }
}

export function isProviderName(value: string): value is ProviderName {
  return value in DEFAULT_MODELS;
}

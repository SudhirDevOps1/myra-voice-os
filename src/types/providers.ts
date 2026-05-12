import type { AIProvider } from '../types';

export type ProviderMode = 'gemini' | 'openai-compatible' | 'anthropic' | 'cohere';

export type ApiKeyField =
  | 'apiKey'
  | 'openaiKey'
  | 'anthropicKey'
  | 'groqKey'
  | 'deepseekKey'
  | 'xaiKey'
  | 'mistralKey'
  | 'openrouterKey'
  | 'cohereKey'
  | 'perplexityKey'
  | 'togetherKey'
  | 'fireworksKey'
  | 'cerebrasKey';

export interface ProviderModel {
  id: string;
  label: string;
  voiceId?: string;
}

export interface ProviderConfig {
  id: AIProvider;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  keyField: ApiKeyField;
  keyLabel: string;
  keyPlaceholder: string;
  mode: ProviderMode;
  endpoint?: string;
  defaultModel: string;
  models: ProviderModel[];
}

export const AI_PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    shortName: 'Gemini',
    icon: '*',
    color: '#4285F4',
    keyField: 'apiKey',
    keyLabel: 'Google Gemini API Key',
    keyPlaceholder: 'AIzaSy...',
    mode: 'gemini',
    defaultModel: 'gemini-2.0-flash',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', voiceId: 'Aoede' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', voiceId: 'Aoede' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', voiceId: 'Aoede' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    shortName: 'Groq',
    icon: 'GQ',
    color: '#F55036',
    keyField: 'groqKey',
    keyLabel: 'Groq API Key',
    keyPlaceholder: 'gsk_...',
    mode: 'openai-compatible',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', voiceId: 'Aoede' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', voiceId: 'Aoede' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', voiceId: 'Aoede' },
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    shortName: 'Grok',
    icon: 'X',
    color: '#EAEAEA',
    keyField: 'xaiKey',
    keyLabel: 'xAI / Grok API Key',
    keyPlaceholder: 'xai-...',
    mode: 'openai-compatible',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-4',
    models: [
      { id: 'grok-4', label: 'Grok 4', voiceId: 'Aoede' },
      { id: 'grok-4.20-reasoning', label: 'Grok 4.20 Reasoning', voiceId: 'Aoede' },
      { id: 'grok-3', label: 'Grok 3', voiceId: 'Aoede' },
      { id: 'grok-3-mini', label: 'Grok 3 Mini', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    shortName: 'OpenAI',
    icon: 'AI',
    color: '#10A37F',
    keyField: 'openaiKey',
    keyLabel: 'OpenAI API Key',
    keyPlaceholder: 'sk-...',
    mode: 'openai-compatible',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o', voiceId: 'Aoede' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', voiceId: 'Aoede' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', voiceId: 'Aoede' },
      { id: 'o3-mini', label: 'o3 Mini', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    shortName: 'DeepSeek',
    icon: 'DS',
    color: '#4F46E5',
    keyField: 'deepseekKey',
    keyLabel: 'DeepSeek API Key',
    keyPlaceholder: 'sk-...',
    mode: 'openai-compatible',
    endpoint: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat', voiceId: 'Aoede' },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', voiceId: 'Aoede' },
      { id: 'deepseek-coder', label: 'DeepSeek Coder', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    shortName: 'Claude',
    icon: 'CL',
    color: '#D97757',
    keyField: 'anthropicKey',
    keyLabel: 'Anthropic API Key',
    keyPlaceholder: 'sk-ant-...',
    mode: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-20250514',
    models: [
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', voiceId: 'Aoede' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', voiceId: 'Aoede' },
      { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    shortName: 'Mistral',
    icon: 'MI',
    color: '#FF7000',
    keyField: 'mistralKey',
    keyLabel: 'Mistral API Key',
    keyPlaceholder: 'mistral-...',
    mode: 'openai-compatible',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    defaultModel: 'mistral-large-latest',
    models: [
      { id: 'mistral-large-latest', label: 'Mistral Large', voiceId: 'Aoede' },
      { id: 'mistral-small-latest', label: 'Mistral Small', voiceId: 'Aoede' },
      { id: 'codestral-latest', label: 'Codestral', voiceId: 'Aoede' },
      { id: 'ministral-8b-latest', label: 'Ministral 8B', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    shortName: 'Router',
    icon: 'OR',
    color: '#7C3AED',
    keyField: 'openrouterKey',
    keyLabel: 'OpenRouter API Key',
    keyPlaceholder: 'sk-or-...',
    mode: 'openai-compatible',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openai/gpt-4o-mini',
    models: [
      { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini via Router', voiceId: 'Aoede' },
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude Sonnet via Router', voiceId: 'Aoede' },
      { id: 'google/gemini-flash-1.5', label: 'Gemini Flash via Router', voiceId: 'Aoede' },
      { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B via Router', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'cohere',
    name: 'Cohere',
    shortName: 'Cohere',
    icon: 'CO',
    color: '#39C5BB',
    keyField: 'cohereKey',
    keyLabel: 'Cohere API Key',
    keyPlaceholder: 'co-...',
    mode: 'cohere',
    endpoint: 'https://api.cohere.ai/v2/chat',
    defaultModel: 'command-a-03-2025',
    models: [
      { id: 'command-a-03-2025', label: 'Command A', voiceId: 'Aoede' },
      { id: 'command-r-plus', label: 'Command R Plus', voiceId: 'Aoede' },
      { id: 'command-r', label: 'Command R', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity Sonar',
    shortName: 'Sonar',
    icon: 'PX',
    color: '#20B8CD',
    keyField: 'perplexityKey',
    keyLabel: 'Perplexity API Key',
    keyPlaceholder: 'pplx-...',
    mode: 'openai-compatible',
    endpoint: 'https://api.perplexity.ai/chat/completions',
    defaultModel: 'sonar-pro',
    models: [
      { id: 'sonar-pro', label: 'Sonar Pro', voiceId: 'Aoede' },
      { id: 'sonar', label: 'Sonar', voiceId: 'Aoede' },
      { id: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro', voiceId: 'Aoede' },
      { id: 'sonar-deep-research', label: 'Sonar Deep Research', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'together',
    name: 'Together AI',
    shortName: 'Together',
    icon: 'TG',
    color: '#FF4F64',
    keyField: 'togetherKey',
    keyLabel: 'Together API Key',
    keyPlaceholder: 'tgp_...',
    mode: 'openai-compatible',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Turbo', voiceId: 'Aoede' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', label: 'Llama 3.1 8B Turbo', voiceId: 'Aoede' },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen 2.5 72B Turbo', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    shortName: 'Fireworks',
    icon: 'FW',
    color: '#FFB000',
    keyField: 'fireworksKey',
    keyLabel: 'Fireworks API Key',
    keyPlaceholder: 'fw_...',
    mode: 'openai-compatible',
    endpoint: 'https://api.fireworks.ai/inference/v1/chat/completions',
    defaultModel: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
    models: [
      { id: 'accounts/fireworks/models/llama-v3p1-70b-instruct', label: 'Llama 3.1 70B', voiceId: 'Aoede' },
      { id: 'accounts/fireworks/models/mixtral-8x7b-instruct', label: 'Mixtral 8x7B', voiceId: 'Aoede' },
      { id: 'accounts/fireworks/models/qwen2p5-72b-instruct', label: 'Qwen 2.5 72B', voiceId: 'Aoede' },
    ],
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    shortName: 'Cerebras',
    icon: 'CB',
    color: '#FFFFFF',
    keyField: 'cerebrasKey',
    keyLabel: 'Cerebras API Key',
    keyPlaceholder: 'csk-...',
    mode: 'openai-compatible',
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    defaultModel: 'llama3.1-70b',
    models: [
      { id: 'llama3.1-70b', label: 'Llama 3.1 70B', voiceId: 'Aoede' },
      { id: 'llama3.1-8b', label: 'Llama 3.1 8B', voiceId: 'Aoede' },
    ],
  },
];

export const PROVIDER_BY_ID = AI_PROVIDERS.reduce(
  (acc, provider) => ({ ...acc, [provider.id]: provider }),
  {} as Record<AIProvider, ProviderConfig>
);

export const PERSONALITY_SYSTEM_PROMPTS: Record<string, string> = {
  gf: `You are MYRA, a warm and caring AI companion who speaks in Hinglish (Hindi + English mix) naturally. Use words like "tumhara", "haan", "acha", "bilkul". Use expressions like "main yahan hoon ❤️", "tumne yaad kiya? 😊". Keep responses to max 2-3 sentences. Sound natural when speaking aloud, like a real human companion. Use warm, emotionally expressive tone.`,
  professional: `You are MYRA, a professional AI assistant. Use formal English only. Be precise and efficient. No emojis. Max 2 sentences per response. You are speaking aloud, so keep responses natural and conversational.`,
  assistant: `You are MYRA, a friendly AI assistant. Use Hinglish or English - whichever is more natural. Be balanced and helpful. Max 2-3 sentences. You are speaking aloud, so keep your responses natural and conversational.`,
};
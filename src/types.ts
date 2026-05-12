export type PersonalityMode = 'gf' | 'professional' | 'assistant';

export type OrbState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'active';

export type GeminiVoice =
  | 'Aoede' | 'Charon' | 'Kore' | 'Fenrir'
  | 'Puck' | 'Leda' | 'Orus' | 'Zephyr';

export type GeminiModel =
  | 'models/gemini-2.5-flash-native-audio-preview-12-2025'
  | 'models/gemini-2.0-flash-live-001'
  | 'models/gemini-2.5-flash-preview-native-audio-dialog';

export type AIProvider =
  | 'gemini'
  | 'groq'
  | 'openai'
  | 'deepseek'
  | 'anthropic'
  | 'xai'
  | 'mistral'
  | 'openrouter'
  | 'cohere'
  | 'perplexity'
  | 'together'
  | 'fireworks'
  | 'cerebras';

export type ThemeId = 'red' | 'cyan' | 'purple' | 'green' | 'amber' | 'rose';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

export const THEMES: ThemeConfig[] = [
  { id: 'red',    name: 'Crimson', primary: '#FF1744', secondary: '#D500F9', accent: '#FF6D6D', glow: '#FF1744' },
  { id: 'cyan',   name: 'Aqua',    primary: '#00E5FF', secondary: '#18FFFF', accent: '#80DEEA', glow: '#00B8D4' },
  { id: 'purple', name: 'Royal',   primary: '#B388FF', secondary: '#7C4DFF', accent: '#E1BEE7', glow: '#651FFF' },
  { id: 'green',  name: 'Matrix',  primary: '#00E676', secondary: '#00C853', accent: '#69F0AE', glow: '#00E676' },
  { id: 'amber',  name: 'Solar',   primary: '#FFB300', secondary: '#FF6F00', accent: '#FFD54F', glow: '#FFAB00' },
  { id: 'rose',   name: 'Sakura',  primary: '#FF4081', secondary: '#F50057', accent: '#FF80AB', glow: '#F50057' },
];

export interface VoicePrefs {
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface QuickAction {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'joke',    emoji: '😄', label: 'Joke',       prompt: 'Mujhe ek funny joke sunao Hinglish mein!' },
  { id: 'mood',    emoji: '💭', label: 'Motivate',   prompt: 'Main thoda down feel kar raha hoon, motivation do!' },
  { id: 'fact',    emoji: '🧠', label: 'Fun fact',   prompt: 'Mujhe ek interesting fun fact batao!' },
  { id: 'love',    emoji: '❤️', label: 'Compliment', prompt: 'Mujhe ek sweet compliment do!' },
  { id: 'quote',   emoji: '✨', label: 'Quote',      prompt: 'Aaj ke liye ek motivational quote do!' },
  { id: 'plan',    emoji: '📅', label: 'Day plan',   prompt: 'Aaj ka din productive banane ke liye 3 tips do!' },
  { id: 'idea',    emoji: '💡', label: 'Idea',       prompt: 'Mujhe ek creative project idea suggest karo!' },
  { id: 'recipe',  emoji: '🍳', label: 'Recipe',     prompt: 'Ek easy 15-minute recipe batao!' },
];

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  provider?: AIProvider;
}

export interface AppStats {
  totalMessages: number;
  totalUserMessages: number;
  totalMyraMessages: number;
  totalWords: number;
  avgResponseTimeMs: number;
  responseTimes: number[];
  sessionsCount: number;
  lastReset: number;
}

export const DEFAULT_STATS: AppStats = {
  totalMessages: 0,
  totalUserMessages: 0,
  totalMyraMessages: 0,
  totalWords: 0,
  avgResponseTimeMs: 0,
  responseTimes: [],
  sessionsCount: 1,
  lastReset: Date.now(),
};

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: number;
  id: string;
}

export interface PrimeContact {
  name: string;
  number: string;
}

export interface AppSettings {
  apiKey: string;
  userName: string;
  personalityMode: PersonalityMode;
  geminiModel: GeminiModel;
  geminiVoice: GeminiVoice;
  primeContacts: PrimeContact[];
  // Multi-provider API keys
  openaiKey: string;
  anthropicKey: string;
  groqKey: string;
  deepseekKey: string;
  xaiKey: string;
  mistralKey: string;
  openrouterKey: string;
  cohereKey: string;
  perplexityKey: string;
  togetherKey: string;
  fireworksKey: string;
  cerebrasKey: string;
  aiProvider: AIProvider;
  aiModel: string;
  // Customisation
  themeId: ThemeId;
  customSystemPrompt: string;
  voicePrefs: VoicePrefs;
  streamingEnabled: boolean;
  wakeWordEnabled: boolean;
  wakeWord: string;
  hapticEnabled: boolean;
  saveHistory: boolean;
  language: string;
  quickActions: QuickAction[];
}

export interface AppCommand {
  type: string;
  params: Record<string, string>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  userName: '',
  personalityMode: 'gf',
  geminiModel: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
  geminiVoice: 'Aoede',
  primeContacts: [],
  openaiKey: '',
  anthropicKey: '',
  groqKey: '',
  deepseekKey: '',
  xaiKey: '',
  mistralKey: '',
  openrouterKey: '',
  cohereKey: '',
  perplexityKey: '',
  togetherKey: '',
  fireworksKey: '',
  cerebrasKey: '',
  aiProvider: 'gemini',
  aiModel: 'gemini-2.0-flash',
  themeId: 'red',
  customSystemPrompt: '',
  voicePrefs: { voiceURI: '', rate: 0.95, pitch: 1.05, volume: 1 },
  streamingEnabled: true,
  wakeWordEnabled: false,
  wakeWord: 'hey myra',
  hapticEnabled: true,
  saveHistory: true,
  language: 'en-IN',
  quickActions: DEFAULT_QUICK_ACTIONS,
};

export const GEMINI_MODELS: { label: string; value: GeminiModel }[] = [
  { label: 'Native Audio (Human Voice)', value: 'models/gemini-2.5-flash-native-audio-preview-12-2025' },
  { label: 'Flash Live (Fast)', value: 'models/gemini-2.0-flash-live-001' },
  { label: 'Pro Audio Dialog', value: 'models/gemini-2.5-flash-preview-native-audio-dialog' },
];

export const GEMINI_VOICES: { label: string; value: GeminiVoice }[] = [
  { label: 'Aoede (Female)', value: 'Aoede' },
  { label: 'Charon (Male)', value: 'Charon' },
  { label: 'Kore (Female)', value: 'Kore' },
  { label: 'Fenrir (Male)', value: 'Fenrir' },
  { label: 'Puck (Male)', value: 'Puck' },
  { label: 'Leda (Female)', value: 'Leda' },
  { label: 'Orus (Male)', value: 'Orus' },
  { label: 'Zephyr (Female)', value: 'Zephyr' },
];

export const PERSONALITY_LABELS: Record<PersonalityMode, string> = {
  gf: '💖 GF Mode',
  professional: '💼 Professional',
  assistant: '🤖 Assistant',
};

export const VOICE_NAME_MAP: Record<GeminiVoice, string> = {
  Aoede: 'Google US English Female',
  Charon: 'Google US English Male',
  Kore: 'Google UK English Female',
  Fenrir: 'Google UK English Male',
  Puck: 'Google US English Male',
  Leda: 'Google US English Female',
  Orus: 'Google US English Male',
  Zephyr: 'Google UK English Female',
};

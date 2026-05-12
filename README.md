# MYRA — Multi-Provider AI Voice Assistant

**MYRA** is a highly conversational, multi-provider AI Voice Assistant built with React, Vite, and Tailwind CSS. It supports **13 different AI engines**, features custom canvas orb animations, real-time audio waveforms, a voice-based command parser, persistent session history, long-term memory, wake-word detection, and offline capabilities.

---

## 🎯 Project Identity & Design
- **Name:** MYRA
- **Personality:** 3 modes: GF Mode (Hinglish, warm, caring) 💖, Professional Mode (formal English) 💼, and Assistant Mode (friendly Hinglish/English) 🤖.
- **Visuals:** Radial glow dark theme with real SVG icons and dynamically reactive Canvas Orb/Waveform.
- **Voice System:** Advanced Text-to-Speech (TTS) voice scorer that automatically selects the highest-quality natural voices available on the client device.

---

## 🚀 Quick Start

### 1. Requirements
- Node.js (v18+)
- npm or yarn

### 2. Installation
```bash
# Clone the repository and install packages
npm install
```

### 3. Running Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```
This will compile a completely inlined, production-ready, ultra-fast `dist/index.html` file containing all assets, SVGs, and styles.

---

## 📂 Documentation Directory
Explore the detailed master guides:
1. [**FEATURES.md**](./FEATURES.md) — Exhaustive features list, stats tracking, themes, and capabilities.
2. [**USES.md**](./USES.md) — Voice command dictionary, custom triggers, personality examples, and usage.
3. [**LIMIT.md**](./LIMIT.md) — Web browser capabilities, token limits, CORS workarounds, and wake word constraints.

---

## 🛠️ Multi-Engine Support
MYRA can connect directly to 13 major AI backends. Switch providers instantly via the **AI Provider** badge in the top bar:
- **Google Gemini** (Native Audio, Flash Live, Pro Audio)
- **Groq** (Llama 3.3, Mixtral, Gemma)
- **xAI Grok** (Grok 4, Grok 3)
- **OpenAI** (GPT-4o, GPT-4o Mini, o3-mini)
- **DeepSeek** (DeepSeek Chat, Reasoner, Coder)
- **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus)
- **Mistral AI** (Mistral Large, Mistral Small, Codestral)
- **OpenRouter** (Unified Router API)
- **Cohere** (Command R+, Command R)
- **Perplexity Sonar** (Search-augmented Sonar models)
- **Together AI** (Llama 3.3, Qwen 2.5)
- **Fireworks AI** (High-throughput open-weights)
- **Cerebras** (Ultra-low latency Llama)

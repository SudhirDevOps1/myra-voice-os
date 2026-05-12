# MYRA — Feature Catalog & Architecture

This document outlines every feature engineered into MYRA, detailing the technical specs and interactive systems.

---

## 🎨 Design & Customization

### 1. The Canvas Orb (`OrbAnimation.tsx`)
A custom HTML5 Canvas drawing loop with 7 rendered layers reactive to conversational state:
- **Idle State (Crimson):** Slow pulse (scale 1.0 ↔ 1.15) and radial glow breathing.
- **Listening State (Red):** Pulsing wave rings and high-frequency active rotation.
- **Speaking State (Purple):** Fast waves with amplitude-reactive particles scaling dynamically with voice output.
- **Thinking State (Cyan):** Two spinning load-arcs revolving in opposite directions.

### 2. Live Waveform (`WaveformView.tsx`)
- 20 vertical rounded bars.
- Live heights animated smoothly via Linear Interpolation (lerp): `height += (target - current) * 0.3`.
- Active scaling powered by the Web Audio API extracting real-time RMS amplitude from your microphone stream.

### 3. Theme Switcher (6 Accent Options)
Instantly shifts gradients, shadows, borders, scrollbars, text overlays, and the glowing orbs:
- 🔴 **Crimson (Default):** Warm romance, GF-mode vibe.
- 🔵 **Aqua:** Cold hacker style, high-tech assistant.
- 🟣 **Royal:** Dark neon purple magic.
- 🟢 **Matrix:** Tech-green terminal look.
- 🟡 **Solar:** Sunfire orange and deep yellow.
- 🌸 **Sakura:** Pastel rose and soft pink.

---

## 🧠 Brains & Memory Systems

### 1. Long-Term Memory (`useLongTermMemory.ts`)
- Automatically parses user speech patterns (e.g., *"my name is..."*, *"I like..."*, *"I live in..."*).
- Stores key user facts persistently in `localStorage`.
- Context is dynamically fed into fallback / demo prompts as long-term context.
- Dedicated **Memory Manager** panel allows you to review, search, and delete learned facts.

### 2. Chat Session History (`useChatHistory.ts`)
- Keeps up to 50 active conversational threads saved in browser memory.
- Sessions automatically get named based on the first query.
- Supports instant JSON and plain TXT file exports.

---

## ⚙️ Performance & Diagnostics

### 1. Cost & Token Tracker (`TokenTracker.tsx`)
- Tracks estimated token usage based on message character/word lengths.
- Real-time pricing models map estimated costs for each of the 13 providers.
- Displays request counters per provider in a nested breakdowns section.

### 2. Live Stats & Graphing (`StatsPanel.tsx`)
- Tracks user vs. MYRA message splits, words exchanged, and average response times.
- Renders an interactive bar graph showing latency trends over the last 30 requests.

---

## 🎙️ Smart TTS & Audio Systems

### 1. Audio Voice Scorer (`useTTS.ts`)
Standard browsers have dozens of robot-sounding TTS options. MYRA scans, ranks, and filters voices based on quality:
- Filters out generic voice synthesizers (`espeak`, `robot`, `synthesizer`).
- Favors advanced neural engines (`Natural`, `Microsoft`, `Google Female`).
- Pre-filters Markdown notation, emoji clusters, and code blocks before speaking to prevent robotic pronunciation (e.g., stops speaking raw asterisks, code blocks, or triple backticks).

### 2. Wake-word Detection (`useWakeWord.ts`)
- Low-overhead background voice loop listening for your custom wake phrase (Default: *"Hey MYRA"*).
- Triggers active microphone capture and auto-connects to selected provider.
- Includes a brief dual haptic buzz vibration upon wake trigger.

---

## 🔒 Utility & Data Portability

### 1. Keyboard Shortcuts
- **Ctrl + N:** New chat session
- **Ctrl + S:** System Settings panel
- **Ctrl + P:** Provider settings & API keys
- **Ctrl + T:** Customize theme & voice sliders
- **Ctrl + F:** Find messages in chat
- **Ctrl + L:** Instant toggle mic (listening)
- **Escape:** Close any active panel

### 2. Backup & Restore (`BackupPanel.tsx`)
- Fully export your complete MYRA database (conversations, stats, memory, custom prompts, and API keys) into a single portable `.json` backup file.
- Restore on any browser or device instantly by uploading the JSON backup file.

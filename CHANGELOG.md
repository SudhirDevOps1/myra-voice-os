# 📋 MYRA — Changelog

All notable changes to MYRA are documented here.

**Maintained by**: [Sudhir Singh](https://github.com/SudhirDevOps1) ([@SudhirDevOps1](https://github.com/SudhirDevOps1))

---

## [v2.5.1] — Live Deployment Audit Fix (Current)

### 🚨 Critical Bugs Fixed (Found via Live Audit of myra-voice-os.pages.dev)
- **Tools Dashboard buttons appeared unstyled** — the new dashboard used custom utility classes (`tool-btn`, `tool-input`, `mini-chip`, `card`) that were never defined in `index.css`. Added all four utility classes plus `animate-fadeIn` and `line-clamp-*` so every Tools panel renders correctly.
- **Page title was outdated** — old title "10+ Providers" replaced with "MYRA — AI Voice Assistant OS | 13 Providers · 16 Tools · By Sudhir Singh".
- **Open Graph + author meta tags added** — for social link previews.
- **Transit API failed in browser** (`transport.rest` lacks CORS) — switched to `v6.db.transport.rest` mirror with OpenStreetMap Nominatim fallback.
- **IP Location single point of failure** — added 3-tier fallback chain: ipapi.co → ipwho.is → ipify (always returns at minimum the IP).
- **DevToolBox AI generate button could throw** — wrapped in try/catch with friendly fallback message.
- **DevToolBox Fix Code clarity** — improved error description sent with payload.

### ✅ Verified Working After Fix
- All 16 Tools tabs render with full styling
- Sports/News/Currency/User/Colors/Universities/Research/Dictionary/Movies/Trivia/NASA/Music tools confirmed live
- Calculator (35+ formulas) accessible from main action chip
- Demo Call simulator with Priya/Boss/Mom presets
- Read-aloud button on every chat message
- Footer with Sudhir Singh + GitHub @SudhirDevOps1 branding intact

---

## [v2.5.0] — Production Ready

### 🎉 Major Updates
- **Production-Grade Footer** — Beautiful, branded footer with Sudhir Singh credentials, GitHub links, theme-matching gradient, taglines, and responsive layout
- **Polished UI/UX** — Refined chat bubbles with theme-tinted backgrounds, improved spacing, better mobile responsiveness
- **Enhanced Top Bar** — Glow effect on MYRA logo, better tracking, "AI · Voice · OS" subtitle
- **Improved ActionChip** — Larger touch targets, hover scale effects, better mobile visibility
- **Calculator (35+ Formulas)** — New comprehensive calculator with Health, Finance, Math, Physics, Conversion, Date categories
- **Tools Dashboard Expanded** — 12 free tools including Universities, Research Papers, Dictionary, Trivia, NASA APOD, Music
- **Read Aloud Button** — 🔊 button on every chat message
- **All .md Files Refreshed** — README, FEATURES, USES, LIMITATIONS, CONTRIBUTING, CHANGELOG fully updated

### 🐛 Bug Fixes
- IP Location now uses HTTPS (ipapi.co) — was failing on HTTPS sites
- News API has triple fallback (gnews → BBC RSS → static headlines)
- Sports API gracefully falls back to demo scores
- Universities API switched from HTTP to HTTPS
- TypeScript implicit `any` errors fixed in Calculator
- Duplicate Calculator chip icon resolved (🧮 instead of ⚙️)
- Footer no longer overlaps with demo button

### ⚡ Performance
- Build size: 472.47 KB (133.29 KB gzipped)
- Modules: 64
- Build time: <2s

---

## [v2.4.0] — January 2026

### Added
- **Footer with Branding** — Sudhir Singh credentials with GitHub link
- **MD Documentation** — README, FEATURES, USES, LIMITATIONS, CONTRIBUTING, CHANGELOG
- **Read Aloud Button** in chat messages

### Fixed
- Audio engine refs stability
- Wake word language detection
- Duplicate variable declarations

---

## [v2.3.0] — January 2026

### Added
- **20+ Models per Provider** — Gemini, Groq, OpenAI, Claude, etc. now have 20+ models each
- **Model Search** — Filter through 250+ models
- **Free Model Badges** — Identify free-tier models
- **Auto-Validate Default Model** — Falls back if selected model unavailable
- **Hindi/English Strict Language Lock** — System prompt enforces response language

### Fixed
- API key validation now actually tests with real API call
- Auto-reconnect on provider/model/key change
- Greeting fires only once per successful connection

---

## [v2.2.0] — January 2026

### Added
- **Hindi/English Voice Toggle** — One-click language switch
- **8 Voice Profiles** — Aoede, Kore, Leda, Zephyr, Charon, Fenrir, Puck, Orus
- **Long Text Chunking** — TTS splits at sentence boundaries
- **Emoji Stripping** — Clean text before TTS speaks
- **Wake Word Variants** — "Hey MYRA", "Hi MYRA", "Ok MYRA", "मायरा", "हे मायरा"

### Fixed
- TTS sounds less robotic with smart voice scoring
- Wake word + main mic conflict resolved
- Mic tap responds instantly with touch-action: manipulation

---

## [v2.1.0] — December 2025

### Added
- **Weather Dashboard** — Free Open-Meteo + Nominatim
- **Tools Dashboard (7 tools)** — IP, Currency, Sports, News, User, Colors, Music
- **Fun Zone** — Jokes, Dog photos, Useless facts
- **Real SVG Logo** — Multiple favicon files
- **Connection State Badge** — Verifying/Connected/Failed/No Key

### Fixed
- API key validation with proper retry button
- Provider button shows live connection dot

---

## [v2.0.0] — November 2025

### Major Features
- **13 AI Providers** — Gemini, Groq, OpenAI, Claude, Grok, DeepSeek, Mistral, OpenRouter, Cohere, Perplexity, Together, Fireworks, Cerebras
- **Streaming Responses** — Real-time SSE
- **Multi-Session Chat** — Save, switch, export
- **Stats Panel** — Messages, words, response times
- **Token Tracker** — Per-provider cost
- **6 Themes** — Crimson, Aqua, Royal, Matrix, Solar, Sakura
- **Voice Picker** — All browser voices
- **Quick Actions** — 8 preset prompts
- **Markdown Rendering** — Code, bold, italic, lists
- **Custom System Prompt**
- **Wake Word Detection**
- **Long-Term Memory**
- **Backup/Restore**
- **Chat Search**
- **Keyboard Shortcuts** — 8 total
- **PWA Support** — Installable

---

## [v1.0.0] — October 2025

### Initial Release
- Google Gemini AI provider
- 3 personality modes (GF, Professional, Assistant)
- Hinglish + English conversation
- Voice recognition (Web Speech API)
- Text-to-speech
- Animated Canvas orb
- 20-bar waveform
- Chat with timestamps
- Voice command parser
- Prime contacts
- Settings persistence
- Demo mode
- Incoming call demo
- Mic button with long press
- Mute toggle
- Red overlay effect
- Dark theme

---

## 🔮 Coming in v2.6.0 (Q1 2026)

- 🚧 Compare Mode (side-by-side AI providers)
- 🚧 100+ more calculator formulas (target 500+)
- 🚧 Pin/bookmark messages
- 🚧 API proxy server option
- 🚧 More voice profiles

---

## 📊 Statistics

| Version | Files | Lines | Features | Build Size |
|---------|-------|-------|----------|------------|
| v1.0 | 25 | 3,000 | 35 | 280 KB |
| v2.0 | 38 | 6,500 | 95 | 350 KB |
| v2.3 | 40 | 8,500 | 120 | 380 KB |
| v2.5 | 40 | 10,500 | 150+ | 472 KB |

---

## 🙏 Acknowledgments

Special thanks to:
- **Open-Meteo** — Free weather API
- **OpenAlex** — Free research papers (250M+)
- **Wikipedia** — Free encyclopedia API
- **Open Trivia DB** — Free quiz API
- **Hipolabs Universities** — Free university data
- **NASA** — Astronomy Picture of the Day
- **Google AI** — Gemini SDK
- All free API providers making MYRA possible

---

**Built with ❤️ by [Sudhir Singh](https://github.com/SudhirDevOps1)** • [@SudhirDevOps1](https://github.com/SudhirDevOps1)

Made in 🇮🇳 India

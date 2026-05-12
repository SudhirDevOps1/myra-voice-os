# LIMIT.md — Browser & API Limits Guide

Because MYRA runs inside a web sandbox (browser application), certain hardware and network security rules apply differently compared to a native Android app.

---

## 🌐 1. Browser CORS Restrictions (Crucial)
When calling APIs directly from a front-end React app, some AI backends might reject requests due to Cross-Origin Resource Sharing (CORS) rules.

### Workarounds
- **Google Gemini SDK:** Fully supports direct browser requests if a valid key is provided.
- **Anthropic Claude:** Direct browser calls are enabled by default through the `anthropic-dangerous-direct-browser-access` header.
- **Other Providers (OpenAI, DeepSeek, Groq, etc.):** 
  - If a provider's gateway blocks CORS requests, use an API gateway/proxy (like Cloudflare Workers, a custom express backend, or OpenRouter).
  - OpenRouter is highly recommended for web browsers as it handles CORS natively.

---

## 🎙️ 2. Wake-word & Mic Capture Limits
- **Continuous Mic Capture:** Web-speech API's continuous recognition has varying idle timeout limits on different browsers. If you don't speak for a few minutes, the mic might auto-pause.
- **HTTPS Only:** Browsers will only allow mic access if the page is hosted over a secure connection (`https://`) or `localhost`.
- **System Commands:** Direct control of hardware like turning physical WiFi cards on/off or toggle-triggering actual Android torchlights is sandboxed inside web-apps. MYRA simulates these actions and gives voice-confirmations of what would occur on the device.

---

## ⚡ 3. Rate Limits & Token Caps
- **Max Input Length:** MYRA is optimized with a context slice mechanism to remember the last 12 messages.
- **Max Response Tokens:** Outbound responses are capped at `256` tokens to keep text-to-speech feedback highly snappy and human-like.
- **Rate Limits:** Depending on your selected model and tier (free vs pay-go), providers like Groq or Gemini might rate-limit you if you send more than 15 messages/minute.

---

## 🔊 4. Text-to-Speech Quality
- The quality of MYRA's voice output depends entirely on the voices installed on your operating system.
- On Windows/Android, highly realistic neural voices (from Microsoft/Google) are preferred by MYRA. On iOS/macOS, Apple's vocal synthesizers will be prioritized.

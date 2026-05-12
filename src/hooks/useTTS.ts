import { useCallback, useEffect, useState } from 'react';
import type { VoicePrefs } from '../types';

function normalizeSpeechText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    // Thoroughly remove all emojis, smileys, symbols, hearts, flags, and pictographs so TTS never reads them aloud
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u{1F300}-\u{1FAFF}\u2600-\u26FF\u2700-\u27BF]/gu, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
}

interface VoiceProfile {
  rate: number;
  pitch: number;
  preferGender: 'female' | 'male' | 'any';
  preferKeywords: string[];
}

// Voice profile mapping — different voice IDs get different acoustic properties
const VOICE_PROFILES: Record<string, VoiceProfile> = {
  Aoede:  { rate: 0.95, pitch: 1.10, preferGender: 'female', preferKeywords: ['aria', 'jenny', 'samantha', 'female'] },
  Kore:   { rate: 0.92, pitch: 1.15, preferGender: 'female', preferKeywords: ['neural', 'aria', 'female'] },
  Leda:   { rate: 1.00, pitch: 1.05, preferGender: 'female', preferKeywords: ['samantha', 'jenny', 'female'] },
  Zephyr: { rate: 0.93, pitch: 1.20, preferGender: 'female', preferKeywords: ['zira', 'aria', 'female'] },
  Charon: { rate: 0.95, pitch: 0.85, preferGender: 'male',   preferKeywords: ['daniel', 'fred', 'guy', 'male'] },
  Fenrir: { rate: 0.90, pitch: 0.80, preferGender: 'male',   preferKeywords: ['daniel', 'guy', 'tom', 'male'] },
  Puck:   { rate: 1.05, pitch: 0.95, preferGender: 'male',   preferKeywords: ['fred', 'aaron', 'male'] },
  Orus:   { rate: 0.92, pitch: 0.88, preferGender: 'male',   preferKeywords: ['guy', 'daniel', 'tom', 'male'] },
};

function scoreVoice(voice: SpeechSynthesisVoice, preferredLang: string, profile: VoiceProfile) {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  let score = 0;

  // Language match (highest priority)
  const langLower = voice.lang.toLowerCase();
  if (preferredLang === 'hi') {
    if (langLower.startsWith('hi')) score += 200;
    else if (langLower.includes('hi')) score += 100;
    else score -= 50; // Penalize non-Hindi heavily
  } else {
    if (langLower.startsWith('en')) score += 200;
    else if (langLower.includes('en')) score += 100;
    else score -= 50;
  }

  // Quality scoring
  if (name.includes('google')) score += 30;
  if (name.includes('microsoft')) score += 25;
  if (name.includes('apple')) score += 25;
  if (name.includes('natural')) score += 20;
  if (name.includes('neural')) score += 18;
  if (name.includes('premium')) score += 15;
  if (name.includes('enhanced')) score += 12;
  if (name.includes('online')) score += 10;

  // Gender preference
  if (profile.preferGender === 'female') {
    if (name.includes('female') || name.includes('woman')) score += 30;
    if (name.includes('male') && !name.includes('female')) score -= 15;
  } else if (profile.preferGender === 'male') {
    if (name.includes('male') && !name.includes('female')) score += 30;
    if (name.includes('female')) score -= 15;
  }

  // Voice-specific keyword preferences
  for (const kw of profile.preferKeywords) {
    if (name.includes(kw)) score += 15;
  }

  // Hindi-specific good voices
  if (preferredLang === 'hi') {
    if (name.includes('lekha')) score += 25;
    if (name.includes('swara')) score += 25;
    if (name.includes('madhur')) score += 20;
    if (name.includes('hindi')) score += 15;
    if (name.includes('kalpana')) score += 20;
  }

  // English-specific good voices
  if (preferredLang === 'en') {
    if (name.includes('aria')) score += 22;
    if (name.includes('jenny')) score += 20;
    if (name.includes('samantha')) score += 18;
    if (name.includes('zira')) score += 15;
    if (name.includes('daniel')) score += 15;
    if (name.includes('guy')) score += 12;
    if (name.includes('aaron')) score += 12;
    if (name.includes('michelle')) score += 12;
    if (name.includes('fred')) score += 10;
  }

  // Penalize robotic voices
  if (name.includes('android')) score -= 30;
  if (name.includes('synthesizer')) score -= 25;
  if (name.includes('espeak')) score -= 35;
  if (name.includes('robot')) score -= 35;
  if (name.includes('default')) score -= 12;
  if (name.includes('generic')) score -= 18;

  return score;
}

export interface TTSResult {
  voices: SpeechSynthesisVoice[];
  activeVoice: SpeechSynthesisVoice | null;
  speak: (text: string, onEnd?: () => void) => void;
  cancel: () => void;
  isSpeaking: boolean;
  speakRaw: (text: string) => void;
}

export function useTTS(prefs: VoicePrefs, ttsLanguage: 'en' | 'hi' = 'en', voiceId: string = 'Aoede'): TTSResult {
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const update = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setAllVoices(list);
    };
    update();
    window.speechSynthesis.onvoiceschanged = update;

    // Some browsers need a tick
    const t1 = setTimeout(update, 100);
    const t2 = setTimeout(update, 500);
    const t3 = setTimeout(update, 1500);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const profile = VOICE_PROFILES[voiceId] || VOICE_PROFILES.Aoede;

  // Filter voices by language preference
  const filteredVoices = allVoices.filter(v => {
    const lang = v.lang.toLowerCase();
    if (ttsLanguage === 'hi') {
      return lang.startsWith('hi') || lang.includes('hi');
    }
    return lang.startsWith('en') || lang.includes('en');
  });

  // Sort by quality score with profile applied
  const sortedVoices = [...filteredVoices].sort((a, b) =>
    scoreVoice(b, ttsLanguage, profile) - scoreVoice(a, ttsLanguage, profile)
  );

  const activeVoice = sortedVoices[0] || allVoices[0] || null;

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!('speechSynthesis' in window) || !text) {
        setTimeout(() => onEnd?.(), Math.max(800, text.length * 30));
        return;
      }

      // Resume context if suspended (Safari/Chrome quirk)
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      } catch { /* ignore */ }

      window.speechSynthesis.cancel();
      const cleanText = normalizeSpeechText(text);
      if (!cleanText) { onEnd?.(); return; }

      // Split very long text into chunks for stable playback
      const chunks = splitIntoChunks(cleanText, 220);
      let chunkIndex = 0;
      setIsSpeaking(true);

      const speakChunk = () => {
        if (chunkIndex >= chunks.length) {
          setIsSpeaking(false);
          onEnd?.();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);

        // Pick voice
        let voice: SpeechSynthesisVoice | undefined;
        if (prefs.voiceURI) {
          voice = allVoices.find(v => v.voiceURI === prefs.voiceURI);
        }
        if (!voice || !voice.lang.toLowerCase().includes(ttsLanguage === 'hi' ? 'hi' : 'en')) {
          voice = activeVoice || undefined;
        }
        if (!voice) voice = allVoices[0];
        if (voice) utterance.voice = voice;

        utterance.lang = voice?.lang || (ttsLanguage === 'hi' ? 'hi-IN' : 'en-US');

        // Apply voice profile rate/pitch combined with user prefs
        const baseRate = profile.rate;
        const basePitch = profile.pitch;
        utterance.rate = Math.min(1.4, Math.max(0.6, baseRate * prefs.rate));
        utterance.pitch = Math.min(1.6, Math.max(0.5, basePitch * prefs.pitch));
        utterance.volume = Math.max(0, Math.min(1, prefs.volume));

        utterance.onend = () => {
          chunkIndex++;
          speakChunk();
        };
        utterance.onerror = (e: any) => {
          if (e?.error === 'canceled' || e?.error === 'interrupted') {
            setIsSpeaking(false);
            onEnd?.();
            return;
          }
          chunkIndex++;
          speakChunk();
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          chunkIndex++;
          speakChunk();
        }
      };

      speakChunk();
    },
    [prefs, activeVoice, allVoices, ttsLanguage, profile]
  );

  const cancel = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speakRaw = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (activeVoice) utterance.voice = activeVoice;
    utterance.lang = activeVoice?.lang || (ttsLanguage === 'hi' ? 'hi-IN' : 'en-US');
    utterance.rate = prefs.rate;
    utterance.pitch = prefs.pitch;
    window.speechSynthesis.speak(utterance);
  }, [activeVoice, prefs, ttsLanguage]);

  return { voices: sortedVoices, activeVoice, speak, cancel, isSpeaking, speakRaw };
}

// Split text into chunks at sentence boundaries
function splitIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const sentences = text.split(/(?<=[.!?।])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length <= maxLength) {
      current = current ? current + ' ' + sentence : sentence;
    } else {
      if (current) chunks.push(current);
      // If single sentence is huge, split by commas
      if (sentence.length > maxLength) {
        const parts = sentence.split(/,\s+/);
        let partCurrent = '';
        for (const part of parts) {
          if ((partCurrent + ', ' + part).length <= maxLength) {
            partCurrent = partCurrent ? partCurrent + ', ' + part : part;
          } else {
            if (partCurrent) chunks.push(partCurrent);
            partCurrent = part;
          }
        }
        if (partCurrent) current = partCurrent;
        else current = '';
      } else {
        current = sentence;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text];
}

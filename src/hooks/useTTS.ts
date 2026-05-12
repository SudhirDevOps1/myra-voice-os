import { useCallback, useEffect, useState } from 'react';
import type { VoicePrefs } from '../types';

function normalizeSpeechText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreVoice(voice: SpeechSynthesisVoice) {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  let score = 0;
  if (name.includes('google')) score += 8;
  if (name.includes('microsoft')) score += 10;
  if (name.includes('natural')) score += 8;
  if (name.includes('female')) score += 4;
  if (name.includes('aria')) score += 9;
  if (name.includes('jenny')) score += 7;
  if (name.includes('samantha')) score += 6;
  if (name.includes('zira')) score += 6;
  if (name.includes('daniel')) score += 5;
  if (name.includes('fred')) score += 5;
  if (name.includes('android')) score -= 15;
  if (name.includes('synthesizer')) score -= 10;
  if (name.includes('espeak')) score -= 20;
  if (name.includes('robot')) score -= 20;
  return score;
}

export function useTTS(prefs: VoicePrefs) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const update = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setVoices(list);
    };
    update();
    window.speechSynthesis.onvoiceschanged = update;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!('speechSynthesis' in window)) {
        setTimeout(() => onEnd?.(), Math.max(800, text.length * 30));
        return;
      }
      window.speechSynthesis.cancel();
      const cleanText = normalizeSpeechText(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Find voice by URI or fall back to good defaults
      let voice: SpeechSynthesisVoice | undefined;
      if (prefs.voiceURI) {
        voice = voices.find(v => v.voiceURI === prefs.voiceURI);
      }
      if (!voice) {
        const sorted = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
        voice = sorted.find(v => v.lang.includes('en')) || sorted[0] || voices[0];
      }
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || navigator.language || 'en-US';
      utterance.rate = Math.min(1.05, Math.max(0.75, prefs.rate));
      utterance.pitch = Math.min(1.2, Math.max(0.85, prefs.pitch));
      utterance.volume = prefs.volume;
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
    },
    [prefs, voices]
  );

  const cancel = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  return { voices, speak, cancel };
}

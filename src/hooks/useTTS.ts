import { useCallback, useEffect, useState } from 'react';
import type { VoicePrefs } from '../types';

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
      const utterance = new SpeechSynthesisUtterance(text);

      // Find voice by URI or fall back to good defaults
      let voice: SpeechSynthesisVoice | undefined;
      if (prefs.voiceURI) {
        voice = voices.find(v => v.voiceURI === prefs.voiceURI);
      }
      if (!voice) {
        voice =
          voices.find(v => v.name.includes('Google') && v.name.includes('Female') && v.lang.includes('en')) ||
          voices.find(v => v.lang.includes('en-US') && v.name.toLowerCase().includes('female')) ||
          voices.find(v => v.lang.includes('en')) ||
          voices[0];
      }
      if (voice) utterance.voice = voice;
      utterance.rate = prefs.rate;
      utterance.pitch = prefs.pitch;
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

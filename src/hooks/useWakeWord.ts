import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWakeWordOptions {
  enabled: boolean;
  wakeWord: string;
  onWake: () => void;
  language?: string;
}

/**
 * Background listener that triggers `onWake` when wake phrase is detected.
 * Uses Web Speech API in a low-overhead loop.
 */
export function useWakeWord({ enabled, wakeWord, onWake, language = 'en-IN' }: UseWakeWordOptions) {
  const [isActive, setIsActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  const wakeRef = useRef(wakeWord.toLowerCase());
  const onWakeRef = useRef(onWake);
  const enabledRef = useRef(enabled);

  useEffect(() => { wakeRef.current = wakeWord.toLowerCase(); }, [wakeWord]);
  useEffect(() => { onWakeRef.current = onWake; }, [onWake]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsActive(false);
  }, []);

  const start = useCallback(() => {
    if (!enabledRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recognitionRef.current) return;
    try {
      const recognition = new SR();
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          if (transcript.includes(wakeRef.current)) {
            onWakeRef.current();
            try { recognition.stop(); } catch { /* ignore */ }
            return;
          }
        }
      };

      recognition.onerror = () => { /* ignore — auto-restart */ };

      recognition.onend = () => {
        recognitionRef.current = null;
        if (enabledRef.current) {
          setTimeout(() => start(), 300);
        } else {
          setIsActive(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsActive(true);
    } catch { /* mic busy */ }
  }, [language]);

  useEffect(() => {
    if (enabled) start();
    else stop();
    return () => stop();
  }, [enabled, start, stop]);

  return { isActive, start, stop };
}

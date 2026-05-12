import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWakeWordOptions {
  enabled: boolean;
  wakeWord: string;
  onWake: () => void;
  language?: string;
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\u0900-\u097f\s]/gi, ' ').replace(/\s+/g, ' ').trim();
}

function getWakeVariants(wakeWord: string) {
  const base = normalize(wakeWord || 'hey myra');
  return Array.from(new Set([
    base,
    'hey myra',
    'hi myra',
    'ok myra',
    'okay myra',
    'myra',
    'मायरा',
    'हे मायरा',
  ].map(normalize).filter(Boolean)));
}

function getSpeechRecognition() {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

export function useWakeWord({ enabled, wakeWord, onWake, language = 'en-IN' }: UseWakeWordOptions) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const variantsRef = useRef(getWakeVariants(wakeWord));
  const onWakeRef = useRef(onWake);
  const enabledRef = useRef(enabled);
  const languageRef = useRef(language);
  const restartTimerRef = useRef<number | null>(null);

  useEffect(() => { variantsRef.current = getWakeVariants(wakeWord); }, [wakeWord]);
  useEffect(() => { onWakeRef.current = onWake; }, [onWake]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { languageRef.current = language; }, [language]);

  const stop = useCallback(() => {
    enabledRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsActive(false);
  }, []);

  const start = useCallback(() => {
    enabledRef.current = true;
    const SR = getSpeechRecognition();
    if (!SR) {
      setError('Wake word unsupported. Chrome/Edge browser use karein.');
      return;
    }
    if (recognitionRef.current) return;

    try {
      const recognition = new SR();
      recognition.lang = languageRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = normalize(event.results[i][0].transcript || '');
          if (!transcript) continue;
          const matched = variantsRef.current.some(phrase => transcript.includes(phrase));
          if (matched) {
            setError('');
            onWakeRef.current();
            try { recognition.stop(); } catch { /* ignore */ }
            return;
          }
        }
      };

      recognition.onerror = (event: any) => {
        const code = event?.error || 'unknown';
        if (code === 'no-speech' || code === 'aborted') return;
        if (code === 'not-allowed') setError('Mic permission denied. Wake word ke liye mic allow karo.');
        else setError(`Wake word error: ${code}`);
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setIsActive(false);
        if (enabledRef.current) {
          restartTimerRef.current = window.setTimeout(() => {
            if (enabledRef.current) start();
          }, 500);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsActive(true);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Wake word start failed. Tap mic once, then enable wake word again.');
    }
  }, []);

  useEffect(() => {
    if (enabled) start();
    else stop();
    return () => stop();
  }, [enabled, start, stop]);

  return {
    isActive,
    error,
    isSupported: Boolean(getSpeechRecognition()),
    start,
    stop,
  };
}
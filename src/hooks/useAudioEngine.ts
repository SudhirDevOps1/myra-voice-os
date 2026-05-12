import { useRef, useState, useCallback, useEffect } from 'react';

export interface AudioEngineCallbacks {
  onAmplitudeChanged: (rms: number) => void;
  onTranscriptReady: (text: string) => void;
  onListeningChange: (listening: boolean) => void;
  onError: (error: string) => void;
}

export function useAudioEngine(callbacks: AudioEngineCallbacks) {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [amplitude, setAmplitude] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const amplitudeIntervalRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);
  const isMutedRef = useRef(false);
  const callbacksRef = useRef(callbacks);

  // Keep callback ref current
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Keep state refs in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const cleanup = useCallback(() => {
    if (amplitudeIntervalRef.current) {
      clearInterval(amplitudeIntervalRef.current);
      amplitudeIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const startListening = useCallback(async () => {
    if (isMutedRef.current) return;
    try {
      // Start audio analysis for amplitude
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      amplitudeIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        setAmplitude(rms);
        callbacksRef.current.onAmplitudeChanged(rms);
      }, 50);

      // Start Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            }
          }
          if (finalTranscript && finalTranscript.trim()) {
            callbacksRef.current.onTranscriptReady(finalTranscript.trim());
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'no-speech' || event.error === 'aborted') return;
          callbacksRef.current.onError(`Speech recognition error: ${event.error}`);
        };

        recognition.onend = () => {
          // Auto-restart if still listening
          if (isListeningRef.current && !isMutedRef.current) {
            try { recognition.start(); } catch { /* ignore */ }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsListening(true);
      callbacksRef.current.onListeningChange(true);
    } catch (e: any) {
      callbacksRef.current.onError(`Microphone error: ${e.message}`);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (amplitudeIntervalRef.current) {
      clearInterval(amplitudeIntervalRef.current);
      amplitudeIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setAmplitude(0);
    callbacksRef.current.onListeningChange(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted) {
        stopListening();
      }
      return newMuted;
    });
  }, [stopListening]);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (muted) stopListening();
  }, [stopListening]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    isListening,
    isMuted,
    amplitude,
    startListening,
    stopListening,
    toggleMute,
    setMuted,
  };
}

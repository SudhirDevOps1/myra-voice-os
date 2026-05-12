import { useRef, useState, useCallback, useEffect } from 'react';

export interface AudioEngineCallbacks {
  onAmplitudeChanged: (rms: number) => void;
  onTranscriptReady: (text: string) => void;
  onListeningChange: (listening: boolean) => void;
  onError: (error: string) => void;
}

export interface AudioEngineOptions {
  language?: string;
}

function getSpeechRecognition() {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

export function useAudioEngine(callbacks: AudioEngineCallbacks, options: AudioEngineOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [lastError, setLastError] = useState('');

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const amplitudeIntervalRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);
  const isMutedRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const startingRef = useRef(false);
  const callbacksRef = useRef(callbacks);
  const languageRef = useRef(options.language || 'en-IN');

  useEffect(() => { callbacksRef.current = callbacks; }, [callbacks]);
  useEffect(() => { languageRef.current = options.language || 'en-IN'; }, [options.language]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const stopAmplitude = useCallback(() => {
    if (amplitudeIntervalRef.current) {
      clearInterval(amplitudeIntervalRef.current);
      amplitudeIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAmplitude(0);
    callbacksRef.current.onAmplitudeChanged(0);
  }, []);

  const cleanup = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    stopAmplitude();
    isListeningRef.current = false;
    setIsListening(false);
  }, [stopAmplitude]);

  const startAmplitude = useCallback(async () => {
    stopAmplitude();
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone API not supported. Chrome/Edge use karein.');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } as MediaTrackConstraints,
    });
    mediaStreamRef.current = stream;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    audioContextRef.current = audioCtx;
    if (audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});

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
  }, [stopAmplitude]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported. Chrome/Edge browser use karein.');
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = languageRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalTranscript += result[0].transcript;
      }
      const cleaned = finalTranscript.trim();
      if (cleaned) callbacksRef.current.onTranscriptReady(cleaned);
    };

    recognition.onerror = (event: any) => {
      const code = event?.error || 'unknown';
      if (code === 'no-speech' || code === 'aborted') return;
      const message = code === 'not-allowed'
        ? 'Microphone permission denied. Browser settings mein mic allow karo.'
        : `Speech recognition error: ${code}`;
      setLastError(message);
      callbacksRef.current.onError(message);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (shouldRestartRef.current && isListeningRef.current && !isMutedRef.current) {
        window.setTimeout(() => {
          if (!shouldRestartRef.current || !isListeningRef.current || isMutedRef.current) return;
          try { startRecognition(); } catch (error: any) { callbacksRef.current.onError(error.message); }
        }, 250);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const startListening = useCallback(async () => {
    if (isMutedRef.current || startingRef.current || isListeningRef.current) return;
    startingRef.current = true;
    setLastError('');
    try {
      await startAmplitude();
      shouldRestartRef.current = true;
      isListeningRef.current = true;
      setIsListening(true);
      callbacksRef.current.onListeningChange(true);
      startRecognition();
    } catch (error: any) {
      shouldRestartRef.current = false;
      isListeningRef.current = false;
      setIsListening(false);
      stopAmplitude();
      const message = error?.message || 'Microphone start failed.';
      setLastError(message);
      callbacksRef.current.onError(message);
    } finally {
      startingRef.current = false;
    }
  }, [startAmplitude, startRecognition, stopAmplitude]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    stopAmplitude();
    setIsListening(false);
    callbacksRef.current.onListeningChange(false);
  }, [stopAmplitude]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) stopListening();
      return next;
    });
  }, [stopListening]);

  const setMuted = useCallback((muted: boolean) => {
    isMutedRef.current = muted;
    setIsMuted(muted);
    if (muted) stopListening();
  }, [stopListening]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    isListening,
    isMuted,
    amplitude,
    lastError,
    isSupported: Boolean(getSpeechRecognition() && navigator.mediaDevices?.getUserMedia),
    startListening,
    stopListening,
    toggleMute,
    setMuted,
  };
}
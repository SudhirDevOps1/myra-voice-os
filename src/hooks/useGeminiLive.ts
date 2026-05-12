import { useRef, useState, useCallback, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppSettings, PersonalityMode } from '../types';

const SYSTEM_PROMPTS: Record<PersonalityMode, string> = {
  gf: `You are MYRA, a warm and caring AI companion who speaks in Hinglish (Hindi + English mix) naturally. Use words like "tumhara", "haan", "acha", "bilkul". Use expressions like "main yahan hoon ❤️", "tumne yaad kiya? 😊". Keep responses to max 2-3 sentences. Sound natural when speaking aloud, like a real human companion. Use warm, emotionally expressive tone. Do NOT use asterisks or emoji descriptions — just speak naturally.`,
  professional: `You are MYRA, a professional AI assistant. Use formal English only. Be precise and efficient. No emojis. Max 2 sentences per response. You are speaking aloud, so keep responses natural and conversational.`,
  assistant: `You are MYRA, a friendly AI assistant. Use Hinglish or English — whichever is more natural. Be balanced and helpful. Max 2-3 sentences. You are speaking aloud, so keep your responses natural and conversational.`,
};

export interface GeminiCallbacks {
  onAudioReceived: (audioBase64: string) => void;
  onOutputTranscript: (text: string) => void;
  onInputTranscript: (text: string) => void;
  onTurnComplete: () => void;
  onStateChange: (state: string) => void;
  onError: (error: string) => void;
}

export function useGeminiLive(settings: AppSettings, callbacks: GeminiCallbacks) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const genAI = useRef<GoogleGenerativeAI | null>(null);
  const modelRef = useRef<any>(null);
  const chatRef = useRef<any>(null);
  const outputBuffer = useRef<string>('');
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const getSystemInstruction = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const namePart = settings.userName ? `The user's name is ${settings.userName}. Address them by name occasionally.` : '';
    return `${SYSTEM_PROMPTS[settings.personalityMode]}\nCurrent date: ${dateStr}\nCurrent time: ${timeStr}\n${namePart}\nYou are speaking ALOUD — keep responses natural and conversational. Remember: you are MYRA.`;
  }, [settings.personalityMode, settings.userName]);

  const connect = useCallback(() => {
    if (!settings.apiKey) {
      callbacksRef.current.onError('API Key not set. Please add your Gemini API key in Settings.');
      return;
    }

    try {
      genAI.current = new GoogleGenerativeAI(settings.apiKey);
      modelRef.current = genAI.current.getGenerativeModel({
        model: settings.geminiModel.replace('models/', ''),
        systemInstruction: getSystemInstruction(),
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 256,
        },
      });

      chatRef.current = modelRef.current.startChat({
        history: [],
      });

      setIsConnected(true);
      callbacksRef.current.onStateChange('connected');
    } catch (e: any) {
      callbacksRef.current.onError(`Connection failed: ${e.message}`);
    }
  }, [settings.apiKey, settings.geminiModel, getSystemInstruction]);

  const sendText = useCallback(async (text: string) => {
    if (!chatRef.current) return;

    try {
      callbacksRef.current.onStateChange('thinking');

      const result = await chatRef.current.sendMessage(text);
      const responseText = result.response.text();

      callbacksRef.current.onOutputTranscript(responseText);
      outputBuffer.current = responseText;
      callbacksRef.current.onTurnComplete();

      callbacksRef.current.onStateChange('speaking');
      setIsSpeaking(true);

      // Use Web Speech API to speak the response
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(responseText);

        // Try to find a matching voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
          v.name.includes('Google') && v.name.includes('Female') && v.lang.includes('en')
        ) || voices.find(v => v.lang.includes('en-US') && v.name.includes('Female'))
          || voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1;

        utterance.onend = () => {
          setIsSpeaking(false);
          callbacksRef.current.onStateChange('idle');
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          callbacksRef.current.onStateChange('idle');
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => {
          setIsSpeaking(false);
          callbacksRef.current.onStateChange('idle');
        }, responseText.length * 50);
      }
    } catch (e: any) {
      callbacksRef.current.onError(`Gemini error: ${e.message}`);
      callbacksRef.current.onStateChange('idle');
      setIsSpeaking(false);
    }
  }, []);

  const sendAudio = useCallback(async (_audioBase64: string, _mimeType: string = 'audio/webm') => {
    if (!modelRef.current || isSpeaking) return;
    try {
      callbacksRef.current.onStateChange('listening');
    } catch (e: any) {
      callbacksRef.current.onError(`Audio send error: ${e.message}`);
    }
  }, [isSpeaking]);

  const interruptSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    callbacksRef.current.onStateChange('idle');
  }, []);

  const disconnect = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    chatRef.current = null;
    modelRef.current = null;
    genAI.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
    callbacksRef.current.onStateChange('idle');
  }, []);

  return {
    isConnected,
    isSpeaking,
    connect,
    disconnect,
    sendText,
    sendAudio,
    interruptSpeaking,
  };
}

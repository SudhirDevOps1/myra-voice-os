import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import OrbAnimation from './components/OrbAnimation';
import WaveformView from './components/WaveformView';
import ChatPanel from './components/ChatPanel';
import MicButton from './components/MicButton';
import SettingsPanel from './components/SettingsPanel';
import ProviderSettings from './components/ProviderSettings';
import CustomizePanel from './components/CustomizePanel';
import StatsPanel from './components/StatsPanel';
import SessionsPanel from './components/SessionsPanel';
import QuickActions from './components/QuickActions';
import InputBar from './components/InputBar';
import TypingIndicator from './components/TypingIndicator';
import ChatSearchFilter from './components/ChatSearchFilter';
import AboutPanel from './components/AboutPanel';
import TokenTracker from './components/TokenTracker';
import BackupPanel from './components/BackupPanel';
import MemoryPanel from './components/MemoryPanel';
import WeatherDashboard from './components/WeatherDashboard';
import FunDashboard from './components/FunDashboard';
import ToolsDashboard from './components/ToolsDashboard';
import Calculator from './components/Calculator';
import MyraLogo from './components/MyraLogo';
import { useSettings } from './hooks/useSettings';
import { useMultiAI, type MultiAICallbacks } from './hooks/useMultiAI';
import { useAudioEngine, AudioEngineCallbacks } from './hooks/useAudioEngine';
import { useCommandParser } from './hooks/useCommandParser';
import { useChatHistory } from './hooks/useChatHistory';
import { useStats } from './hooks/useStats';
import { useTTS } from './hooks/useTTS';
import { useWakeWord } from './hooks/useWakeWord';
import { useLongTermMemory } from './hooks/useLongTermMemory';
import { ChatMessage, OrbState, THEMES } from './types';
import { AI_PROVIDERS, PROVIDER_BY_ID } from './types/providers';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function vibrate(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
}

function hasAnyKey(settings: any) {
  return AI_PROVIDERS.some(p => String(settings[p.keyField] || '').trim());
}

export default function App() {
  const { settings, updateSettings, addPrimeContact, removePrimeContact } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showFun, setShowFun] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [statusText, setStatusText] = useState('Tap karke bolo 💬');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [redOverlayAlpha, setRedOverlayAlpha] = useState(0);
  const [timeStr, setTimeStr] = useState('');
  const [batteryStr, setBatteryStr] = useState('--%');
  const [ramStr, setRamStr] = useState('--GB');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callerName, setCallerName] = useState('');
  const [callDecisionTimer, setCallDecisionTimer] = useState<number | null>(null);
  const [tokenStats, setTokenStats] = useState({ requestCount: 0, totalTokens: 0, estimatedCost: 0, providerBreakdown: {} as Record<string, { count: number; tokens: number }> });

  const isSpeakingRef = useRef(false);
  const lastMyraTextRef = useRef('');

  // Active theme
  const theme = useMemo(
    () => THEMES.find(t => t.id === settings.themeId) || THEMES[0],
    [settings.themeId]
  );

  // TTS — voiceId from gemini voice setting controls the acoustic profile
  const { speak: speakTTS, cancel: cancelTTS, activeVoice } = useTTS(
    settings.voicePrefs,
    settings.ttsLanguage,
    settings.geminiVoice || 'Aoede'
  );

  // Stats
  const { stats, recordMessage, recordResponseTime, reset: resetStats } = useStats();

  // Memory
  const { memories, addMemory, removeMemory, clearMemories, getMemoriesForPrompt } = useLongTermMemory();

  // Chat history
  const {
    sessions, activeId, newSession, switchSession, deleteSession,
    updateActiveMessages, clearAll: clearAllSessions, exportSession,
  } = useChatHistory(settings.saveHistory);

  // Add message helper
  const addMessage = useCallback((text: string, isUser: boolean) => {
    if (!isUser && text === lastMyraTextRef.current) return;
    if (!isUser) lastMyraTextRef.current = text;
    setMessages(prev => [...prev, { text, isUser, timestamp: Date.now(), id: generateId() }]);
    recordMessage(text, isUser);
    if (settings.hapticEnabled) vibrate(isUser ? 10 : 20);
    // Auto-extract memories from user messages
    if (isUser && settings.saveHistory) {
      addMemory(text, 'conversation');
    }
  }, [recordMessage, settings.hapticEnabled, settings.saveHistory, addMemory]);

  // Persist messages
  useEffect(() => {
    if (settings.saveHistory && activeId) updateActiveMessages(messages);
  }, [messages, activeId, settings.saveHistory, updateActiveMessages]);

  // Auto-create session
  useEffect(() => {
    if (settings.saveHistory && !activeId && messages.length > 0) newSession(settings.aiProvider);
  }, [settings.saveHistory, activeId, messages.length, newSession, settings.aiProvider]);

  // AI callbacks
  const aiCallbacks: MultiAICallbacks = useMemo(() => ({
    onOutputTranscript: (text: string) => {
      setStreamingText('');
      addMessage(text, false);
    },
    onInputTranscript: (text: string) => addMessage(text, true),
    onTurnComplete: () => { setStreamingText(''); setIsThinking(false); },
    onStreamChunk: (partial: string) => setStreamingText(partial),
    onResponseTime: (ms: number) => recordResponseTime(ms),
    onStateChange: (state: string) => {
      switch (state) {
        case 'connected':   setStatusText('Connected ✓ Ready!'); setIsThinking(false); break;
        case 'connecting':  setStatusText('API key verify ho rahi hai... 🔄'); setOrbState('thinking'); setIsThinking(true); break;
        case 'thinking':    setOrbState('thinking');  setIsThinking(true);  setStatusText('Soch rahi hoon... 💭'); break;
        case 'speaking':    setOrbState('speaking');  isSpeakingRef.current = true;  setIsThinking(false); setStatusText('Bol rahi hoon... 💜'); break;
        case 'listening':   setOrbState('listening'); setIsThinking(false); setStatusText('Sun rahi hoon... 🔴'); break;
        case 'idle':        setOrbState('idle');      isSpeakingRef.current = false; setIsThinking(false); setStatusText('Tap karke bolo 💬'); break;
      }
    },
    onError: (error: string) => { setStatusText(error); setOrbState('idle'); setIsThinking(false); },
    speakOverride: (text: string, onEnd?: () => void) => speakTTS(text, () => onEnd?.()),
  }), [addMessage, recordResponseTime, speakTTS]);

  const { isConnected, isSpeaking, connect, sendText, interruptSpeaking, clearConversation, connectionState, lastValidationError } =
    useMultiAI(settings, aiCallbacks);

  const { parse: parseCommand, executeCommand: executeCmd } = useCommandParser(settings.primeContacts);
  const parseRef = useRef(parseCommand);
  const execRef = useRef(executeCmd);
  const addMessageRef = useRef(addMessage);
  const isConnectedRef = useRef(isConnected);
  const sendTextRef = useRef(sendText);
  const speakTTSRef = useRef(speakTTS);
  const getDemoResponseRef = useRef<any>(null);
  useEffect(() => { parseRef.current = parseCommand; }, [parseCommand]);
  useEffect(() => { execRef.current = executeCmd; }, [executeCmd]);
  useEffect(() => { addMessageRef.current = addMessage; }, [addMessage]);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);
  useEffect(() => { sendTextRef.current = sendText; }, [sendText]);
  useEffect(() => { speakTTSRef.current = speakTTS; }, [speakTTS]);

  // Demo response
  const getDemoResponse = useCallback((text: string): string => {
    const t = text.toLowerCase();
    const name = settings.userName || 'dear';
    const memo = getMemoriesForPrompt(text);
    const memoLine = memo ? `\n\n(Memory context: ${memo})` : '';

    if (settings.ttsLanguage === 'en') {
      if (/(hello|hi|hey|namaste)/.test(t)) return `Hello ${name}! I am listening.`;
      if (/(kaise ho|how are you)/.test(t)) return `I am doing well, ${name}. How can I help you?`;
      if (/(your name|aap kaun|tumhara naam)/.test(t)) return `I am MYRA, your AI voice assistant.${memoLine}`;
      if (/(thank|shukriya)/.test(t)) return `You are welcome, ${name}.`;
      if (/(joke|mazaak)/.test(t)) return `Here is a tiny joke: Why did the computer smile? Because it found its cache.`;
      if (/(time|kitne baje)/.test(t)) return `It is ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`;
      return `I understand, ${name}. Tell me what you need.`;
    }

    if (/(hello|hi|hey|namaste)/.test(t)) return settings.personalityMode === 'gf' ? `Haan ${name}! Tumne yaad kiya? 😊` : `Hello ${name}!`;
    if (/(kaise ho|how are you)/.test(t)) return `Main theek hoon ${name}! Tum sunao ❤️`;
    if (/(your name|aap kaun|tumhara naam)/.test(t)) return `Main MYRA hoon ${name}! Tumhari AI companion 💖${memoLine}`;
    if (/(thank|shukriya)/.test(t)) return `Welcome ${name}! ❤️`;
    if (/(joke|mazaak)/.test(t)) return `Ek computer ne kaha: "Tumhare bytes bahut cute hain!" 😄`;
    if (/(time|kitne baje)/.test(t)) return `Abhi ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} baj rahe hain.`;
    return settings.personalityMode === 'professional' ? `Understood, ${name}.` : `Haan ${name}, batao na! 😊`;
  }, [settings.userName, settings.personalityMode, getMemoriesForPrompt]);

  // Update demo response ref after it's declared
  useEffect(() => { getDemoResponseRef.current = getDemoResponse; }, [getDemoResponse]);

  // Audio callbacks
  const audioCallbacks: AudioEngineCallbacks = useMemo(() => ({
    onAmplitudeChanged: (rms: number) => setAmplitude(rms),
    onTranscriptReady: (text: string) => {
      if (isSpeakingRef.current) return;
      addMessageRef.current(text, true);
      const command = parseRef.current(text);
      if (command) {
        const result = execRef.current(command);
        setTimeout(() => {
          addMessageRef.current(result, false);
          setOrbState('speaking');
          speakTTSRef.current(result, () => { setOrbState('idle'); isSpeakingRef.current = false; });
        }, 200);
        return;
      }
      if (isConnectedRef.current) sendTextRef.current(text);
      else {
        const r = getDemoResponseRef.current?.(text) || 'Demo mode mein hoon. API key connect karo.';
        addMessageRef.current(r, false);
        setOrbState('speaking');
        speakTTSRef.current(r, () => { setOrbState('idle'); isSpeakingRef.current = false; });
      }
    },
    onListeningChange: (listening: boolean) => {
      if (listening) {
        setOrbState('listening');
        setStatusText(settings.ttsLanguage === 'hi' ? '🔴 Sun rahi hoon...' : '🔴 Listening...');
      }
    },
    onError: (err: string) => {
      console.error('[Audio]', err);
      setStatusText(`⚠️ ${err}`);
    },
  }), [settings.ttsLanguage]);

  const { isListening, isMuted, startListening, stopListening, setMuted, lastError: audioError, isSupported: audioSupported } = useAudioEngine(
    audioCallbacks,
    { language: settings.ttsLanguage === 'hi' ? 'hi-IN' : 'en-IN' }
  );

  // Wake word
  const wake = useWakeWord({
    enabled: settings.wakeWordEnabled && !isListening && !isSpeaking,
    wakeWord: settings.wakeWord,
    language: settings.ttsLanguage === 'hi' ? 'hi-IN' : 'en-IN',
    onWake: () => {
      if (settings.hapticEnabled) vibrate([30, 30, 50]);
      setStatusText('🎤 Wake word detected!');
      if (!isConnectedRef.current && hasAnyKey(settings)) connect();
      startListening();
    },
  });

  // Online/offline detection
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Red overlay
  useEffect(() => {
    if (isSpeaking || orbState === 'speaking' || orbState === 'listening' || orbState === 'thinking') {
      setRedOverlayAlpha(0.08);
    } else {
      const timer = setTimeout(() => setRedOverlayAlpha(0), 500);
      return () => clearTimeout(timer);
    }
  }, [isSpeaking, orbState]);

  // Status updates
  useEffect(() => {
    const update = () => {
      setTimeStr(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((b: any) => setBatteryStr(`${Math.round(b.level * 100)}%`)).catch(() => setBatteryStr('--%'));
      }
      if ('deviceMemory' in navigator) setRamStr(`${(navigator as any).deviceMemory || '--'}GB`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mic — fixed: always start listening; demo mode also works without API key
  const handleMicPress = useCallback(() => {
    if (settings.hapticEnabled) vibrate(15);

    if (!audioSupported) {
      setStatusText('🎤 Voice unsupported. Chrome ya Edge browser use karein.');
      return;
    }

    // If currently muted, unmute and start
    if (isMuted) {
      setMuted(false);
      window.setTimeout(() => {
        startListening().catch(() => {});
      }, 150);
      return;
    }

    // If currently listening, stop
    if (isListening) {
      stopListening();
      setStatusText('🎤 Mic stopped. Tap again to start.');
      return;
    }

    // Try to connect in background if API key exists but not connected
    if (!isConnected && hasAnyKey(settings)) {
      connect(); // fire-and-forget — start listening anyway
    }

    // Always start listening — demo mode handles when not connected
    startListening().catch((err: any) => {
      setStatusText(`🎤 Mic error: ${err?.message || 'Permission denied'}`);
    });
  }, [isMuted, isListening, isConnected, connect, startListening, stopListening, setMuted, settings, audioSupported]);

  const handleLongPress = useCallback(() => {
    if (settings.hapticEnabled) vibrate([30, 50, 30]);
    interruptSpeaking(); cancelTTS(); stopListening(); setMuted(true);
    setStatusText('Muted 🔇 — Tap mic to unmute');
    setOrbState('idle');
    isSpeakingRef.current = false;
    setTimeout(() => { if (isMuted) setStatusText('Muted 🔇 — Tap mic to unmute'); }, 1500);
  }, [interruptSpeaking, stopListening, cancelTTS, setMuted, settings, isMuted]);

  // Auto-connect on mount AND whenever provider/model/key changes
  useEffect(() => {
    if (hasAnyKey(settings)) {
      const t = setTimeout(() => { connect(); }, 400);
      return () => clearTimeout(t);
    }
  }, [
    settings.aiProvider,
    settings.aiModel,
    settings.apiKey,
    settings.openaiKey,
    settings.anthropicKey,
    settings.groqKey,
    settings.deepseekKey,
    settings.xaiKey,
    settings.mistralKey,
    settings.openrouterKey,
    settings.cohereKey,
    settings.perplexityKey,
    settings.togetherKey,
    settings.fireworksKey,
    settings.cerebrasKey,
  ]);

  // Greeting on successful connect
  const hasGreetedRef = useRef(false);
  useEffect(() => {
    if (isConnected && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      const t = setTimeout(() => {
        const g: Record<string, string> = {
          gf: `Hey${settings.userName ? ' ' + settings.userName : ''}! Main aa gayi hoon ❤️`,
          professional: `Good day${settings.userName ? ' ' + settings.userName : ''}. MYRA online and ready.`,
          assistant: `Hello${settings.userName ? ' ' + settings.userName : ''}! Main MYRA hoon. Connected!`,
        };
        sendText(g[settings.personalityMode] || g.gf);
      }, 800);
      return () => clearTimeout(t);
    }
    if (!isConnected) hasGreetedRef.current = false;

    if (!hasAnyKey(settings) && messages.length === 0) {
      const t = setTimeout(() => {
        const greeting = settings.personalityMode === 'gf'
          ? `Hey${settings.userName ? ' ' + settings.userName : ''}! Main MYRA hoon. Provider settings mein API key daalo. Tab tak demo mode 💖`
          : `Hi${settings.userName ? ' ' + settings.userName : ''}! MYRA in demo mode. Add an API key.`;
        setMessages([{ text: greeting, isUser: false, timestamp: Date.now(), id: generateId() }]);
        lastMyraTextRef.current = greeting;
        speakTTS(greeting);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [isConnected]);

  // Quick action
  const handleQuickAction = useCallback((prompt: string) => {
    if (settings.hapticEnabled) vibrate(10);
    addMessage(prompt, true);
    if (isConnected) sendText(prompt);
    else {
      const r = getDemoResponse(prompt);
      addMessage(r, false);
      setOrbState('speaking');
      speakTTS(r, () => { setOrbState('idle'); isSpeakingRef.current = false; });
    }
  }, [addMessage, sendText, isConnected, getDemoResponse, speakTTS, settings]);

  // Text send
  const handleSendText = useCallback((text: string) => {
    if (settings.hapticEnabled) vibrate(10);
    addMessage(text, true);
    const command = parseCommand(text);
    if (command) {
      const result = executeCmd(command);
      setTimeout(() => {
        addMessage(result, false);
        setOrbState('speaking');
        speakTTS(result, () => { setOrbState('idle'); isSpeakingRef.current = false; });
      }, 150);
      return;
    }
    if (isConnected) sendText(text);
    else {
      const r = getDemoResponse(text);
      addMessage(r, false);
      setOrbState('speaking');
      speakTTS(r, () => { setOrbState('idle'); isSpeakingRef.current = false; });
    }
  }, [addMessage, parseCommand, executeCmd, sendText, isConnected, getDemoResponse, speakTTS, settings]);

  // Track token stats (only when messages actually change)
  const prevMsgLenRef = useRef(0);
  useEffect(() => {
    if (messages.length > 0 && messages.length !== prevMsgLenRef.current) {
      prevMsgLenRef.current = messages.length;
      const lastMsg = messages[messages.length - 1];
      const estCost = messages.filter(m => !m.isUser).reduce((acc, m) => acc + (m.text.length / 4) * 0.000001 * 3, 0);
      setTokenStats(prev => ({
        ...prev,
        requestCount: messages.filter(m => m.isUser).length,
        totalTokens: messages.reduce((a, m) => a + Math.ceil(m.text.length / 4), 0),
        estimatedCost: estCost,
        providerBreakdown: {
          ...prev.providerBreakdown,
          [settings.aiProvider]: {
            count: (prev.providerBreakdown[settings.aiProvider]?.count || 0) + 1,
            tokens: (prev.providerBreakdown[settings.aiProvider]?.tokens || 0) + Math.ceil(lastMsg?.text.length / 4),
          },
        },
      }));
    }
  }, [messages.length, messages, settings.aiProvider]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n': e.preventDefault(); handleNewSession(); break;
          case 's': e.preventDefault(); setShowSettings(prev => !prev); break;
          case 'p': e.preventDefault(); setShowProviderSettings(prev => !prev); break;
          case 't': e.preventDefault(); setShowCustomize(prev => !prev); break;
          case 'f': e.preventDefault(); setShowSearch(prev => !prev); break;
          case 'l': e.preventDefault(); handleMicPress(); break;
          default: break;
        }
      } else if (e.key === 'Escape') {
        setShowSettings(false); setShowProviderSettings(false); setShowCustomize(false);
        setShowStats(false); setShowSessions(false); setShowAbout(false);
        setShowBackup(false); setShowMemory(false); setShowSearch(false); setShowTokens(false);
        setShowWeather(false); setShowFun(false); setShowTools(false); setShowCalculator(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // New session
  const handleNewSession = useCallback(() => {
    newSession(settings.aiProvider);
    setMessages([]); lastMyraTextRef.current = ''; clearConversation();
  }, [newSession, settings.aiProvider, clearConversation]);

  // Switch session
  const handleSwitchSession = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) { switchSession(id); setMessages(session.messages); lastMyraTextRef.current = session.messages.filter(m => !m.isUser).slice(-1)[0]?.text || ''; clearConversation(); }
  }, [sessions, switchSession, clearConversation]);

  // Handle import
  const handleImport = useCallback((data: Record<string, string | null>) => {
    for (const [key, value] of Object.entries(data)) {
      if (value !== null) localStorage.setItem(key, value);
    }
    window.location.reload();
  }, []);

  // Demo call
  useEffect(() => {
    (window as any).simulateIncomingCall = (name: string) => {
      setCallerName(name); setShowCallDialog(true); setOrbState('thinking');
      sendText(`${name} ka call aa raha hai. Uthau ya reject karu?`);
      const timer = window.setTimeout(() => { setShowCallDialog(false); setOrbState('idle'); }, 4500);
      setCallDecisionTimer(timer);
    };
  }, [sendText]);

  const handleAcceptCall = useCallback(() => {
    if (callDecisionTimer) clearTimeout(callDecisionTimer);
    setShowCallDialog(false); sendText('Call accept kar liya! 📞');
  }, [callDecisionTimer, sendText]);

  const handleRejectCall = useCallback(() => {
    if (callDecisionTimer) clearTimeout(callDecisionTimer);
    setShowCallDialog(false); sendText('Call reject kar diya.');
  }, [callDecisionTimer, sendText]);

  const activeProviderConfig = PROVIDER_BY_ID[settings.aiProvider];

  return (
    <div className="min-h-screen text-[#EEEEEE] font-sans relative overflow-x-hidden select-none flex flex-col" style={{ backgroundColor: '#050505' }}>
      {/* Background */}
      <div className="fixed top-0 left-0 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: `${theme.primary}10` }} />
      <div className="fixed bottom-0 right-0 w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${theme.secondary}10` }} />
      <div className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-500" style={{ opacity: redOverlayAlpha, backgroundColor: theme.primary }} />

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-[80] bg-[#FF1744] text-white text-center text-xs py-1 font-bold">
          ⚠️ OFFLINE — Internet connection lost
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">

        {/* Top Bar */}
        <div className="relative z-20 flex items-center justify-between px-3 sm:px-5 pt-6 sm:pt-8 pb-2 gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-mono text-[10px] sm:text-xs truncate" style={{ color: theme.accent }}>{batteryStr}</span>
            <span className="text-[#555] font-mono text-[9px] sm:text-[10px] truncate">{ramStr}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <MyraLogo size={30} accent={theme.primary} />
              <h1
                className="text-xl sm:text-2xl font-black tracking-[0.25em] sm:tracking-[0.3em] leading-none"
                style={{
                  color: theme.primary,
                  textShadow: `0 0 18px ${theme.primary}55`,
                }}
              >
                MYRA
              </h1>
            </div>
            <span className="text-[#666] font-mono text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.22em] mt-1 uppercase">
              AI · Voice · OS
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5 min-w-0">
            <span className="font-mono text-[10px] sm:text-xs truncate" style={{ color: theme.primary }}>{timeStr}</span>
            <button
              onClick={() => { if (!isConnected && connectionState === 'failed') connect(); else setShowProviderSettings(true); }}
              className="text-[9px] sm:text-[10px] bg-[#111] px-1.5 sm:px-2 py-1 rounded-lg font-mono hover:opacity-80 flex items-center gap-1 active:scale-95 transition-all"
              style={{ color: theme.primary }}
              title={!isConnected ? 'Tap to reconnect' : 'Open provider settings'}
            >
              <span className="hidden xs:inline">{activeProviderConfig?.icon}</span>
              <span className="truncate max-w-[60px]">{activeProviderConfig?.shortName}</span>
              {!isConnected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6D6D] animate-pulse flex-shrink-0" />}
              {isConnected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00E676] flex-shrink-0" />}
            </button>
          </div>
        </div>

        {/* Action chips — horizontal scroll on mobile */}
        <div className="relative z-20 flex items-center gap-1.5 px-2 pb-2 overflow-x-auto sm:flex-wrap sm:justify-center hide-scrollbar">
          <ActionChip icon="📂" label="Chats" badge={sessions.length} color={theme.primary} onClick={() => setShowSessions(true)} />
          <ActionChip icon="🧠" label="Memory" badge={memories.length} color={theme.primary} onClick={() => setShowMemory(true)} />
          <ActionChip icon="📊" label="Stats" color={theme.primary} onClick={() => setShowStats(true)} />
          <ActionChip icon="🔍" label="Search" color={theme.primary} onClick={() => setShowSearch(true)} />
          <ActionChip icon="🎨" label="Theme" color={theme.primary} onClick={() => setShowCustomize(true)} />
          <ActionChip icon="⚙️" label="Settings" color={theme.primary} onClick={() => setShowSettings(true)} />
          <ActionChip icon="📥" label="Backup" color={theme.primary} onClick={() => setShowBackup(true)} />
          <ActionChip icon="🪙" label="Tokens" color={theme.primary} onClick={() => setShowTokens(true)} />
          <ActionChip icon="🌤️" label="Weather" color={theme.primary} onClick={() => setShowWeather(true)} />
          <ActionChip icon="🛠️" label="Tools" color={theme.primary} onClick={() => setShowTools(true)} />
          <ActionChip icon="🧮" label="Calculator" color={theme.primary} onClick={() => setShowCalculator(true)} />
          <ActionChip icon="🎪" label="Fun Zone" color={theme.primary} onClick={() => setShowFun(true)} />
          <ActionChip icon="ℹ️" label="About" color={theme.primary} onClick={() => setShowAbout(true)} />
          <LanguageToggle
            lang={settings.ttsLanguage}
            onToggle={() => updateSettings({ ttsLanguage: settings.ttsLanguage === 'en' ? 'hi' : 'en' })}
            color={theme.primary}
          />
        </div>

        {/* Center Orb */}
        <div className="relative z-20 flex flex-col items-center justify-center mt-2 px-3">
          <div className="scale-75 sm:scale-90 md:scale-100 origin-center">
            <OrbAnimation state={orbState} amplitude={amplitude} />
          </div>
          <div className="-mt-4 sm:-mt-6"><WaveformView amplitude={amplitude} isActive={isListening || isSpeaking} /></div>
          <p className="text-[#888] text-xs sm:text-sm mt-2 font-mono text-center break-words max-w-full px-2">{statusText}</p>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center max-w-full">
            <span className="text-[9px] sm:text-[10px] text-[#666] font-mono bg-[#0E0E0E] px-2 sm:px-2.5 py-1 rounded-full border truncate max-w-[200px] sm:max-w-none" style={{ borderColor: `${theme.primary}22` }}>
              {activeProviderConfig?.shortName} · {(activeProviderConfig?.models.find(m => m.id === settings.aiModel)?.label || settings.aiModel).slice(0, 24)}
            </span>
            <ConnectionBadge
              isConnected={isConnected}
              connectionState={connectionState}
              lastError={lastValidationError}
              onReconnect={connect}
              accent={theme.primary}
            />
            {settings.streamingEnabled && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.primary}22`, color: theme.primary }}>⚡ STREAM</span>}
            {settings.wakeWordEnabled && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                title={wake.error || (wake.isActive ? 'Wake word listening' : 'Wake word enabled')}
                style={{ backgroundColor: wake.isActive ? `${theme.primary}22` : '#1A0000', color: wake.isActive ? theme.primary : '#FF6D6D' }}
              >
                🎙️ {wake.isActive ? 'Wake ON' : wake.error ? 'Wake ERR' : 'Wake'}
              </span>
            )}
            {audioError && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#1A0000] text-[#FF6D6D]" title={audioError}>
                Mic issue
              </span>
            )}
            {activeVoice && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#111] text-[#888] truncate max-w-[140px]" title={`${activeVoice.name} (${activeVoice.lang}) · Profile: ${settings.geminiVoice}`}>
                🔊 {settings.geminiVoice} · {activeVoice.name.slice(0, 14)}{activeVoice.name.length > 14 ? '…' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative z-20 mt-3 px-2">
          <QuickActions actions={settings.quickActions} onAction={handleQuickAction} accentColor={theme.primary} />
        </div>

        {/* Chat */}
        <div className="relative z-20 mx-2 sm:mx-4 mt-3 flex-1 min-h-[200px]">
          <ChatPanel messages={messages} accentColor={theme.primary} streamingText={streamingText} />
          <TypingIndicator active={isThinking && !streamingText} accentColor={theme.primary} />
        </div>

        {/* Text Input */}
        <div className="relative z-20 mx-2">
          <InputBar onSend={handleSendText} accentColor={theme.primary} />
        </div>

        {/* Mic */}
        <div className="relative z-20 flex justify-center mt-1 pb-4 sm:pb-6">
          <MicButton
            isListening={isListening}
            isSpeaking={isSpeaking}
            isMuted={isMuted}
            onPress={handleMicPress}
            onLongPress={handleLongPress}
            accentColor={theme.primary}
          />
        </div>

      </div>

      {/* ===== MODALS ===== */}
      {showSettings && <SettingsPanel settings={settings} onUpdate={updateSettings} onAddPrimeContact={addPrimeContact} onRemovePrimeContact={removePrimeContact} onClose={() => setShowSettings(false)} />}
      {showProviderSettings && <ProviderSettings settings={settings} onUpdate={updateSettings} onClose={() => setShowProviderSettings(false)} />}
      <CustomizePanel open={showCustomize} settings={settings} onUpdate={updateSettings} onClose={() => setShowCustomize(false)} accentColor={theme.primary} />
      <StatsPanel open={showStats} stats={stats} onReset={resetStats} onClose={() => setShowStats(false)} accentColor={theme.primary} />
      <SessionsPanel open={showSessions} sessions={sessions} activeId={activeId} accentColor={theme.primary} onSwitch={handleSwitchSession} onDelete={deleteSession} onExport={exportSession} onNew={handleNewSession} onClearAll={clearAllSessions} onClose={() => setShowSessions(false)} />
      <AboutPanel open={showAbout} onClose={() => setShowAbout(false)} accentColor={theme.primary} />
      <TokenTracker open={showTokens} accentColor={theme.primary} stats={tokenStats} onClose={() => setShowTokens(false)} onReset={() => setTokenStats({ requestCount: 0, totalTokens: 0, estimatedCost: 0, providerBreakdown: {} })} />
      <BackupPanel open={showBackup} accentColor={theme.primary} onClose={() => setShowBackup(false)} onImport={handleImport} />
      <MemoryPanel open={showMemory} memories={memories} accentColor={theme.primary} onRemove={removeMemory} onClear={clearMemories} onClose={() => setShowMemory(false)} />
      <WeatherDashboard open={showWeather} accentColor={theme.primary} onClose={() => setShowWeather(false)} onSpeakWeather={txt => { addMessage(txt, false); setOrbState('speaking'); speakTTS(txt, () => setOrbState('idle')); }} lang={settings.ttsLanguage} />
      <FunDashboard open={showFun} accentColor={theme.primary} onClose={() => setShowFun(false)} lang={settings.ttsLanguage} />
      <ToolsDashboard open={showTools} accentColor={theme.primary} onClose={() => setShowTools(false)} lang={settings.ttsLanguage} />
      <Calculator open={showCalculator} accentColor={theme.primary} onClose={() => setShowCalculator(false)} lang={settings.ttsLanguage} />
      <ChatSearchFilter open={showSearch} messages={messages} accentColor={theme.primary} onSelect={() => setShowSearch(false)} onClose={() => setShowSearch(false)} />

      {/* Call Dialog */}
      {showCallDialog && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] rounded-2xl border p-6 sm:p-8 text-center space-y-4 max-w-sm w-full animate-fadeIn" style={{ borderColor: `${theme.primary}55` }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: `${theme.primary}1A`, borderWidth: 2, borderColor: theme.primary }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </div>
            <div>
              <h3 className="text-white text-base sm:text-lg font-bold">Incoming Call Detected</h3>
              <p className="text-lg sm:text-xl font-black mt-1" style={{ color: theme.primary }}>{callerName}</p>
            </div>

            {/* Purpose documentation mapping to Android Telephony workflow */}
            <div className="bg-[#111] rounded-xl p-3 text-left text-xs space-y-1.5 border border-[#222]">
              <p className="text-[#AAA] font-bold text-[11px] flex items-center gap-1">
                <span>💡</span> What is this feature?
              </p>
              <p className="text-[#888] leading-tight">
                Simulates the Android <code className="text-white">CallMonitorService</code> workflow. MYRA asks AI if you should answer, then listens for your decision.
              </p>
              <p className="text-[#888] leading-tight pt-1 border-t border-[#1A1A1A]">
                👉 <strong className="text-white">Say aloud:</strong> <code className="text-[#00E676]">"uthao"</code> or <code className="text-[#00E676]">"accept"</code> to pick up, <code className="text-[#FF6D6D]">"reject"</code> or <code className="text-[#FF6D6D]">"nahi"</code> to cancel.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleAcceptCall} className="flex-1 bg-[#00E676] text-black py-2.5 rounded-xl font-bold text-xs sm:text-sm active:scale-95 transition-all">
                📞 Accept
              </button>
              <button onClick={handleRejectCall} className="flex-1 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm active:scale-95 transition-all" style={{ backgroundColor: theme.primary }}>
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telephony Simulator Controller Widget */}
      <div className="fixed bottom-16 sm:bottom-20 right-3 z-[60] group">
        <div className="flex items-center gap-1.5 bg-[#0D0D0D] p-1.5 rounded-full border border-[#222] shadow-xl hover:border-[#444] transition-all">
          <span className="text-[9px] text-[#777] font-mono pl-2 hidden sm:group-hover:inline">Test Android Telephony:</span>
          {['Priya', 'Boss', 'Mom'].map((caller) => (
            <button
              key={caller}
              onClick={() => (window as any).simulateIncomingCall?.(caller)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full text-[#CCC] hover:text-white transition-all active:scale-95"
              style={{ backgroundColor: `${theme.primary}1A`, color: theme.primary }}
              title={`Simulate incoming call from ${caller}`}
            >
              📞 {caller}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Production-Level Footer ===== */}
      <footer
        className="relative z-20 w-full mt-auto py-5 sm:py-6 px-4 sm:px-6 border-t backdrop-blur-md"
        style={{
          borderColor: `${theme.primary}15`,
          background: 'linear-gradient(180deg, rgba(5,5,5,0) 0%, rgba(8,8,8,0.95) 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Top Row: Branding */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Built by Sudhir Singh */}
            <a
              href="https://github.com/SudhirDevOps1"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95"
              title="View Sudhir Singh on GitHub"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shadow-lg transition-shadow group-hover:shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  color: '#000',
                  boxShadow: `0 4px 12px ${theme.primary}40`,
                }}
              >
                SS
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white group-hover:text-white transition-colors">
                    Sudhir Singh
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#666] group-hover:text-white transition-colors">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#888]">
                  <span className="font-mono">@SudhirDevOps1</span>
                  <span className="opacity-50">·</span>
                  <span className="text-[9px] uppercase tracking-wider">Lead Developer</span>
                </div>
              </div>
            </a>

            {/* Quick Social Links */}
            <div className="flex items-center gap-2">
              {[
                { url: 'https://github.com/SudhirDevOps1', icon: 'GH', label: 'GitHub' },
                { url: 'https://github.com/SudhirDevOps1?tab=repositories', icon: '📦', label: 'Repos' },
                { url: '#', icon: '🌐', label: 'Web' },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all hover:scale-110 active:scale-95"
                  style={{ borderColor: `${theme.primary}33`, color: theme.primary, backgroundColor: '#0E0E0E' }}
                  title={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}33, transparent)` }} />

          {/* Bottom Row: Meta */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] text-[#666]">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <MyraLogo size={14} accent={theme.primary} />
              <span className="font-bold tracking-wider" style={{ color: theme.primary }}>MYRA</span>
              <span className="text-[#444]">v2.5.0</span>
              <span className="text-[#333]">•</span>
              <span className="font-mono">© {new Date().getFullYear()}</span>
              <span className="text-[#333]">•</span>
              <span className="text-[#888]">All rights reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px]"
                style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
                Production Ready
              </span>
              <span className="text-[#444]">•</span>
              <span>Made in 🇮🇳</span>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-center text-[10px] text-[#555] italic font-light pt-1">
            "Your voice, your AI — anytime, anywhere."
          </p>
        </div>
      </footer>
    </div>
  );
}

function LanguageToggle({ lang, onToggle, color }: { lang: 'en' | 'hi'; onToggle: () => void; color: string }) {
  const isHindi = lang === 'hi';
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold transition-all active:scale-95"
      style={{
        backgroundColor: isHindi ? `${color}22` : '#111',
        border: `1px solid ${isHindi ? color : '#333'}`,
        color: isHindi ? color : '#888',
      }}
      title={isHindi ? 'Hindi voice active — click for English' : 'English voice active — click for Hindi'}
    >
      <span className="text-xs">{isHindi ? '🇮🇳' : '🇬🇧'}</span>
      <span>{isHindi ? 'हिंदी' : 'EN'}</span>
      <span className="text-[8px] opacity-60">{isHindi ? 'Hindi' : 'English'}</span>
    </button>
  );
}

function ConnectionBadge({ isConnected, connectionState, lastError, onReconnect, accent }: {
  isConnected: boolean; connectionState: string; lastError: string; onReconnect: () => void; accent: string;
}) {
  if (connectionState === 'connecting') {
    return (
      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 bg-[#1A1A00] text-[#FFE066]" title="Validating API key...">
        🔄 Verifying
      </span>
    );
  }
  if (connectionState === 'failed') {
    const displayError = lastError || 'Unknown error';
    return (
      <button
        onClick={onReconnect}
        className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-[#1A0000] text-[#FF6D6D] hover:bg-[#2A0000] transition-colors truncate max-w-[120px]"
        title={displayError}
      >
        ❌ Retry
      </button>
    );
  }
  if (isConnected) {
    return (
      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: `${accent}18`, color: accent }}>
        ✓ Connected
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-[#111] text-[#666]">
      ○ No API Key
    </span>
  );
}

interface ChipProps { icon: string; label: string; badge?: number; color: string; onClick: () => void }
function ActionChip({ icon, label, badge, color, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 bg-[#0E0E0E] border rounded-full px-3 py-1.5 text-[10px] font-medium text-[#CCC] hover:text-white hover:bg-[#1A1A1A] transition-all active:scale-95 flex-shrink-0 group"
      style={{ borderColor: `${color}22` }}
      title={label}
    >
      <span className="text-sm group-hover:scale-110 transition-transform">{icon}</span>
      <span className="hidden xs:inline sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="text-[8px] px-1.5 py-0.5 rounded-full font-bold leading-none"
          style={{ backgroundColor: color, color: '#000', boxShadow: `0 0 8px ${color}66` }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

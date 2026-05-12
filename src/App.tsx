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

  // TTS
  const { speak: speakTTS, cancel: cancelTTS, activeVoice } = useTTS(settings.voicePrefs, settings.ttsLanguage);

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
    onListeningChange: () => {},
    onError: () => {},
  }), []);

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

  // Mic
  const handleMicPress = useCallback(() => {
    if (settings.hapticEnabled) vibrate(15);
    if (!audioSupported) {
      setStatusText('Voice unsupported. Chrome/Edge browser use karein.');
      return;
    }
    if (isMuted) {
      setMuted(false);
      window.setTimeout(() => startListening(), 100);
      return;
    }
    if (isListening) { stopListening(); return; }
    if (isConnected) { startListening(); return; }
    // Not connected yet — try to connect then listen
    if (hasAnyKey(settings)) {
      setOrbState('thinking');
      setStatusText('API key verify ho rahi hai... 🔄');
      connect();
      // Poll for connection, then start listening
      const pollInterval = window.setInterval(() => {
        if (isConnectedRef.current) {
          clearInterval(pollInterval);
          startListening();
        }
      }, 300);
      // Timeout after 10s
      setTimeout(() => clearInterval(pollInterval), 10000);
    }
  }, [isMuted, isListening, isConnected, connect, startListening, stopListening, setMuted, settings, audioSupported]);

  const handleLongPress = useCallback(() => {
    if (settings.hapticEnabled) vibrate([30, 50, 30]);
    interruptSpeaking(); cancelTTS(); stopListening(); setMuted(true);
    setStatusText('Muted 🔇 — Tap mic to unmute');
    setOrbState('idle');
    isSpeakingRef.current = false;
    setTimeout(() => { if (isMuted) setStatusText('Muted 🔇 — Tap mic to unmute'); }, 1500);
  }, [interruptSpeaking, stopListening, cancelTTS, setMuted, settings, isMuted]);

  // Auto-connect
  useEffect(() => {
    if (hasAnyKey(settings)) { const t = setTimeout(() => connect(), 600); return () => clearTimeout(t); }
  }, []);

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
    <div className="min-h-screen text-[#EEEEEE] font-sans relative overflow-hidden select-none" style={{ backgroundColor: '#050505' }}>
      {/* Background */}
      <div className="fixed top-0 left-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: `${theme.primary}10` }} />
      <div className="fixed bottom-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${theme.secondary}10` }} />
      <div className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-500" style={{ opacity: redOverlayAlpha, backgroundColor: theme.primary }} />

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-[80] bg-[#FF1744] text-white text-center text-xs py-1 font-bold">
          ⚠️ OFFLINE — Internet connection lost
        </div>
      )}

      {/* Top Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-8 pb-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs" style={{ color: theme.accent }}>{batteryStr}</span>
          <span className="text-[#555] font-mono text-[10px]">{ramStr}</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <MyraLogo size={30} accent={theme.primary} />
            <h1 className="text-2xl font-black tracking-[0.3em] leading-none" style={{ color: theme.primary }}>MYRA</h1>
          </div>
          <span className="text-[#555] font-mono text-[10px] tracking-[0.2em] mt-0.5">AI VOICE ASSISTANT v2.0</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-xs" style={{ color: theme.primary }}>{timeStr}</span>
          <button
            onClick={() => { if (!isConnected && connectionState === 'failed') connect(); else setShowProviderSettings(true); }}
            className="text-[10px] bg-[#111] px-2 py-1 rounded-lg font-mono hover:opacity-80 flex items-center gap-1"
            style={{ color: theme.primary }}
            title={!isConnected ? 'Tap to reconnect' : 'Open provider settings'}
          >
            {activeProviderConfig?.icon} {activeProviderConfig?.shortName}
            {!isConnected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6D6D] animate-pulse" />}
            {isConnected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00E676]" />}
          </button>
        </div>
      </div>

      {/* Action chips */}
      <div className="relative z-20 flex items-center justify-center gap-1.5 px-2 pb-2 flex-wrap">
        <ActionChip icon="📂" label="Chats" badge={sessions.length} color={theme.primary} onClick={() => setShowSessions(true)} />
        <ActionChip icon="🧠" label="Memory" badge={memories.length} color={theme.primary} onClick={() => setShowMemory(true)} />
        <ActionChip icon="📊" label="Stats" color={theme.primary} onClick={() => setShowStats(true)} />
        <ActionChip icon="🔍" label="Search" color={theme.primary} onClick={() => setShowSearch(true)} />
        <ActionChip icon="🎨" label="Theme" color={theme.primary} onClick={() => setShowCustomize(true)} />
        <ActionChip icon="⚙️" label="Settings" color={theme.primary} onClick={() => setShowSettings(true)} />
        <ActionChip icon="📥" label="Backup" color={theme.primary} onClick={() => setShowBackup(true)} />
        <ActionChip icon="🪙" label="Tokens" color={theme.primary} onClick={() => setShowTokens(true)} />
        <ActionChip icon="ℹ️" label="About" color={theme.primary} onClick={() => setShowAbout(true)} />
        <LanguageToggle
          lang={settings.ttsLanguage}
          onToggle={() => updateSettings({ ttsLanguage: settings.ttsLanguage === 'en' ? 'hi' : 'en' })}
          color={theme.primary}
        />
      </div>

      {/* Center Orb */}
      <div className="relative z-20 flex flex-col items-center justify-center mt-2">
        <OrbAnimation state={orbState} amplitude={amplitude} />
        <div className="-mt-6"><WaveformView amplitude={amplitude} isActive={isListening || isSpeaking} /></div>
        <p className="text-[#888] text-sm mt-2 font-mono text-center px-4">{statusText}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap justify-center px-4">
          <span className="text-[10px] text-[#666] font-mono bg-[#0E0E0E] px-2.5 py-1 rounded-full border" style={{ borderColor: `${theme.primary}22` }}>
            {activeProviderConfig?.name} · {activeProviderConfig?.models.find(m => m.id === settings.aiModel)?.label || settings.aiModel}
          </span>
          {/* Connection status badge */}
          <ConnectionBadge
            isConnected={isConnected}
            connectionState={connectionState}
            lastError={lastValidationError}
            onReconnect={connect}
            accent={theme.primary}
          />
          {settings.streamingEnabled && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.primary}22`, color: theme.primary }}>⚡ STREAMING</span>}
          {settings.wakeWordEnabled && (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              title={wake.error || (wake.isActive ? 'Wake word listening' : 'Wake word enabled')}
              style={{ backgroundColor: wake.isActive ? `${theme.primary}22` : '#1A0000', color: wake.isActive ? theme.primary : '#FF6D6D' }}
            >
              🎙️ {wake.isActive ? 'Wake ON' : wake.error ? 'Wake ERR' : `"${settings.wakeWord}"`}
            </span>
          )}
          {audioError && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#1A0000] text-[#FF6D6D]" title={audioError}>
              Mic issue
            </span>
          )}
          {activeVoice && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#111] text-[#888]" title={activeVoice.voiceURI}>
              🔊 {activeVoice.name.slice(0, 20)}{activeVoice.name.length > 20 ? '…' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative z-20 mt-3 px-2">
        <QuickActions actions={settings.quickActions} onAction={handleQuickAction} accentColor={theme.primary} />
      </div>

      {/* Chat */}
      <div className="relative z-20 mx-4 mt-3">
        <ChatPanel messages={messages} accentColor={theme.primary} streamingText={streamingText} />
        <TypingIndicator active={isThinking && !streamingText} accentColor={theme.primary} />
      </div>

      {/* Text Input */}
      <div className="relative z-20 mx-2">
        <InputBar onSend={handleSendText} accentColor={theme.primary} />
      </div>

      {/* Mic */}
      <div className="relative z-20 flex justify-center mt-1 pb-4">
        <MicButton isListening={isListening} isSpeaking={isSpeaking} isMuted={isMuted} onPress={handleMicPress} onLongPress={handleLongPress} />
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
      <ChatSearchFilter open={showSearch} messages={messages} accentColor={theme.primary} onSelect={() => setShowSearch(false)} onClose={() => setShowSearch(false)} />

      {/* Call Dialog */}
      {showCallDialog && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center">
          <div className="bg-[#0A0A0A] rounded-2xl border p-8 text-center space-y-5 mx-4 max-w-sm w-full" style={{ borderColor: `${theme.primary}55` }}>
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: `${theme.primary}1A`, borderWidth: 2, borderColor: theme.primary }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </div>
            <h3 className="text-white text-lg font-bold">Incoming Call</h3>
            <p className="text-xl font-black" style={{ color: theme.primary }}>{callerName}</p>
            <div className="flex gap-4 mt-4">
              <button onClick={handleAcceptCall} className="flex-1 bg-[#00E676] text-black py-3 rounded-xl font-bold text-sm">📞 Accept</button>
              <button onClick={handleRejectCall} className="flex-1 text-white py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: theme.primary }}>❌ Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Demo helper */}
      <div className="fixed bottom-2 right-2 z-[60] opacity-30 hover:opacity-100">
        <button onClick={() => (window as any).simulateIncomingCall?.('Priya')} className="text-[10px] text-[#555] bg-[#111] px-2 py-1 rounded">📞 Demo Call</button>
      </div>
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
    <button onClick={onClick} className="flex items-center gap-1.5 bg-[#0E0E0E] border rounded-full px-2.5 py-1.5 text-[10px] font-medium text-[#CCC] hover:text-white transition-all active:scale-95" style={{ borderColor: `${color}22` }}>
      <span>{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && <span className="text-[8px] px-1 py-0.5 rounded-full font-bold" style={{ backgroundColor: color, color: '#000' }}>{badge > 99 ? '99+' : badge}</span>}
    </button>
  );
}

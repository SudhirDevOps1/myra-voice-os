import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, ChatSession, AIProvider } from '../types';

const STORAGE_KEY = 'myra_chat_sessions';
const ACTIVE_KEY = 'myra_active_session';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(-50)));
  } catch { /* quota exceeded */ }
}

function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find(m => m.isUser);
  if (firstUser) {
    return firstUser.text.slice(0, 36) + (firstUser.text.length > 36 ? '…' : '');
  }
  return 'New chat';
}

export function useChatHistory(saveHistory: boolean) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => (saveHistory ? loadSessions() : []));
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));
  const sessionsRef = useRef(sessions);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  // Persist
  useEffect(() => {
    if (saveHistory) saveSessions(sessions);
  }, [sessions, saveHistory]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  const newSession = useCallback((provider?: AIProvider): ChatSession => {
    const session: ChatSession = {
      id: generateId(),
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      provider,
    };
    setSessions(prev => [...prev, session]);
    setActiveId(session.id);
    return session;
  }, []);

  const updateActiveMessages = useCallback(
    (messages: ChatMessage[]) => {
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === activeId);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          messages,
          title: deriveTitle(messages),
          updatedAt: Date.now(),
        };
        return next;
      });
    },
    [activeId]
  );

  const switchSession = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setActiveId(prev => (prev === id ? null : prev));
  }, []);

  const clearAll = useCallback(() => {
    setSessions([]);
    setActiveId(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  }, []);

  const exportSession = useCallback((id: string, format: 'json' | 'txt' = 'json') => {
    const session = sessionsRef.current.find(s => s.id === id);
    if (!session) return;
    let blob: Blob;
    let filename: string;
    if (format === 'txt') {
      const text = session.messages
        .map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.isUser ? 'You' : 'MYRA'}: ${m.text}`)
        .join('\n\n');
      blob = new Blob([`MYRA Chat — ${session.title}\n\n${text}`], { type: 'text/plain' });
      filename = `myra-chat-${session.id}.txt`;
    } else {
      blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
      filename = `myra-chat-${session.id}.json`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const activeSession = sessions.find(s => s.id === activeId) || null;

  return {
    sessions,
    activeId,
    activeSession,
    newSession,
    switchSession,
    deleteSession,
    updateActiveMessages,
    clearAll,
    exportSession,
  };
}

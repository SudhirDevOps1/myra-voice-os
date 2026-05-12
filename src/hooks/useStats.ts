import { useCallback, useEffect, useState } from 'react';
import type { AppStats } from '../types';
import { DEFAULT_STATS } from '../types';

const KEY = 'myra_stats';

function load(): AppStats {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_STATS };
}

export function useStats() {
  const [stats, setStats] = useState<AppStats>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(stats)); } catch { /* ignore */ }
  }, [stats]);

  const recordMessage = useCallback((text: string, isUser: boolean) => {
    const words = text.trim().split(/\s+/).length;
    setStats(prev => ({
      ...prev,
      totalMessages: prev.totalMessages + 1,
      totalUserMessages: prev.totalUserMessages + (isUser ? 1 : 0),
      totalMyraMessages: prev.totalMyraMessages + (isUser ? 0 : 1),
      totalWords: prev.totalWords + words,
    }));
  }, []);

  const recordResponseTime = useCallback((ms: number) => {
    setStats(prev => {
      const next = [...prev.responseTimes, ms].slice(-100);
      const avg = next.reduce((a, b) => a + b, 0) / next.length;
      return { ...prev, responseTimes: next, avgResponseTimeMs: avg };
    });
  }, []);

  const incrementSessions = useCallback(() => {
    setStats(prev => ({ ...prev, sessionsCount: prev.sessionsCount + 1 }));
  }, []);

  const reset = useCallback(() => {
    setStats({ ...DEFAULT_STATS, lastReset: Date.now() });
  }, []);

  return { stats, recordMessage, recordResponseTime, incrementSessions, reset };
}

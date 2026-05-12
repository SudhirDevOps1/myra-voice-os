import { useCallback, useEffect, useState } from 'react';

export interface MemoryItem {
  id: string;
  fact: string;
  createdAt: number;
  category: string;
}

const MEMORY_KEY = 'myra_memory';

function loadMemory(): MemoryItem[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function extractFacts(text: string): string[] {
  const facts: string[] = [];
  const patterns = [
    /(?:my name is|i am|i'm)\s+(\w+)/gi,
    /(?:i live in|i am from|i'm from)\s+([\w\s,]+?)(?:\.|,|!|$)/gi,
    /(?:my birthday|birthday is)\s+([\w\s,]+?)(?:\.|,|!|$)/gi,
    /(?:i like|i love|i enjoy)\s+([\w\s,]+?)(?:\.|,|!|$)/gi,
    /(?:i hate|i dislike)\s+([\w\s,]+?)(?:\.|,|!|$)/gi,
    /(?:i work as|i am a)\s+([\w\s,]+?)(?:\.|,|!|$)/gi,
    /(?:my favorite|my fav)\s+\w+\s+is\s+([\w\s,]+?)(?:\.|,|!|$)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      facts.push(match[0]);
    }
  }
  return facts;
}

export function useLongTermMemory() {
  const [memories, setMemories] = useState<MemoryItem[]>(loadMemory);

  useEffect(() => {
    try { localStorage.setItem(MEMORY_KEY, JSON.stringify(memories.slice(-200))); } catch { /* quota */ }
  }, [memories]);

  const addMemory = useCallback((text: string, category = 'auto') => {
    const extracted = extractFacts(text);
    const newItems: MemoryItem[] = extracted.map(fact => ({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      fact,
      createdAt: Date.now(),
      category,
    }));

    if (newItems.length === 0 && text.trim()) {
      newItems.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        fact: text.trim(),
        createdAt: Date.now(),
        category,
      });
    }

    setMemories(prev => [...prev, ...newItems]);
  }, []);

  const removeMemory = useCallback((id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  const clearMemories = useCallback(() => setMemories([]), []);

  const getMemoriesForPrompt = useCallback((_query?: string): string => {
    if (!memories.length) return '';
    const recent = memories.slice(-20);
    return `\nRemembered facts about the user:\n${recent.map(m => `- ${m.fact}`).join('\n')}`;
  }, [memories]);

  return { memories, addMemory, removeMemory, clearMemories, getMemoriesForPrompt };
}

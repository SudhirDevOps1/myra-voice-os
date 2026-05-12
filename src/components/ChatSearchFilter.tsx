import { useMemo, useState } from 'react';
import { ChatMessage } from '../types';

interface ChatSearchFilterProps {
  open: boolean;
  messages: ChatMessage[];
  accentColor: string;
  onSelect: (msg: ChatMessage) => void;
  onClose: () => void;
}

export default function ChatSearchFilter({ open, messages, accentColor, onSelect, onClose }: ChatSearchFilterProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return messages.filter(m => m.text.toLowerCase().includes(q)).slice(-50);
  }, [messages, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#1A1A1A]">
      <div className="max-w-2xl mx-auto p-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search all messages..."
            autoFocus
            className="flex-1 bg-[#111] border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none placeholder:text-[#555]"
            style={{ borderColor: `${accentColor}33` }}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          {query && (
            <span className="text-[10px] text-[#666] font-mono">{results.length} found</span>
          )}
          <button onClick={onClose} className="text-[#666] hover:text-white text-lg">✕</button>
        </div>

        {query && (
          <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1">
            {results.length === 0 && (
              <p className="text-center text-[#555] text-sm py-8">No messages found for "{query}"</p>
            )}
            {results.map(msg => (
              <button
                key={msg.id}
                onClick={() => { onSelect(msg); onClose(); }}
                className="w-full text-left p-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    msg.isUser ? 'text-black' : 'text-white'
                  }`} style={{ backgroundColor: msg.isUser ? accentColor : '#333' }}>
                    {msg.isUser ? 'You' : 'MYRA'}
                  </span>
                  <span className="text-[10px] text-[#555] font-mono">
                    {new Date(msg.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[#CCC] text-xs line-clamp-2">{msg.text}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

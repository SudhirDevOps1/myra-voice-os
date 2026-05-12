import { useState } from 'react';
import type { MemoryItem } from '../hooks/useLongTermMemory';

interface MemoryPanelProps {
  open: boolean;
  memories: MemoryItem[];
  accentColor: string;
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function MemoryPanel({ open, memories, accentColor, onRemove, onClear, onClose }: MemoryPanelProps) {
  const [search, setSearch] = useState('');
  if (!open) return null;

  const filtered = search
    ? memories.filter(m => m.fact.toLowerCase().includes(search.toLowerCase()))
    : memories;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex justify-center items-start overflow-y-auto pt-8 pb-12 px-4">
      <div className="w-full max-w-md bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] p-5 space-y-4 my-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-xl tracking-wider">🧠 MEMORY</h2>
            <p className="text-[#666] text-[10px] font-mono">{memories.length} things MYRA remembers</p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {memories.length > 5 && (
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full bg-[#111] border rounded-xl px-3 py-2 text-sm text-white focus:outline-none placeholder:text-[#555]"
            style={{ borderColor: `${accentColor}33` }}
          />
        )}

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-[#444] text-sm font-mono">
              {memories.length === 0
                ? 'No memories yet — tell MYRA about yourself!'
                : 'No matching memories'}
            </div>
          )}

          {filtered.map(m => (
            <div key={m.id} className="bg-[#111] rounded-xl p-3 flex items-start gap-2 group">
              <span className="text-[#555] text-sm mt-0.5">🧠</span>
              <div className="flex-1 min-w-0">
                <p className="text-[#CCC] text-sm">{m.fact}</p>
                <p className="text-[10px] text-[#555] font-mono mt-1">
                  {new Date(m.createdAt).toLocaleDateString('en-IN')} · {m.category}
                </p>
              </div>
              <button
                onClick={() => onRemove(m.id)}
                className="text-[#666] hover:text-[#FF1744] opacity-0 group-hover:opacity-100 transition-all"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {memories.length > 0 && (
          <button
            onClick={() => { if (confirm('Clear all MYRA memories?')) onClear(); }}
            className="w-full py-2.5 rounded-xl text-sm font-bold border transition-colors"
            style={{ borderColor: '#FF174444', color: '#FF6D6D' }}
          >
            Clear All Memories
          </button>
        )}
      </div>
    </div>
  );
}

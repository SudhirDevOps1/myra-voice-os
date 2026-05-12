// Simple search component - no react imports needed

interface ChatSearchProps {
  open: boolean;
  query: string;
  onChange: (q: string) => void;
  accentColor: string;
  totalMessages: number;
  onClose: () => void;
}

export default function ChatSearch({ open, query, onChange, accentColor, totalMessages, onClose }: ChatSearchProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-[#0A0A0A]/95 border-b border-[#1A1A1A] p-4">
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => onChange(e.target.value)}
          placeholder="Search messages..."
          autoFocus
          className="flex-1 bg-[#111] border rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder:text-[#555]"
          style={{ borderColor: `${accentColor}33` }}
          onKeyDown={e => e.key === 'Escape' && onClose()}
        />
        <span className="text-[10px] text-[#666] font-mono">{totalMessages} msg</span>
        <button onClick={onClose} className="text-[#888] hover:text-white">✕</button>
      </div>
    </div>
  );
}

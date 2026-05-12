import type { ChatSession } from '../types';

interface SessionsPanelProps {
  open: boolean;
  sessions: ChatSession[];
  activeId: string | null;
  accentColor: string;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string, format: 'json' | 'txt') => void;
  onNew: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function SessionsPanel({
  open,
  sessions,
  activeId,
  accentColor,
  onSwitch,
  onDelete,
  onExport,
  onNew,
  onClearAll,
  onClose,
}: SessionsPanelProps) {
  if (!open) return null;
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex justify-end">
      <div className="w-full max-w-sm h-full bg-[#0A0A0A] border-l border-[#1A1A1A] overflow-y-auto">
        <div className="sticky top-0 bg-[#0A0A0A] z-10 px-5 py-4 border-b border-[#1A1A1A] flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-lg tracking-wider">CHATS</h2>
            <p className="text-[#666] text-[10px] font-mono">{sessions.length} saved sessions</p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={onNew}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ backgroundColor: accentColor, color: '#000' }}
          >
            + New Chat
          </button>

          {sortedSessions.length === 0 && (
            <div className="text-center py-12 text-[#444] text-sm font-mono">
              No sessions yet — start chatting to save history.
            </div>
          )}

          {sortedSessions.map(session => (
            <div
              key={session.id}
              className={`rounded-xl p-3 border transition-all ${
                session.id === activeId ? 'border-[var(--accent)]' : 'border-[#1A1A1A]'
              }`}
              style={{ backgroundColor: session.id === activeId ? `${accentColor}11` : '#101010', '--accent': accentColor } as any}
            >
              <button
                onClick={() => { onSwitch(session.id); onClose(); }}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-white text-sm font-semibold truncate flex-1">{session.title}</span>
                  {session.id === activeId && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: accentColor, color: '#000' }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#666] font-mono">{formatTime(session.updatedAt)}</span>
                  <span className="text-[10px] text-[#666]">·</span>
                  <span className="text-[10px] text-[#666]">{session.messages.length} msg</span>
                  {session.provider && (
                    <>
                      <span className="text-[10px] text-[#666]">·</span>
                      <span className="text-[10px]" style={{ color: accentColor }}>{session.provider}</span>
                    </>
                  )}
                </div>
              </button>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onExport(session.id, 'json')}
                  className="text-[10px] px-2 py-1 rounded-md bg-[#1A1A1A] text-[#999] hover:text-white"
                  title="Export JSON"
                >
                  JSON
                </button>
                <button
                  onClick={() => onExport(session.id, 'txt')}
                  className="text-[10px] px-2 py-1 rounded-md bg-[#1A1A1A] text-[#999] hover:text-white"
                  title="Export TXT"
                >
                  TXT
                </button>
                <button
                  onClick={() => onDelete(session.id)}
                  className="text-[10px] px-2 py-1 rounded-md bg-[#1A0000] text-[#FF6D6D] hover:bg-[#2A0000] ml-auto"
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}

          {sessions.length > 0 && (
            <button
              onClick={() => { if (confirm('Delete all chat history?')) onClearAll(); }}
              className="w-full mt-4 py-2 text-[10px] text-[#666] font-mono hover:text-[#FF1744] transition-colors"
            >
              Clear all history
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import type { AppStats } from '../types';

interface StatsPanelProps {
  open: boolean;
  stats: AppStats;
  onReset: () => void;
  onClose: () => void;
  accentColor: string;
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StatsPanel({ open, stats, onReset, onClose, accentColor }: StatsPanelProps) {
  if (!open) return null;

  const fastest = stats.responseTimes.length ? Math.min(...stats.responseTimes) : 0;
  const slowest = stats.responseTimes.length ? Math.max(...stats.responseTimes) : 0;

  const cards = [
    { label: 'Total Messages', value: stats.totalMessages, icon: '💬' },
    { label: 'You Said', value: stats.totalUserMessages, icon: '🗣️' },
    { label: 'MYRA Replied', value: stats.totalMyraMessages, icon: '🤖' },
    { label: 'Words Exchanged', value: stats.totalWords.toLocaleString(), icon: '📝' },
    { label: 'Avg Response', value: formatTime(stats.avgResponseTimeMs), icon: '⏱️' },
    { label: 'Fastest Reply', value: fastest ? formatTime(fastest) : '—', icon: '⚡' },
    { label: 'Slowest Reply', value: slowest ? formatTime(slowest) : '—', icon: '🐢' },
    { label: 'Sessions', value: stats.sessionsCount, icon: '📂' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex justify-center items-start overflow-y-auto pt-6 pb-12 px-4">
      <div className="w-full max-w-md bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] p-5 space-y-4 my-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-xl tracking-wider">STATS</h2>
            <p className="text-[#666] text-[10px] font-mono">Since {formatDate(stats.lastReset)}</p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {cards.map(card => (
            <div key={card.label} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{card.icon}</span>
              </div>
              <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider">{card.label}</p>
              <p className="text-white text-lg font-black mt-0.5" style={{ color: accentColor }}>{card.value}</p>
            </div>
          ))}
        </div>

        {stats.responseTimes.length > 1 && (
          <div className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-xl p-3">
            <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-2">Recent Response Times</p>
            <div className="flex items-end gap-0.5 h-16">
              {stats.responseTimes.slice(-30).map((t, i) => {
                const max = Math.max(...stats.responseTimes.slice(-30));
                const height = (t / max) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all"
                    style={{ height: `${height}%`, backgroundColor: accentColor, opacity: 0.4 + (height / 100) * 0.6 }}
                    title={formatTime(t)}
                  />
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => { if (confirm('Reset all stats?')) onReset(); }}
          className="w-full py-2.5 rounded-xl text-sm font-bold border transition-colors"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          Reset Stats
        </button>
      </div>
    </div>
  );
}

import { AI_PROVIDERS } from '../types/providers';

interface AboutPanelProps {
  open: boolean;
  onClose: () => void;
  accentColor: string;
}

export default function AboutPanel({ open, onClose, accentColor }: AboutPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex justify-center items-start overflow-y-auto pt-12 pb-12 px-4">
      <div className="w-full max-w-md bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] p-6 space-y-5 my-4">
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl font-black"
            style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
          >
            M
          </div>
          <h2 className="text-white text-2xl font-black mt-3 tracking-[0.3em]">MYRA</h2>
          <p className="text-[#666] text-xs font-mono mt-1">AI Voice Assistant v2.0</p>
        </div>

        <div className="bg-[#111] rounded-xl p-4 space-y-2">
          <h3 className="text-[#999] text-xs font-mono uppercase tracking-wider">Features</h3>
          <ul className="text-sm text-[#CCC] space-y-1">
            {[
              '🎤 Voice Recognition (Web Speech API)',
              '🔊 Text-to-Speech with voice picker',
              '🤖 13 AI Providers support',
              '⚡ Streaming responses',
              '💾 Multi-session chat history',
              '📊 Stats & token tracking',
              '🎨 6 Theme options',
              '🔍 Chat search & filter',
              '📝 Markdown rendering',
              '🧠 Long-term memory',
              '🔊 Wake word detection',
              '📥 Export chats (JSON/TXT)',
              '⌨️ Keyboard shortcuts',
              '📱 PWA installable',
            ].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-xs">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#111] rounded-xl p-4">
          <h3 className="text-[#999] text-xs font-mono uppercase tracking-wider mb-2">AI Providers</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {AI_PROVIDERS.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs text-[#CCC]">
                <span style={{ color: p.color }}>{p.icon}</span>
                <span className="truncate">{p.shortName}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111] rounded-xl p-4">
          <h3 className="text-[#999] text-xs font-mono uppercase tracking-wider mb-2">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-1 text-xs text-[#CCC]">
            {[
              ['Ctrl + N', 'New chat'],
              ['Ctrl + S', 'Settings'],
              ['Ctrl + P', 'Providers'],
              ['Ctrl + T', 'Themes'],
              ['Ctrl + F', 'Search chat'],
              ['Ctrl + L', 'Toggle listening'],
              ['Escape', 'Close panels'],
              ['Enter', 'Send message'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center gap-1.5">
                <kbd className="bg-[#222] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#999]">{key}</kbd>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[#555] text-[10px] font-mono">
          Built with React + Tailwind + Gemini SDK
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-black tracking-wider text-sm text-black"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)` }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

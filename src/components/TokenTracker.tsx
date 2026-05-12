import { AI_PROVIDERS } from '../types/providers';

interface TokenTrackerProps {
  open: boolean;
  accentColor: string;
  stats: {
    requestCount: number;
    totalTokens: number;
    estimatedCost: number;
    providerBreakdown: Record<string, { count: number; tokens: number }>;
  };
  onClose: () => void;
  onReset: () => void;
}

const COST_PER_MILLION: Record<string, number> = {
  gemini: 0.075,
  groq: 0.59,
  xai: 5,
  openai: 0.15,
  deepseek: 0.27,
  anthropic: 3,
  mistral: 2,
  openrouter: 1,
  cohere: 2.5,
  perplexity: 2,
  together: 0.96,
  fireworks: 0.9,
  cerebras: 0.6,
};

export default function TokenTracker({ open, accentColor, stats, onClose, onReset }: TokenTrackerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex justify-center items-start overflow-y-auto pt-8 pb-12 px-4">
      <div className="w-full max-w-md bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] p-5 space-y-4 my-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-xl tracking-wider">TOKENS & COST</h2>
            <p className="text-[#666] text-[10px] font-mono">{stats.requestCount} requests made</p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111] rounded-xl p-4">
            <p className="text-[10px] text-[#666] font-mono uppercase">Total Requests</p>
            <p className="text-2xl font-black mt-1" style={{ color: accentColor }}>{stats.requestCount}</p>
          </div>
          <div className="bg-[#111] rounded-xl p-4">
            <p className="text-[10px] text-[#666] font-mono uppercase">Est. Cost</p>
            <p className="text-2xl font-black mt-1" style={{ color: accentColor }}>${stats.estimatedCost.toFixed(4)}</p>
          </div>
        </div>

        <div className="bg-[#111] rounded-xl p-4">
          <h3 className="text-[#999] text-xs font-mono uppercase tracking-wider mb-2">Provider Breakdown</h3>
          <div className="space-y-2">
            {AI_PROVIDERS.map(provider => {
              const data = stats.providerBreakdown[provider.id];
              const count = data?.count || 0;
              if (!count) return null;
              const cost = count * (COST_PER_MILLION[provider.id] || 1) / 1_000_000;
              return (
                <div key={provider.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span style={{ color: provider.color }}>{provider.icon}</span>
                    <span className="text-[#CCC]">{provider.shortName}</span>
                  </div>
                  <div className="text-[#888]">
                    {count} req · ${cost.toFixed(4)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#1A1A00] border border-[#FFE066] rounded-xl p-3">
          <p className="text-[#FFE066] text-xs font-mono">
            ⚠️ Token tracking is approximate. Actual costs may vary based on model and usage patterns.
          </p>
        </div>

        <button
          onClick={onReset}
          className="w-full py-2.5 rounded-xl text-sm font-bold border transition-colors"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          Reset Token Stats
        </button>
      </div>
    </div>
  );
}

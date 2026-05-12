import { useMemo, useState } from 'react';
import type { AppSettings, AIProvider } from '../types';
import { AI_PROVIDERS, PROVIDER_BY_ID, type ApiKeyField } from '../types/providers';

interface ProviderSettingsProps {
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
  onClose: () => void;
}

export default function ProviderSettings({ settings, onUpdate, onClose }: ProviderSettingsProps) {
  const [activeTab, setActiveTab] = useState<'provider' | 'keys'>('provider');
  const activeProvider = PROVIDER_BY_ID[settings.aiProvider] || PROVIDER_BY_ID.gemini;
  const activeModel = useMemo(() => {
    const modelExists = activeProvider.models.some(model => model.id === settings.aiModel);
    return modelExists ? settings.aiModel : activeProvider.defaultModel;
  }, [activeProvider, settings.aiModel]);

  const handleProviderChange = (provider: AIProvider) => {
    const nextProvider = PROVIDER_BY_ID[provider];
    onUpdate({ aiProvider: provider, aiModel: nextProvider.defaultModel });
  };

  const providerKeyValue = (field: ApiKeyField) => String(settings[field] || '');

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-start justify-center overflow-y-auto pt-8 pb-16">
      <div className="w-full max-w-md bg-[#0A0A0A] rounded-2xl border border-[#222] p-6 space-y-5 mx-4 my-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#FF1744] text-xl font-black tracking-wider">AI PROVIDER</h2>
            <p className="text-[#666] text-xs font-mono mt-1">10+ engines, one MYRA voice</p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('provider')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'provider'
                ? 'bg-[#FF1744] text-white shadow-[0_0_12px_rgba(255,23,68,0.3)]'
                : 'bg-[#111] text-[#777] border border-[#333]'
            }`}
          >
            Provider
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'keys'
                ? 'bg-[#FF1744] text-white shadow-[0_0_12px_rgba(255,23,68,0.3)]'
                : 'bg-[#111] text-[#777] border border-[#333]'
            }`}
          >
            API Keys
          </button>
        </div>

        {activeTab === 'provider' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {AI_PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderChange(provider.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    settings.aiProvider === provider.id
                      ? 'bg-[#1A0000] border-2 border-[#FF1744] shadow-[0_0_12px_rgba(255,23,68,0.2)]'
                      : 'bg-[#111] border-2 border-[#333] hover:border-[#555]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black"
                      style={{ backgroundColor: `${provider.color}22`, color: provider.color }}
                    >
                      {provider.icon}
                    </span>
                    <div className="min-w-0">
                      <span className="text-white font-bold text-xs block truncate">{provider.shortName}</span>
                      <span className="text-[#666] text-[10px] block">{provider.models.length} models</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="text-[#999] text-xs font-mono uppercase tracking-wider block mb-1.5">
                Active Model for {activeProvider.name}
              </label>
              <select
                value={activeModel}
                onChange={event => onUpdate({ aiModel: event.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-[#EEE] text-sm focus:border-[#FF1744] focus:outline-none transition-colors"
              >
                {activeProvider.models.map(model => (
                  <option key={model.id} value={model.id} className="bg-[#111]">
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#101010] border border-[#2A2A2A] rounded-xl p-3">
              <p className="text-[#999] text-xs font-mono">
                Active: <span className="text-[#FF1744]">{activeProvider.name}</span> / {activeProvider.models.find(model => model.id === activeModel)?.label || activeModel}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {AI_PROVIDERS.map(provider => (
              <div key={provider.id}>
                <label className="text-[#999] text-xs font-mono uppercase tracking-wider block mb-1.5">
                  <span style={{ color: provider.color }}>{provider.icon}</span> {provider.keyLabel}
                </label>
                <input
                  type="password"
                  value={providerKeyValue(provider.keyField)}
                  onChange={event => onUpdate({ [provider.keyField]: event.target.value } as Partial<AppSettings>)}
                  placeholder={provider.keyPlaceholder}
                  className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-[#EEE] text-sm focus:outline-none transition-colors placeholder:text-[#444]"
                  style={{ borderColor: settings.aiProvider === provider.id ? provider.color : undefined }}
                />
              </div>
            ))}

            <div className="bg-[#1A1A00] border border-[#FFE066] rounded-xl p-3 mt-4">
              <p className="text-[#FFE066] text-xs font-mono">
                Tip: Sirf selected provider ki key required hai. Browser apps mein kuch providers CORS block kar sakte hain, tab API proxy use karein.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-[#FF1744] to-[#D500F9] text-white py-3 rounded-xl font-black tracking-wider text-sm shadow-[0_0_20px_rgba(255,23,68,0.3)] hover:shadow-[0_0_30px_rgba(255,23,68,0.5)] transition-shadow"
        >
          DONE
        </button>
      </div>
    </div>
  );
}
import { useState } from 'react';
import type { AppSettings, ThemeId } from '../types';
import { THEMES } from '../types';
import { useTTS } from '../hooks/useTTS';

interface CustomizePanelProps {
  open: boolean;
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
  onClose: () => void;
  accentColor: string;
}

export default function CustomizePanel({ open, settings, onUpdate, onClose, accentColor }: CustomizePanelProps) {
  const [tab, setTab] = useState<'theme' | 'voice' | 'prompt' | 'advanced'>('theme');
  const { voices, speak, cancel } = useTTS(settings.voicePrefs);

  if (!open) return null;

  const previewVoice = () => {
    cancel();
    speak('Hi! Main MYRA hoon. Yeh meri awaaz ka preview hai.', () => {});
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex justify-center items-start overflow-y-auto pt-6 pb-12 px-4">
      <div className="w-full max-w-md bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] p-5 space-y-5 my-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-xl tracking-wider">CUSTOMIZE</h2>
            <p className="text-[#666] text-[10px] font-mono">Theme · Voice · Prompt · Advanced</p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(['theme', 'voice', 'prompt', 'advanced'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                tab === t ? 'text-black' : 'bg-[#111] text-[#777] border border-[#222]'
              }`}
              style={{ backgroundColor: tab === t ? accentColor : undefined }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'theme' && (
          <div className="space-y-3">
            <p className="text-[10px] text-[#666] font-mono uppercase">Pick accent theme</p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => onUpdate({ themeId: theme.id as ThemeId })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    settings.themeId === theme.id ? 'scale-105' : 'border-[#222]'
                  }`}
                  style={{ borderColor: settings.themeId === theme.id ? theme.primary : undefined }}
                >
                  <div className="flex justify-center gap-1 mb-1.5">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondary }} />
                  </div>
                  <p className="text-xs text-white font-semibold">{theme.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'voice' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#666] font-mono uppercase block mb-1.5">System Voice</label>
              <select
                value={settings.voicePrefs.voiceURI}
                onChange={e => onUpdate({ voicePrefs: { ...settings.voicePrefs, voiceURI: e.target.value } })}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-[#EEE] text-sm focus:outline-none"
                style={{ borderColor: accentColor }}
              >
                <option value="">Auto (best match)</option>
                {voices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-[#111]">
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#555] mt-1 font-mono">{voices.length} voices available</p>
            </div>

            <div>
              <label className="text-[10px] text-[#666] font-mono uppercase block mb-1">
                Speed: <span style={{ color: accentColor }}>{settings.voicePrefs.rate.toFixed(2)}x</span>
              </label>
              <input
                type="range" min="0.5" max="2" step="0.05"
                value={settings.voicePrefs.rate}
                onChange={e => onUpdate({ voicePrefs: { ...settings.voicePrefs, rate: parseFloat(e.target.value) } })}
                className="w-full accent-current"
                style={{ accentColor }}
              />
            </div>

            <div>
              <label className="text-[10px] text-[#666] font-mono uppercase block mb-1">
                Pitch: <span style={{ color: accentColor }}>{settings.voicePrefs.pitch.toFixed(2)}</span>
              </label>
              <input
                type="range" min="0.5" max="2" step="0.05"
                value={settings.voicePrefs.pitch}
                onChange={e => onUpdate({ voicePrefs: { ...settings.voicePrefs, pitch: parseFloat(e.target.value) } })}
                className="w-full"
                style={{ accentColor }}
              />
            </div>

            <div>
              <label className="text-[10px] text-[#666] font-mono uppercase block mb-1">
                Volume: <span style={{ color: accentColor }}>{Math.round(settings.voicePrefs.volume * 100)}%</span>
              </label>
              <input
                type="range" min="0" max="1" step="0.05"
                value={settings.voicePrefs.volume}
                onChange={e => onUpdate({ voicePrefs: { ...settings.voicePrefs, volume: parseFloat(e.target.value) } })}
                className="w-full"
                style={{ accentColor }}
              />
            </div>

            <button
              onClick={previewVoice}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-black"
              style={{ backgroundColor: accentColor }}
            >
              🔊 Preview Voice
            </button>
          </div>
        )}

        {tab === 'prompt' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-[#666] font-mono uppercase block mb-1.5">Custom System Prompt (optional)</label>
              <textarea
                value={settings.customSystemPrompt}
                onChange={e => onUpdate({ customSystemPrompt: e.target.value })}
                placeholder="e.g. You are MYRA, a sarcastic but kind AI..."
                rows={6}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-[#EEE] text-sm focus:outline-none placeholder:text-[#444]"
                style={{ borderColor: accentColor }}
              />
              <p className="text-[10px] text-[#555] mt-1 font-mono">
                Leave empty to use personality preset. This appends to the system prompt.
              </p>
            </div>
            <div>
              <label className="text-[10px] text-[#666] font-mono uppercase block mb-1.5">Language Code</label>
              <select
                value={settings.language}
                onChange={e => onUpdate({ language: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-[#EEE] text-sm"
                style={{ borderColor: accentColor }}
              >
                <option value="en-IN">English (India) – en-IN</option>
                <option value="en-US">English (US) – en-US</option>
                <option value="en-GB">English (UK) – en-GB</option>
                <option value="hi-IN">Hindi – hi-IN</option>
                <option value="es-ES">Spanish – es-ES</option>
                <option value="fr-FR">French – fr-FR</option>
                <option value="de-DE">German – de-DE</option>
                <option value="ja-JP">Japanese – ja-JP</option>
              </select>
            </div>
          </div>
        )}

        {tab === 'advanced' && (
          <div className="space-y-3">
            {[
              { key: 'streamingEnabled' as const, label: 'Streaming Responses', sub: 'Stream tokens as they arrive (faster feel)' },
              { key: 'wakeWordEnabled' as const, label: 'Wake Word Detection', sub: 'Background mic listens for "Hey MYRA"' },
              { key: 'hapticEnabled' as const, label: 'Haptic Feedback', sub: 'Vibrate on actions (mobile)' },
              { key: 'saveHistory' as const, label: 'Save Chat History', sub: 'Keep sessions across reloads' },
            ].map(toggle => (
              <button
                key={toggle.key}
                onClick={() => onUpdate({ [toggle.key]: !settings[toggle.key] } as Partial<AppSettings>)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#111] border border-[#222] hover:border-[#444] transition-colors"
              >
                <div className="text-left">
                  <p className="text-white text-sm font-semibold">{toggle.label}</p>
                  <p className="text-[10px] text-[#666] font-mono">{toggle.sub}</p>
                </div>
                <div
                  className="w-10 h-6 rounded-full p-0.5 transition-colors"
                  style={{ backgroundColor: settings[toggle.key] ? accentColor : '#222' }}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white transition-transform"
                    style={{ transform: settings[toggle.key] ? 'translateX(16px)' : 'translateX(0)' }}
                  />
                </div>
              </button>
            ))}

            <div>
              <label className="text-[10px] text-[#666] font-mono uppercase block mb-1.5 mt-3">Wake Word Phrase</label>
              <input
                type="text"
                value={settings.wakeWord}
                onChange={e => onUpdate({ wakeWord: e.target.value.toLowerCase() })}
                placeholder="hey myra"
                className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-[#EEE] text-sm focus:outline-none"
                style={{ borderColor: accentColor }}
              />
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-black tracking-wider text-sm text-black"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${THEMES.find(t => t.id === settings.themeId)?.secondary || accentColor})` }}
        >
          DONE
        </button>
      </div>
    </div>
  );
}

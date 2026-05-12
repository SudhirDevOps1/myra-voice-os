import { useState } from 'react';
import {
  AppSettings,
  PersonalityMode,
  GeminiModel,
  GeminiVoice,
  PrimeContact,
  GEMINI_MODELS,
  GEMINI_VOICES,
  PERSONALITY_LABELS,
} from '../types';
import MyraLogo from './MyraLogo';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
  onAddPrimeContact: (contact: PrimeContact) => void;
  onRemovePrimeContact: (index: number) => void;
  onClose: () => void;
}

export default function SettingsPanel({
  settings,
  onUpdate,
  onAddPrimeContact,
  onRemovePrimeContact,
  onClose,
}: SettingsPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');

  const handleSave = () => {
    onClose();
    // Show toast-like notification via DOM
    const toast = document.createElement('div');
    toast.textContent = '✅ Settings saved! Restart app to apply changes.';
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#00E676] text-black px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-lg';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleAddContact = () => {
    if (newName.trim() && newNumber.trim()) {
      onAddPrimeContact({ name: newName.trim(), number: newNumber.trim() });
      setNewName('');
      setNewNumber('');
      setShowAddDialog(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-start justify-center overflow-y-auto pt-8 pb-16">
      <div className="w-full max-w-md bg-[#0A0A0A] rounded-2xl border border-[#222] p-6 space-y-5 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MyraLogo size={28} accent="#FF1744" />
            <h2 className="text-[#FF1744] text-xl font-black tracking-wider">SETTINGS</h2>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* API Key */}
        <div>
          <label className="text-[#999] text-xs font-mono uppercase tracking-wider block mb-1.5">Gemini API Key</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={e => onUpdate({ apiKey: e.target.value })}
            placeholder="Enter your API key..."
            className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-[#EEE] text-sm focus:border-[#FF1744] focus:outline-none transition-colors placeholder:text-[#444]"
          />
        </div>

        {/* User Name */}
        <div>
          <label className="text-[#999] text-xs font-mono uppercase tracking-wider block mb-1.5">Your Name</label>
          <input
            type="text"
            value={settings.userName}
            onChange={e => onUpdate({ userName: e.target.value })}
            placeholder="Enter your name..."
            className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-[#EEE] text-sm focus:border-[#FF1744] focus:outline-none transition-colors placeholder:text-[#444]"
          />
        </div>

        {/* AI Model */}
        <div>
          <label className="text-[#999] text-xs font-mono uppercase tracking-wider block mb-1.5">AI Model</label>
          <select
            value={settings.geminiModel}
            onChange={e => onUpdate({ geminiModel: e.target.value as GeminiModel })}
            className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-[#EEE] text-sm focus:border-[#FF1744] focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            {GEMINI_MODELS.map(m => (
              <option key={m.value} value={m.value} className="bg-[#111]">{m.label}</option>
            ))}
          </select>
        </div>

        {/* Voice */}
        <div>
          <label className="text-[#999] text-xs font-mono uppercase tracking-wider block mb-1.5">Voice</label>
          <select
            value={settings.geminiVoice}
            onChange={e => onUpdate({ geminiVoice: e.target.value as GeminiVoice })}
            className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-[#EEE] text-sm focus:border-[#FF1744] focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            {GEMINI_VOICES.map(v => (
              <option key={v.value} value={v.value} className="bg-[#111]">{v.label}</option>
            ))}
          </select>
        </div>

        {/* Personality */}
        <div>
          <label className="text-[#999] text-xs font-mono uppercase tracking-wider block mb-1.5">Personality</label>
          <div className="flex gap-2">
            {(Object.keys(PERSONALITY_LABELS) as PersonalityMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => onUpdate({ personalityMode: mode })}
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  settings.personalityMode === mode
                    ? 'bg-[#FF1744] text-white shadow-[0_0_12px_rgba(255,23,68,0.3)]'
                    : 'bg-[#111] text-[#777] border border-[#333] hover:border-[#FF1744]/50'
                }`}
              >
                {PERSONALITY_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* Prime Contacts */}
        <div>
          <label className="text-[#999] text-xs font-mono uppercase tracking-wider block mb-1.5">
            ⭐ Prime Contacts
          </label>
          <div className="space-y-2 mb-2">
            {settings.primeContacts.map((contact, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#1A0000] border border-[#FF1744]/20 rounded-xl px-4 py-2.5"
              >
                <div>
                  <span className="text-[#EEE] text-sm font-semibold">{contact.name}</span>
                  <span className="text-[#666] text-xs ml-3">{contact.number}</span>
                </div>
                <button
                  onClick={() => onRemovePrimeContact(i)}
                  className="text-[#FF1744] hover:text-[#ff4569] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="w-full bg-[#111] border border-dashed border-[#FF1744]/30 rounded-xl px-4 py-2.5 text-[#FF1744] text-sm font-semibold hover:bg-[#1A0000] transition-colors"
          >
            + ADD PRIME CONTACT
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-[#FF1744] to-[#D500F9] text-white py-3 rounded-xl font-black tracking-wider text-sm shadow-[0_0_20px_rgba(255,23,68,0.3)] hover:shadow-[0_0_30px_rgba(255,23,68,0.5)] transition-shadow"
        >
          SAVE SETTINGS
        </button>
      </div>

      {/* Add Contact Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center">
          <div className="bg-[#0A0A0A] rounded-2xl border border-[#333] p-6 w-[90%] max-w-sm space-y-4">
            <h3 className="text-[#FF1744] font-bold text-lg">Add Prime Contact</h3>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Name"
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-[#EEE] text-sm focus:border-[#FF1744] focus:outline-none placeholder:text-[#444]"
            />
            <input
              type="text"
              value={newNumber}
              onChange={e => setNewNumber(e.target.value)}
              placeholder="Phone Number (+91...)"
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-[#EEE] text-sm focus:border-[#FF1744] focus:outline-none placeholder:text-[#444]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddDialog(false)}
                className="flex-1 bg-[#111] border border-[#333] text-[#999] py-2.5 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                className="flex-1 bg-[#FF1744] text-white py-2.5 rounded-xl text-sm font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

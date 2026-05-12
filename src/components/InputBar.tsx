import { useState, KeyboardEvent } from 'react';

interface InputBarProps {
  onSend: (text: string) => void;
  accentColor: string;
  disabled?: boolean;
}

export default function InputBar({ onSend, accentColor, disabled }: InputBarProps) {
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex gap-2 items-center px-3 py-2">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={disabled ? 'Connect to chat...' : 'Type a message...'}
        disabled={disabled}
        className="flex-1 bg-[#0E0E0E] border rounded-full px-4 py-2.5 text-sm text-white focus:outline-none placeholder:text-[#555] disabled:opacity-50"
        style={{ borderColor: `${accentColor}55` }}
      />
      <button
        onClick={submit}
        disabled={disabled || !text.trim()}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
        style={{ backgroundColor: accentColor }}
        aria-label="Send"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}

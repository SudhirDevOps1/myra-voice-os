import { useState, useCallback, useRef } from 'react';

interface MicButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  onPress: () => void;
  onLongPress: () => void;
  className?: string;
}

export default function MicButton({
  isListening,
  isSpeaking,
  isMuted,
  onPress,
  onLongPress,
  className = '',
}: MicButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const pressTimerRef = useRef<number | null>(null);

  const handlePointerDown = useCallback(() => {
    setIsPressed(true);
    pressTimerRef.current = window.setTimeout(() => {
      onLongPress();
      setIsPressed(false);
    }, 600);
  }, [onLongPress]);

  const handlePointerUp = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (isPressed) {
      onPress();
    }
    setIsPressed(false);
  }, [isPressed, onPress]);

  const handlePointerLeave = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsPressed(false);
  }, []);

  const getIcon = () => {
    if (isMuted) {
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    }
    if (isSpeaking) {
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D500F9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      );
    }
    if (isListening) {
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF1744" stroke="#FF1744" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    }
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    );
  };

  const getRingColor = () => {
    if (isMuted) return 'border-[#333]';
    if (isSpeaking) return 'border-[#D500F9] shadow-[0_0_20px_rgba(213,0,249,0.4)]';
    if (isListening) return 'border-[#FF1744] shadow-[0_0_20px_rgba(255,23,68,0.4)] animate-pulse';
    return 'border-[#FF1744]/40';
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`
          w-[72px] h-[72px] rounded-full 
          bg-[#0A0A0A] border-2
          flex items-center justify-center
          transition-all duration-200
          active:scale-95
          ${getRingColor()}
          ${isPressed ? 'scale-90' : ''}
        `}
        aria-label={isMuted ? 'Unmute microphone' : isListening ? 'Stop listening' : 'Start listening'}
      >
        {getIcon()}
      </button>
      <span className="text-[11px] text-[#555555] font-mono">
        {isMuted ? 'Muted 🔇' : isSpeaking ? 'Bol rahi hoon... 💜' : isListening ? 'Sun rahi hoon... 🔴' : 'Long press to stop'}
      </span>
    </div>
  );
}

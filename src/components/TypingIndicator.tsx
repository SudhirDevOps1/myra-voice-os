import { useEffect, useRef, useState } from 'react';

interface TypingIndicatorProps {
  active: boolean;
  accentColor: string;
}

const DOT_WORDS = ['', '.', '..', '...'];

export default function TypingIndicator({ active, accentColor }: TypingIndicatorProps) {
  const [dotIndex, setDotIndex] = useState(0);
  const intervalRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setDotIndex(0);
      return;
    }
    setDotIndex(0);
    intervalRef.current = window.setInterval(() => {
      setDotIndex(prev => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(intervalRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <div className="flex justify-start px-3">
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                backgroundColor: accentColor,
                animationDelay: `${i * 150}ms`,
                animationDuration: '0.6s',
              }}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono" style={{ color: `${accentColor}80` }}>
          {DOT_WORDS[dotIndex]}
        </span>
      </div>
    </div>
  );
}

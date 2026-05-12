import { useRef, useEffect, useState } from 'react';

interface WaveformViewProps {
  amplitude: number;
  isActive: boolean;
  className?: string;
}

const BAR_COUNT = 20;

export default function WaveformView({ amplitude, isActive, className = '' }: WaveformViewProps) {
  const [barHeights, setBarHeights] = useState<number[]>(Array(BAR_COUNT).fill(3));
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    let running = true;

    const animate = () => {
      if (!running) return;
      setBarHeights(prev => {
        return prev.map((h, i) => {
          const seed = Math.sin(i * 0.7 + Date.now() * 0.005) * 0.5 + 0.5;
          const target = isActive
            ? Math.max(3, seed * amplitude * 35 + amplitude * 15)
            : Math.max(3, seed * 8 + 2);
          return h + (target - h) * 0.3;
        });
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [amplitude, isActive]);

  return (
    <div className={`flex items-end justify-center gap-[2px] ${className}`} style={{ height: '40px', width: '200px' }}>
      {barHeights.map((h, i) => (
        <div
          key={i}
          className="rounded-full transition-colors duration-200"
          style={{
            width: '5px',
            height: `${Math.min(h, 38)}px`,
            backgroundColor: `rgba(255, 23, 68, ${isActive ? 0.6 + (h / 38) * 0.4 : 0.3 + (h / 38) * 0.2})`,
            boxShadow: isActive && h > 10 ? '0 0 6px rgba(255, 23, 68, 0.4)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

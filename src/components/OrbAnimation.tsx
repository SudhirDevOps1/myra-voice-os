import { useRef, useEffect, useCallback } from 'react';
import { OrbState } from '../types';

interface OrbAnimationProps {
  state: OrbState;
  amplitude: number;
  className?: string;
}

export default function OrbAnimation({ state, amplitude, className = '' }: OrbAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const waveOffsetRef = useRef(0);
  const pulseScaleRef = useRef(1);
  const pulseDirRef = useRef(1);
  const particlesRef = useRef<Array<{ angle: number; radius: number; speed: number; size: number }>>([]);

  const getColors = useCallback((s: OrbState) => {
    switch (s) {
      case 'idle': return { primary: '#B71C1C', secondary: '#880E4F', glow: '#FF1744' };
      case 'listening': return { primary: '#FF1744', secondary: '#D500F9', glow: '#FF1744' };
      case 'speaking': return { primary: '#E040FB', secondary: '#FF1744', glow: '#D500F9' };
      case 'thinking': return { primary: '#40C4FF', secondary: '#00B0FF', glow: '#40C4FF' };
      case 'active': return { primary: '#FF1744', secondary: '#D500F9', glow: '#FF1744' };
      default: return { primary: '#B71C1C', secondary: '#880E4F', glow: '#FF1744' };
    }
  }, []);

  useEffect(() => {
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 12 }, (_, i) => ({
        angle: (i / 12) * Math.PI * 2,
        radius: 0.65 + Math.random() * 0.2,
        speed: 0.003 + Math.random() * 0.006,
        size: 2 + Math.random() * 3,
      }));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.28;

      ctx.clearRect(0, 0, w, h);

      const colors = getColors(state);
      rotationRef.current += 0.005;
      waveOffsetRef.current += 0.03;
      if (pulseDirRef.current > 0) {
        pulseScaleRef.current += 0.0015;
        if (pulseScaleRef.current >= 1.15) pulseDirRef.current = -1;
      } else {
        pulseScaleRef.current -= 0.0015;
        if (pulseScaleRef.current <= 1.0) pulseDirRef.current = 1;
      }

      const pulseMultiplier = state === 'idle' ? pulseScaleRef.current : 1.0;
      const speakingBoost = state === 'speaking' ? 1 + amplitude * 0.3 : 1;
      const radius = baseRadius * pulseMultiplier * speakingBoost;

      // 1. Radial glow
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.6);
      glowGrad.addColorStop(0, colors.glow + '60');
      glowGrad.addColorStop(0.5, colors.glow + '15');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Core orb
      const orbGrad = ctx.createRadialGradient(cx - radius * 0.25, cy - radius * 0.25, radius * 0.05, cx, cy, radius);
      orbGrad.addColorStop(0, '#FFFFFF');
      orbGrad.addColorStop(0.15, colors.primary);
      orbGrad.addColorStop(0.5, colors.secondary);
      orbGrad.addColorStop(0.85, '#0A0000');
      orbGrad.addColorStop(1, '#050505');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      // Border ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = colors.glow + '80';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Rotating rings
      for (let i = 0; i < 3; i++) {
        const ringRadius = radius * (0.82 + i * 0.13);
        const rotation = rotationRef.current * (1 + i * 0.7);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 1.5);
        ctx.strokeStyle = colors.glow + (state === 'idle' ? '30' : '50');
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 25]);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Wave rings (sine distortion)
      if (state === 'listening' || state === 'speaking') {
        for (let w = 0; w < 2; w++) {
          const waveRadius = radius * (1.15 + w * 0.15);
          const waveAmplitude = amplitude * 8 * (w + 1);
          ctx.beginPath();
          for (let a = 0; a < Math.PI * 2; a += 0.02) {
            const r = waveRadius + Math.sin(a * 6 + waveOffsetRef.current * (w + 1)) * waveAmplitude;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            if (a === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = colors.glow + '40';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // 5. Thinking arc
      if (state === 'thinking') {
        for (let t = 0; t < 2; t++) {
          const arcRadius = radius * 0.75;
          const arcRot = rotationRef.current * 3 * (t === 0 ? 1 : -1);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(arcRot);
          ctx.beginPath();
          ctx.arc(0, 0, arcRadius, 0, Math.PI * 1.3);
          ctx.strokeStyle = colors.glow + '90';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([10, 15]);
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }
      }

      // 6. Particles
      if (state === 'active' || state === 'speaking') {
        const particles = particlesRef.current;
        for (const p of particles) {
          p.angle += p.speed;
          const px = cx + Math.cos(p.angle) * radius * p.radius;
          const py = cy + Math.sin(p.angle) * radius * p.radius;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = colors.glow + 'C0';
          ctx.fill();
          // Glow
          ctx.beginPath();
          ctx.arc(px, py, p.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = colors.glow + '20';
          ctx.fill();
        }
      }

      // 7. Inner highlight
      const hlGrad = ctx.createRadialGradient(
        cx - radius * 0.35, cy - radius * 0.35, 0,
        cx, cy, radius * 0.7
      );
      hlGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
      hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = hlGrad;
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, amplitude, getColors]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className={`block ${className}`}
      style={{ width: '260px', height: '260px' }}
    />
  );
}

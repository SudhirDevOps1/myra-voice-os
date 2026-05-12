import { useId } from 'react';

interface MyraLogoProps {
  size?: number;
  className?: string;
  accent?: string;
}

export default function MyraLogo({ size = 40, className = '', accent = '#FF1744' }: MyraLogoProps) {
  const uid = useId();
  const glowId = `myraGlow-${uid}`;
  const ringId = `myraRing-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={glowId} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="18%" stopColor={accent} stopOpacity="1" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.72" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.95" />
        </radialGradient>
        <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={`url(#${glowId})`} />
      <circle cx="32" cy="32" r="21" fill="none" stroke={`url(#${ringId})`} strokeWidth="2" opacity="0.7" />
      <circle cx="24" cy="22" r="6" fill="#fff" opacity="0.22" />
      <path d="M21 41c3-5 7-7 11-7s8 2 11 7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <circle cx="32" cy="32" r="3" fill="#fff" opacity="0.95" />
    </svg>
  );
}
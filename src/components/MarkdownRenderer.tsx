import { useMemo } from 'react';

interface MarkdownRendererProps {
  text: string;
  accentColor?: string;
}

interface Token {
  type: 'p' | 'code' | 'h1' | 'h2' | 'h3' | 'list' | 'quote';
  content: string;
  language?: string;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: 'code', content: codeLines.join('\n'), language });
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) { tokens.push({ type: 'h3', content: line.slice(4) }); i++; continue; }
    if (line.startsWith('## '))  { tokens.push({ type: 'h2', content: line.slice(3) }); i++; continue; }
    if (line.startsWith('# '))   { tokens.push({ type: 'h1', content: line.slice(2) }); i++; continue; }

    // Quote
    if (line.startsWith('> ')) {
      tokens.push({ type: 'quote', content: line.slice(2) });
      i++;
      continue;
    }

    // List
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const listLines: string[] = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
        listLines.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''));
        i++;
      }
      tokens.push({ type: 'list', content: listLines.join('\n') });
      continue;
    }

    // Paragraph (collect non-empty consecutive lines)
    if (line.trim()) {
      const paraLines = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !lines[i].startsWith('```') && !/^[#>]/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) {
        paraLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: 'p', content: paraLines.join(' ') });
      continue;
    }

    i++;
  }

  return tokens;
}

function renderInline(text: string, accent: string) {
  // Replace inline code, bold, italic, links
  const parts: (string | { type: string; content: string; href?: string })[] = [];
  let remaining = text;
  const patterns: Array<{ regex: RegExp; type: string; getHref?: (m: RegExpMatchArray) => string }> = [
    { regex: /`([^`]+)`/, type: 'code' },
    { regex: /\*\*([^*]+)\*\*/, type: 'bold' },
    { regex: /\*([^*]+)\*/, type: 'italic' },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/, type: 'link', getHref: (m) => m[2] },
  ];

  while (remaining.length) {
    let earliest = -1;
    let pattern: typeof patterns[0] | null = null;
    let match: RegExpMatchArray | null = null;

    for (const p of patterns) {
      const m = remaining.match(p.regex);
      if (m && m.index !== undefined && (earliest === -1 || m.index < earliest)) {
        earliest = m.index;
        pattern = p;
        match = m;
      }
    }

    if (!match || !pattern) {
      parts.push(remaining);
      break;
    }

    if (earliest > 0) parts.push(remaining.slice(0, earliest));
    parts.push({
      type: pattern.type,
      content: match[1],
      href: pattern.getHref ? pattern.getHref(match) : undefined,
    });
    remaining = remaining.slice(earliest + match[0].length);
  }

  return parts.map((part, idx) => {
    if (typeof part === 'string') return <span key={idx}>{part}</span>;
    if (part.type === 'code') {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-black/40 text-[12px]" style={{ color: accent }}>
          {part.content}
        </code>
      );
    }
    if (part.type === 'bold') return <strong key={idx} className="font-bold text-white">{part.content}</strong>;
    if (part.type === 'italic') return <em key={idx} className="italic opacity-90">{part.content}</em>;
    if (part.type === 'link') {
      return (
        <a key={idx} href={part.href} target="_blank" rel="noreferrer" className="underline hover:opacity-80" style={{ color: accent }}>
          {part.content}
        </a>
      );
    }
    return null;
  });
}

export default function MarkdownRenderer({ text, accentColor = '#FF1744' }: MarkdownRendererProps) {
  const tokens = useMemo(() => tokenize(text), [text]);

  return (
    <div className="space-y-2 leading-relaxed text-sm">
      {tokens.map((tok, idx) => {
        switch (tok.type) {
          case 'code':
            return (
              <pre key={idx} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-[11px] font-mono overflow-x-auto" style={{ color: accentColor }}>
                {tok.language && (
                  <div className="text-[9px] uppercase tracking-wider opacity-60 mb-1">{tok.language}</div>
                )}
                <code>{tok.content}</code>
              </pre>
            );
          case 'h1':
            return <h3 key={idx} className="text-base font-black tracking-wide" style={{ color: accentColor }}>{tok.content}</h3>;
          case 'h2':
            return <h4 key={idx} className="text-sm font-bold" style={{ color: accentColor }}>{tok.content}</h4>;
          case 'h3':
            return <h5 key={idx} className="text-sm font-semibold opacity-90">{tok.content}</h5>;
          case 'quote':
            return (
              <blockquote key={idx} className="border-l-2 pl-3 italic opacity-80" style={{ borderColor: accentColor }}>
                {renderInline(tok.content, accentColor)}
              </blockquote>
            );
          case 'list':
            return (
              <ul key={idx} className="list-disc list-inside space-y-1 pl-1">
                {tok.content.split('\n').map((item, j) => (
                  <li key={j}>{renderInline(item, accentColor)}</li>
                ))}
              </ul>
            );
          default:
            return <p key={idx}>{renderInline(tok.content, accentColor)}</p>;
        }
      })}
    </div>
  );
}

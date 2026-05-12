import { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatPanelProps {
  messages: ChatMessage[];
  className?: string;
  accentColor?: string;
  streamingText?: string;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ messages, className = '', accentColor = '#FF1744', streamingText }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto space-y-3 px-3 py-2 ${className}`}
      style={{ height: '200px', scrollBehavior: 'smooth' }}
    >
      {messages.length === 0 && !streamingText && (
        <div className="flex items-center justify-center h-full">
          <p className="text-[#555555] text-sm font-mono">Tap karke bolo 💬</p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} group`}
        >
          {!msg.isUser && (
            <div
              className="w-3 h-3 rounded-full mr-2 mt-1.5 flex-shrink-0"
              style={{ backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}80` }}
            />
          )}
          <div
            className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed relative ${
              msg.isUser
                ? 'bg-[#1A0000] border text-[#EEEEEE] rounded-br-md'
                : 'bg-[#111111] border border-[#222] text-[#DDDDDD] rounded-bl-md'
            }`}
            style={msg.isUser ? { borderColor: `${accentColor}55` } : undefined}
          >
            {msg.isUser ? (
              <p className="whitespace-pre-wrap">{msg.text}</p>
            ) : (
              <MarkdownRenderer text={msg.text} accentColor={accentColor} />
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-[#555]">{formatTime(msg.timestamp)}</span>
              <button
                onClick={() => copy(msg.text)}
                className="text-[10px] text-[#555] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      ))}

      {streamingText && (
        <div className="flex justify-start">
          <div
            className="w-3 h-3 rounded-full mr-2 mt-1.5 flex-shrink-0 animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
          <div className="max-w-[78%] px-3.5 py-2.5 rounded-2xl bg-[#111111] border border-[#222] text-[#DDDDDD] text-sm">
            <MarkdownRenderer text={streamingText} accentColor={accentColor} />
            <span className="inline-block w-1.5 h-3 ml-1 align-middle animate-pulse" style={{ backgroundColor: accentColor }} />
          </div>
        </div>
      )}
    </div>
  );
}

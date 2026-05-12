import type { QuickAction } from '../types';

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (prompt: string) => void;
  accentColor: string;
}

export default function QuickActions({ actions, onAction, accentColor }: QuickActionsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-1 hide-scrollbar">
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => onAction(action.prompt)}
          className="flex items-center gap-1.5 flex-shrink-0 bg-[#0E0E0E] border rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95"
          style={{
            borderColor: `${accentColor}33`,
            color: '#DDD',
          }}
          title={action.prompt}
        >
          <span className="text-base">{action.emoji}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

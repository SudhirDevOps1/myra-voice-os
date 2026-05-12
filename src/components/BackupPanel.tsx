import { useState } from 'react';

interface BackupPanelProps {
  open: boolean;
  accentColor: string;
  onClose: () => void;
  onImport: (data: any) => void;
}

export default function BackupPanel({ open, accentColor, onClose, onImport }: BackupPanelProps) {
  const [exporting, setExporting] = useState(false);

  if (!open) return null;

  const collectData = () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('myra_')) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  };

  const handleExport = () => {
    setExporting(true);
    const data = collectData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myra-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    onClose();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onImport(data);
        onClose();
      } catch {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex justify-center items-start overflow-y-auto pt-8 pb-12 px-4">
      <div className="w-full max-w-md bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] p-5 space-y-4 my-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-xl tracking-wider">BACKUP</h2>
            <p className="text-[#666] text-[10px] font-mono">Export & Import all MYRA data</p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="bg-[#111] rounded-xl p-4 space-y-4">
          <div>
            <h3 className="text-white text-sm font-semibold mb-1">📥 Export All Data</h3>
            <p className="text-[#666] text-xs font-mono mb-3">Settings, chats, memory, stats — everything</p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full py-3 rounded-xl text-sm font-bold text-black transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {exporting ? 'Preparing...' : 'Download Backup JSON'}
            </button>
          </div>

          <div className="border-t border-[#222]" />

          <div>
            <h3 className="text-white text-sm font-semibold mb-1">📤 Import Backup</h3>
            <p className="text-[#666] text-xs font-mono mb-3">Restore from a previous MYRA backup file</p>
            <label
              className="flex items-center justify-center w-full py-12 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
              style={{ borderColor: `${accentColor}33` }}
            >
              <div className="text-center">
                <span className="text-3xl">📁</span>
                <p className="text-[#999] text-xs font-mono mt-2">Click or drop a .json backup file</p>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          <div className="bg-[#1A0000] border border-[#FF1744] rounded-xl p-3">
            <p className="text-[#FF6D6D] text-xs font-mono">
              ⚠️ Import will overwrite current data. Make a backup first!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

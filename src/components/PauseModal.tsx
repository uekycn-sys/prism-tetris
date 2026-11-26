import { Home, Play, RotateCcw, Settings } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onReturnMenu: () => void;
}

export function PauseModal({
  onResume,
  onRestart,
  onOpenSettings,
  onReturnMenu,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="游戏已暂停"
    >
      <div className="glass-modal animate-modal w-full max-w-xs rounded-3xl p-6 text-center">
        <p className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
          PAUSED
        </p>
        <h2 className="font-display mt-1 text-2xl font-bold">游戏暂停</h2>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold shadow-md transition-transform hover:scale-[1.01]"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <Play className="h-4 w-4 fill-current" />
            继续游戏
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="glass-panel flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium hover:bg-white/5"
          >
            <RotateCcw className="h-4 w-4" />
            重新开始 (R)
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="glass-panel flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium hover:bg-white/5"
          >
            <Settings className="h-4 w-4" />
            游戏设置
          </button>

          <button
            type="button"
            onClick={onReturnMenu}
            className="glass-panel flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Home className="h-4 w-4" />
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Flame,
  Infinity as InfinityIcon,
  Palette,
  Play,
  Settings as SettingsIcon,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { THEME_ORDER, THEMES } from '../renderer/themes';
import { formatDurationMs, type LeaderboardMap } from '../storage/persistence';
import type { GameMode, Settings, ThemeId } from '../types/game';

interface MainMenuProps {
  settings: Settings;
  leaderboards: LeaderboardMap;
  onStartMode: (mode: GameMode) => void;
  onSelectTheme: (theme: ThemeId) => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

interface ModeMeta {
  id: GameMode;
  title: string;
  tag: string;
  desc: string;
  icon: typeof Trophy;
}

const MODES: ModeMeta[] = [
  {
    id: 'marathon',
    title: '马拉松',
    tag: '1–20 级',
    desc: '经典 Guideline 变速模式，每消除 10 行提升一级下落速度。',
    icon: Flame,
  },
  {
    id: 'sprint',
    title: '40 行竞速',
    tag: '极速竞速',
    desc: '以最快速度消除 40 行，精准毫秒计时与实时 PPS 统计。',
    icon: Timer,
  },
  {
    id: 'ultra',
    title: '2 分钟极速',
    tag: '120 秒',
    desc: '限时 120 秒冲击最高分，连击 T-Spin、四消与 B2B 加成。',
    icon: Zap,
  },
  {
    id: 'zen',
    title: '禅意无尽',
    tag: '无尽解压',
    desc: '永不 Game Over，触顶自动渐隐底部，适合练习 T-Spin 摆型。',
    icon: InfinityIcon,
  },
];

export function MainMenu({
  settings,
  leaderboards,
  onStartMode,
  onSelectTheme,
  onToggleMute,
  onOpenSettings,
}: MainMenuProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('marathon');
  const activeRecords = leaderboards[selectedMode];

  const getPersonalBestLabel = (mode: GameMode): string => {
    const top = leaderboards[mode][0];
    if (!top) return '暂无记录';
    if (mode === 'sprint') return `最佳 ${formatDurationMs(top.elapsedMs)}`;
    return `最高 ${top.score.toLocaleString()}`;
  };

  const selectedMeta = MODES.find((m) => m.id === selectedMode)!;

  return (
    <div
      className="relative flex h-dvh w-screen flex-col items-center justify-center overflow-hidden px-3 sm:px-6"
      style={{
        paddingTop: 'max(0.75rem, var(--sat))',
        paddingBottom: 'max(0.75rem, var(--sab))',
      }}
    >
      <div className="glass-modal animate-modal modal-scroll flex max-h-full w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-3xl p-4 sm:gap-6 sm:p-7">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <span className="font-display text-lg font-bold">P</span>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  PRISM TETRIS
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  现代竞技规范 · SRS 踢墙 · T-Spin · 144Hz 丝滑适配
                </p>
              </div>
            </div>
          </div>

          {/* Theme Switcher + Quick Actions */}
          <div className="flex items-center gap-2">
            <div className="glass-panel flex items-center gap-1 rounded-xl p-1">
              <Palette className="ml-1.5 hidden h-3.5 w-3.5 text-[var(--text-secondary)] sm:block" />
              {THEME_ORDER.map((tid) => {
                const active = settings.theme === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => onSelectTheme(tid)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      active
                        ? 'shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    style={
                      active
                        ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                        : undefined
                    }
                  >
                    {THEMES[tid].name}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={settings.muted ? '开启声音' : '静音'}
              className="glass-panel flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {settings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="打开设置"
              className="glass-panel flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-[var(--text-primary)] transition-opacity hover:opacity-90"
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">设置</span>
            </button>
          </div>
        </div>

        {/* Mode Grid + Leaderboard */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-12">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:col-span-7">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMode(m.id)}
                  onDoubleClick={() => onStartMode(m.id)}
                  className={`glass-panel group flex flex-col justify-between rounded-2xl p-3.5 text-left transition-all sm:p-4 ${
                    isSelected ? 'ring-2' : 'opacity-85 hover:opacity-100'
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: 'var(--accent)',
                          boxShadow: '0 0 0 1px var(--accent), 0 12px 28px rgba(0,0,0,0.18)',
                        }
                      : undefined
                  }
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[var(--accent)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-mono-num rounded-full border border-[var(--surface-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                        {m.tag}
                      </span>
                    </div>
                    <h2 className="font-display mt-2.5 text-base font-bold sm:text-lg">
                      {m.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                      {m.desc}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[var(--surface-border)] pt-2 text-[11px]">
                    <span className="font-mono-num text-[var(--text-muted)]">
                      {getPersonalBestLabel(m.id)}
                    </span>
                    <span className="font-semibold text-[var(--accent)] opacity-90 transition-transform group-hover:translate-x-0.5">
                      选择 →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Panel: Selected Mode Leaderboard + Launch CTA */}
          <div className="glass-panel flex flex-col justify-between rounded-2xl p-4 md:col-span-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[var(--warning)]" />
                  <h3 className="font-display text-sm font-bold tracking-wider">
                    {selectedMeta.title} Top 5
                  </h3>
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">本地排行</span>
              </div>

              <div className="mt-3 space-y-1.5">
                {activeRecords.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--surface-border)] px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                    暂无完成记录，快来创造首个纪录！
                  </div>
                ) : (
                  activeRecords.map((rec, idx) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between rounded-xl bg-black/15 px-3 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono-num w-4 font-bold text-[var(--accent)]">
                          #{idx + 1}
                        </span>
                        <span className="font-mono-num font-semibold">
                          {selectedMode === 'sprint'
                            ? formatDurationMs(rec.elapsedMs)
                            : rec.score.toLocaleString()}
                        </span>
                      </div>
                      <div className="font-mono-num flex items-center gap-2.5 text-[11px] text-[var(--text-secondary)]">
                        <span>{rec.lines} 行</span>
                        <span>{rec.pps.toFixed(2)} PPS</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => onStartMode(selectedMode)}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <Play className="h-4 w-4 fill-current" />
                开始{selectedMeta.title}
              </button>
              <p className="hidden text-center text-[11px] text-[var(--text-muted)] md:block">
                提示：方向键移动 · 空格硬降 · Z / X / A 旋转 · C 暂存
              </p>
              <p className="text-center text-[11px] text-[var(--text-muted)] md:hidden">
                触控提示：棋盘滑动移动、轻点旋转、快滑硬降、上滑暂存
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

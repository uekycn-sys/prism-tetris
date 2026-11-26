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
    title: 'Marathon',
    tag: 'LV 1–20',
    desc: 'Classic Guideline progression. Speed climbs every 10 lines.',
    icon: Flame,
  },
  {
    id: 'sprint',
    title: '40L Sprint',
    tag: 'SPEEDRUN',
    desc: 'Clear 40 lines as fast as possible. Precision & PPS.',
    icon: Timer,
  },
  {
    id: 'ultra',
    title: 'Ultra 2m',
    tag: '120 SEC',
    desc: 'Score attack blitz. Chain T-Spins, Tetrises & B2B.',
    icon: Zap,
  },
  {
    id: 'zen',
    title: 'Zen',
    tag: 'ENDLESS',
    desc: 'No Game Over. Relaxed flow & T-Spin setup practice.',
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
    if (!top) return 'No record yet';
    if (mode === 'sprint') return `Best ${formatDurationMs(top.elapsedMs)}`;
    return `Best ${top.score.toLocaleString()}`;
  };

  return (
    <div className="relative flex h-dvh w-screen flex-col items-center justify-center overflow-hidden p-3 sm:p-6">
      <div className="glass-modal animate-modal flex max-h-full w-full max-w-4xl flex-col gap-4 rounded-3xl p-4 sm:gap-6 sm:p-7">
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
                  Modern Guideline Engine · SRS · T-Spin · 144Hz Ready
                </p>
              </div>
            </div>
          </div>

          {/* Theme Switcher + Quick Actions */}
          <div className="flex items-center gap-2">
            <div className="glass-panel flex items-center gap-1 rounded-xl p-1">
              <Palette className="ml-1.5 h-3.5 w-3.5 text-[var(--text-secondary)] hidden sm:block" />
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
              aria-label={settings.muted ? 'Unmute Audio' : 'Mute Audio'}
              className="glass-panel flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {settings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open Settings"
              className="glass-panel flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-[var(--text-primary)] transition-opacity hover:opacity-90"
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
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
                    <span className="font-semibold text-[var(--accent)] opacity-90 group-hover:translate-x-0.5 transition-transform">
                      Select →
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
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                    {MODES.find((m) => m.id === selectedMode)?.title} Top 5
                  </h3>
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">Local Best</span>
              </div>

              <div className="mt-3 space-y-1.5">
                {activeRecords.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--surface-border)] px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                    No completed runs yet. Set the first benchmark!
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
                        <span>{rec.lines}L</span>
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
                Start {MODES.find((m) => m.id === selectedMode)?.title}
              </button>
              <p className="text-center text-[11px] text-[var(--text-muted)]">
                Tip: Arrows/WASD move · Space Hard Drop · Z/X/A Rotate · C Hold
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Award, Home, RotateCcw, Trophy } from 'lucide-react';
import { formatDurationMs } from '../storage/persistence';
import type { GameStats, LeaderboardEntry } from '../types/game';

interface GameOverModalProps {
  stats: GameStats;
  isVictory: boolean;
  isNewBest: boolean;
  leaderboard: LeaderboardEntry[];
  onPlayAgain: () => void;
  onReturnMenu: () => void;
}

export function GameOverModal({
  stats,
  isVictory,
  isNewBest,
  leaderboard,
  onPlayAgain,
  onReturnMenu,
}: GameOverModalProps) {
  const modeTitle =
    stats.mode === 'sprint'
      ? '40-Line Sprint'
      : stats.mode === 'ultra'
        ? 'Ultra 2m'
        : stats.mode === 'zen'
          ? 'Zen'
          : 'Marathon';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isVictory ? 'Run Complete' : 'Game Over'}
    >
      <div className="glass-modal animate-modal modal-scroll max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl p-5 sm:p-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono-num rounded-full border border-[var(--surface-border)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {modeTitle}
            </span>
            {isNewBest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                <Award className="h-3.5 w-3.5" />
                NEW BEST
              </span>
            )}
          </div>
          <h2 className="font-display mt-2 text-2xl font-bold sm:text-3xl">
            {isVictory ? 'Run Complete!' : 'Top Out'}
          </h2>
        </div>

        {/* Stat Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="glass-panel rounded-2xl p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Score</div>
            <div className="font-mono-num mt-0.5 text-sm font-bold sm:text-base">
              {stats.score.toLocaleString()}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Time</div>
            <div className="font-mono-num mt-0.5 text-sm font-bold text-[var(--accent)] sm:text-base">
              {formatDurationMs(stats.elapsedMs)}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Lines</div>
            <div className="font-mono-num mt-0.5 text-sm font-bold sm:text-base">{stats.lines}</div>
          </div>
          <div className="glass-panel rounded-2xl p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">PPS</div>
            <div className="font-mono-num mt-0.5 text-sm font-bold">{stats.pps.toFixed(2)}</div>
          </div>
          <div className="glass-panel rounded-2xl p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Max Combo</div>
            <div className="font-mono-num mt-0.5 text-sm font-bold">{stats.maxCombo}</div>
          </div>
          <div className="glass-panel rounded-2xl p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">T-Spins</div>
            <div className="font-mono-num mt-0.5 text-sm font-bold">{stats.tSpins}</div>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="glass-panel mt-4 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              <Trophy className="h-3.5 w-3.5 text-[var(--warning)]" />
              Top 5 · {modeTitle}
            </div>
            <div className="mt-2 space-y-1">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg bg-black/15 px-2.5 py-1 text-xs"
                >
                  <span className="font-mono-num">
                    <span className="mr-2 font-bold text-[var(--accent)]">#{i + 1}</span>
                    {stats.mode === 'sprint'
                      ? formatDurationMs(entry.elapsedMs)
                      : entry.score.toLocaleString()}
                  </span>
                  <span className="font-mono-num text-[11px] text-[var(--text-secondary)]">
                    {entry.lines}L · {entry.pps.toFixed(2)} PPS
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onReturnMenu}
            className="glass-panel flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium hover:bg-white/5"
          >
            <Home className="h-4 w-4" />
            Menu
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold shadow-md"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <RotateCcw className="h-4 w-4" />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

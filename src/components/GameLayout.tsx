import { useEffect, useRef, type ReactNode } from 'react';
import {
  Palette,
  Pause,
  RotateCcw,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SPRINT_TARGET_LINES } from '../engine/constants';
import { MiniPieceCanvas } from '../renderer/MiniPieceCanvas';
import { THEMES } from '../renderer/themes';
import { formatDurationMs } from '../storage/persistence';
import type { CalloutBadge, HudSnapshot, Settings } from '../types/game';
import { CalloutOverlay } from './CalloutOverlay';

interface GameLayoutProps {
  hud: HudSnapshot;
  settings: Settings;
  callouts: CalloutBadge[];
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onResizeBoard: (cellSize: number) => void;
  onCycleTheme: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onPause: () => void;
  onRestart: () => void;
  touchControls: ReactNode;
}

export function GameLayout({
  hud,
  settings,
  callouts,
  canvasRef,
  onResizeBoard,
  onCycleTheme,
  onToggleMute,
  onOpenSettings,
  onPause,
  onRestart,
  touchControls,
}: GameLayoutProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    let rafId = 0;
    let lastCell = -1;

    const computeSize = () => {
      const rect = el.getBoundingClientRect();
      // 10 cols x 20.55 rows
      const maxCellH = Math.floor((rect.height - 12) / 20.6);
      const maxCellW = Math.floor((rect.width - 12) / 10);
      const cell = Math.max(14, Math.min(36, maxCellH, maxCellW));
      if (cell !== lastCell) {
        lastCell = cell;
        onResizeBoard(cell);
      }
    };

    const scheduleCompute = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(computeSize);
    };

    computeSize();
    const ro = new ResizeObserver(scheduleCompute);
    ro.observe(el);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [onResizeBoard]);

  const timeDisplay =
    hud.mode === 'ultra' ? formatDurationMs(hud.remainingMs) : formatDurationMs(hud.elapsedMs);

  const modeLabel =
    hud.mode === 'sprint'
      ? '40L SPRINT'
      : hud.mode === 'ultra'
        ? 'ULTRA 2M'
        : hud.mode === 'zen'
          ? 'ZEN FLOW'
          : 'MARATHON';

  const linesLabel =
    hud.mode === 'sprint' ? `${hud.lines} / ${SPRINT_TARGET_LINES}` : `${hud.lines}`;

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden">
      {/* Mobile Compact Header (< md) */}
      <header className="glass-panel mx-2 mt-2 flex shrink-0 items-center justify-between rounded-2xl px-3 py-1.5 md:hidden">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
              {modeLabel}
            </div>
            <div className="font-mono-num text-sm font-bold leading-tight">
              {hud.score.toLocaleString()}
            </div>
          </div>
          <div className="h-5 w-px bg-[var(--surface-border)]" />
          <div className="font-mono-num text-xs">
            <span className="text-[var(--text-muted)]">L </span>
            <span className="font-bold">{linesLabel}</span>
          </div>
          <div className="font-mono-num text-xs">
            <span className="font-bold text-[var(--accent)]">{timeDisplay}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCycleTheme}
            aria-label="Switch Theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <Palette className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label="Toggle Mute"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
          >
            {settings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onPause}
            aria-label="Pause Game"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <Pause className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Responsive Stage */}
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center gap-3 px-2 py-1.5 md:gap-6 md:px-6 md:py-5">
        {/* Desktop Left Rail */}
        <aside className="hidden h-full max-h-[700px] w-48 shrink-0 flex-col justify-between md:flex lg:w-52">
          <div className="space-y-3">
            {/* Hold Box */}
            <div className="glass-panel rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                  Hold
                </span>
                <span className="font-mono-num text-[10px] text-[var(--text-muted)]">C / Shift</span>
              </div>
              <div className="mt-2 flex h-16 items-center justify-center rounded-xl bg-black/15">
                <MiniPieceCanvas
                  piece={hud.holdPiece}
                  themeId={settings.theme}
                  colorblind={settings.colorblind}
                  dimmed={hud.holdUsed}
                  size={84}
                  cellSize={17}
                />
              </div>
            </div>

            {/* Telemetry Cards */}
            <div className="glass-panel space-y-2.5 rounded-2xl p-3.5">
              <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-2">
                <span className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  {modeLabel}
                </span>
                <span className="font-mono-num text-[11px] font-semibold text-[var(--text-secondary)]">
                  LV {hud.level}
                </span>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  Score
                </div>
                <div className="font-mono-num text-xl font-bold tracking-tight">
                  {hud.score.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    Lines
                  </div>
                  <div className="font-mono-num text-sm font-bold">{linesLabel}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    PPS
                  </div>
                  <div className="font-mono-num text-sm font-bold">{hud.pps.toFixed(2)}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {hud.mode === 'ultra' ? 'Remaining' : 'Time'}
                </div>
                <div className="font-mono-num text-base font-bold text-[var(--accent)]">
                  {timeDisplay}
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                {hud.b2bActive && (
                  <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                    B2B READY
                  </span>
                )}
                {hud.combo > 0 && (
                  <span className="font-mono-num rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    COMBO x{hud.combo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls Legend */}
          <div className="glass-panel rounded-2xl p-3 text-[11px] text-[var(--text-secondary)]">
            <div className="mb-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Shortcuts
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Move</span>
                <span className="font-mono-num">← →</span>
              </div>
              <div className="flex justify-between">
                <span>Hard / Soft</span>
                <span className="font-mono-num">Space / ↓</span>
              </div>
              <div className="flex justify-between">
                <span>Rotate</span>
                <span className="font-mono-num">↑ X / Z / A</span>
              </div>
              <div className="flex justify-between">
                <span>Pause / Retry</span>
                <span className="font-mono-num">Esc / R</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Left Mini Strip (Hold) */}
        <div className="flex h-full flex-col items-center justify-start gap-2 pt-1 md:hidden">
          <div className="glass-panel flex flex-col items-center rounded-xl p-1.5">
            <span className="text-[9px] font-bold uppercase text-[var(--text-muted)]">Hold</span>
            <MiniPieceCanvas
              piece={hud.holdPiece}
              themeId={settings.theme}
              colorblind={settings.colorblind}
              dimmed={hud.holdUsed}
              size={44}
              cellSize={9}
            />
          </div>
          <div className="glass-panel flex flex-col items-center rounded-xl px-2 py-1.5 text-center">
            <span className="text-[9px] uppercase text-[var(--text-muted)]">LV</span>
            <span className="font-mono-num text-xs font-bold">{hud.level}</span>
            <span className="mt-1 text-[9px] uppercase text-[var(--text-muted)]">PPS</span>
            <span className="font-mono-num text-[11px] font-semibold">{hud.pps.toFixed(1)}</span>
          </div>
        </div>

        {/* Center Playfield Canvas */}
        <div
          ref={stageRef}
          className="relative flex h-full min-h-0 flex-1 items-center justify-center md:max-w-[420px]"
        >
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              border: '2px solid var(--board-frame)',
              boxShadow: 'var(--board-glow)',
            }}
          >
            <CalloutOverlay callouts={callouts} />
            <canvas ref={canvasRef} className="block" />
            {/* Lock delay subtle bottom indicator */}
            {hud.isGrounded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-black/30">
                <div
                  className="h-full transition-[width] duration-75"
                  style={{
                    width: `${Math.round(hud.lockProgress * 100)}%`,
                    background: hud.lockProgress > 0.7 ? 'var(--danger)' : 'var(--accent)',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Right Mini Strip (Next 4) */}
        <div className="flex h-full flex-col items-center justify-start gap-1.5 pt-1 md:hidden">
          <div className="glass-panel flex flex-col items-center gap-1 rounded-xl p-1.5">
            <span className="text-[9px] font-bold uppercase text-[var(--text-muted)]">Next</span>
            {hud.nextQueue.slice(0, 4).map((p, idx) => (
              <MiniPieceCanvas
                key={`${p}-${idx}`}
                piece={p}
                themeId={settings.theme}
                colorblind={settings.colorblind}
                size={44}
                cellSize={idx === 0 ? 10 : 8}
              />
            ))}
          </div>
        </div>

        {/* Desktop Right Rail */}
        <aside className="hidden h-full max-h-[700px] w-48 shrink-0 flex-col justify-between md:flex lg:w-52">
          {/* Next Queue (5 pieces) */}
          <div className="glass-panel rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                Next
              </span>
              <span className="font-mono-num text-[10px] text-[var(--text-muted)]">5 Queue</span>
            </div>
            <div className="mt-2 flex flex-col items-center gap-1.5 rounded-xl bg-black/15 py-2">
              {hud.nextQueue.slice(0, 5).map((p, idx) => (
                <div
                  key={`${p}-${idx}`}
                  className={idx === 0 ? 'scale-105' : 'opacity-85'}
                >
                  <MiniPieceCanvas
                    piece={p}
                    themeId={settings.theme}
                    colorblind={settings.colorblind}
                    size={84}
                    cellSize={idx === 0 ? 17 : 14}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="glass-panel space-y-2 rounded-2xl p-3">
            <button
              type="button"
              onClick={onCycleTheme}
              className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs font-medium hover:bg-white/10"
            >
              <span className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-[var(--accent)]" />
                Theme
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                {THEMES[settings.theme].name}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label="Toggle Mute"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs font-medium hover:bg-white/10"
              >
                {settings.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {settings.muted ? 'Muted' : 'Audio'}
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs font-medium hover:bg-white/10"
              >
                <SettingsIcon className="h-3.5 w-3.5" />
                Setup
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs font-medium hover:bg-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </button>
              <button
                type="button"
                onClick={onPause}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Bottom Touch Controls */}
      {touchControls}
    </div>
  );
}

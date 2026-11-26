import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  Eye,
  EyeOff,
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
  onToggleGhost: () => void;
  onOpenSettings: () => void;
  onPause: () => void;
  onRestart: () => void;
  onHold: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSoftDropStep: () => void;
  onHardDropTouch: () => void;
  onRotateCW: () => void;
  touchControls: ReactNode;
}

interface GestureState {
  pointerId: number;
  startX: number;
  startY: number;
  anchorX: number;
  anchorY: number;
  startTime: number;
  movedX: boolean;
  movedY: boolean;
}

export function GameLayout({
  hud,
  settings,
  callouts,
  canvasRef,
  onResizeBoard,
  onCycleTheme,
  onToggleMute,
  onToggleGhost,
  onOpenSettings,
  onPause,
  onRestart,
  onHold,
  onMoveLeft,
  onMoveRight,
  onSoftDropStep,
  onHardDropTouch,
  onRotateCW,
  touchControls,
}: GameLayoutProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cellSizeRef = useRef(24);
  const gestureRef = useRef<GestureState | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    let rafId = 0;
    let lastCell = -1;

    const computeSize = () => {
      const rect = el.getBoundingClientRect();
      // 10 cols x 20.55 rows, subtract 4px for 2px board border on each side
      const maxCellH = Math.floor((rect.height - 4) / 20.6);
      const maxCellW = Math.floor((rect.width - 4) / 10);
      const cell = Math.max(14, Math.min(40, maxCellH, maxCellW));
      if (cell !== lastCell) {
        lastCell = cell;
        cellSizeRef.current = cell;
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
    window.visualViewport?.addEventListener('resize', scheduleCompute);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.visualViewport?.removeEventListener('resize', scheduleCompute);
    };
  }, [onResizeBoard, settings.showTouchControls, settings.touchControlLift]);

  const handleBoardPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!settings.touchGestures || hud.status !== 'playing' || e.pointerType !== 'touch') {
      return;
    }
    if (gestureRef.current) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      anchorX: e.clientX,
      anchorY: e.clientY,
      startTime: performance.now(),
      movedX: false,
      movedY: false,
    };
  };

  const handleBoardPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.pointerId !== e.pointerId) return;

    const stepX = Math.max(20, cellSizeRef.current * 0.92);
    const stepY = Math.max(22, cellSizeRef.current * 0.95);
    const dxFromAnchor = e.clientX - g.anchorX;
    const dyFromAnchor = e.clientY - g.anchorY;

    if (Math.abs(dxFromAnchor) >= stepX) {
      while (e.clientX - g.anchorX >= stepX) {
        g.anchorX += stepX;
        g.movedX = true;
        onMoveRight();
      }
      while (g.anchorX - e.clientX >= stepX) {
        g.anchorX -= stepX;
        g.movedX = true;
        onMoveLeft();
      }
    }

    const totalDx = e.clientX - g.startX;
    const totalDy = e.clientY - g.startY;
    if (
      dyFromAnchor >= stepY &&
      (!g.movedX || Math.abs(totalDy) > Math.abs(totalDx) * 1.25)
    ) {
      while (e.clientY - g.anchorY >= stepY) {
        g.anchorY += stepY;
        g.movedY = true;
        onSoftDropStep();
      }
    }
  };

  const handleBoardPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.pointerId !== e.pointerId) return;
    gestureRef.current = null;

    const totalDx = e.clientX - g.startX;
    const totalDy = e.clientY - g.startY;
    const dt = performance.now() - g.startTime;

    if (!g.movedX && !g.movedY && Math.hypot(totalDx, totalDy) < 12 && dt < 260) {
      onRotateCW();
    } else if (
      !g.movedX &&
      totalDy >= 52 &&
      dt <= 170 &&
      Math.abs(totalDy) > Math.abs(totalDx) * 1.8
    ) {
      onHardDropTouch();
    } else if (
      !g.movedX &&
      totalDy <= -56 &&
      Math.abs(totalDy) > Math.abs(totalDx) * 1.8
    ) {
      onHold();
    }
  };

  const handleBoardPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (gestureRef.current?.pointerId === e.pointerId) {
      gestureRef.current = null;
    }
  };

  const timeDisplay =
    hud.mode === 'ultra' ? formatDurationMs(hud.remainingMs) : formatDurationMs(hud.elapsedMs);

  const modeLabel =
    hud.mode === 'sprint'
      ? '40 行竞速'
      : hud.mode === 'ultra'
        ? '2 分钟极速'
        : hud.mode === 'zen'
          ? '禅意无尽'
          : '马拉松';

  const linesLabel =
    hud.mode === 'sprint' ? `${hud.lines} / ${SPRINT_TARGET_LINES}` : `${hud.lines}`;

  return (
    <div
      className="flex h-dvh w-screen flex-col overflow-hidden"
      style={{ paddingTop: 'var(--sat)' }}
    >
      {/* Mobile Compact Header (< md) */}
      <header className="glass-panel mx-2 mt-1.5 flex shrink-0 items-center justify-between rounded-2xl px-2.5 py-1 md:hidden">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[9px] font-bold tracking-wider text-[var(--accent)]">
              {modeLabel}
            </div>
            <div className="font-mono-num text-sm font-bold leading-tight">
              {hud.score.toLocaleString()}
            </div>
          </div>
          <div className="h-5 w-px bg-[var(--surface-border)]" />
          <div className="font-mono-num text-xs">
            <span className="text-[var(--text-muted)]">行 </span>
            <span className="font-bold">{linesLabel}</span>
          </div>
          <div className="font-mono-num text-xs">
            <span className="font-bold text-[var(--accent)]">{timeDisplay}</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onToggleGhost}
            aria-label="落点提示开关"
            title={settings.showGhostPiece ? '关闭落点提示' : '开启落点提示'}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              settings.showGhostPiece
                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:bg-white/10'
            }`}
          >
            {settings.showGhostPiece ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onCycleTheme}
            aria-label="切换主题"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <Palette className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label="静音开关"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10"
          >
            {settings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="游戏设置"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onPause}
            aria-label="暂停游戏"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <Pause className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Responsive Stage */}
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center gap-1.5 px-1.5 py-1 md:gap-6 md:px-6 md:py-5">
        {/* Desktop Left Rail */}
        <aside className="hidden h-full max-h-[760px] w-48 shrink-0 flex-col justify-between md:flex lg:w-52">
          <div className="space-y-3">
            {/* Hold Box */}
            <button
              type="button"
              onClick={onHold}
              className="glass-panel w-full rounded-2xl p-3 text-left transition-colors hover:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[11px] font-bold tracking-wider text-[var(--text-secondary)]">
                  暂存 (HOLD)
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
            </button>

            {/* Telemetry Cards */}
            <div className="glass-panel space-y-2.5 rounded-2xl p-3.5">
              <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-2">
                <span className="font-display text-[11px] font-bold tracking-wider text-[var(--accent)]">
                  {modeLabel}
                </span>
                <span className="font-mono-num text-[11px] font-semibold text-[var(--text-secondary)]">
                  LV {hud.level}
                </span>
              </div>

              <div>
                <div className="text-[10px] tracking-wider text-[var(--text-muted)]">
                  得分
                </div>
                <div className="font-mono-num text-xl font-bold tracking-tight">
                  {hud.score.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] tracking-wider text-[var(--text-muted)]">
                    消除行
                  </div>
                  <div className="font-mono-num text-sm font-bold">{linesLabel}</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-wider text-[var(--text-muted)]">
                    PPS
                  </div>
                  <div className="font-mono-num text-sm font-bold">{hud.pps.toFixed(2)}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] tracking-wider text-[var(--text-muted)]">
                  {hud.mode === 'ultra' ? '剩余时间' : '用时'}
                </div>
                <div className="font-mono-num text-base font-bold text-[var(--accent)]">
                  {timeDisplay}
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                {hud.b2bActive && (
                  <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                    B2B 就绪
                  </span>
                )}
                {hud.combo > 0 && (
                  <span className="font-mono-num rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    连消 x{hud.combo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls Legend */}
          <div className="glass-panel rounded-2xl p-3 text-[11px] text-[var(--text-secondary)]">
            <div className="mb-1.5 font-display text-[10px] font-bold tracking-wider text-[var(--text-muted)]">
              快捷操作
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>左右移动</span>
                <span className="font-mono-num">← →</span>
              </div>
              <div className="flex justify-between">
                <span>硬降 / 软降</span>
                <span className="font-mono-num">空格 / ↓</span>
              </div>
              <div className="flex justify-between">
                <span>旋转</span>
                <span className="font-mono-num">↑ X / Z / A</span>
              </div>
              <div className="flex justify-between">
                <span>暂停 / 重开</span>
                <span className="font-mono-num">Esc / R</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Playfield Canvas */}
        <div
          ref={stageRef}
          className="relative flex h-full min-h-0 flex-1 items-center justify-center md:max-w-[460px]"
        >
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              border: '2px solid var(--board-frame)',
              boxShadow: 'var(--board-glow)',
              touchAction: 'none',
            }}
            onPointerDown={handleBoardPointerDown}
            onPointerMove={handleBoardPointerMove}
            onPointerUp={handleBoardPointerUp}
            onPointerCancel={handleBoardPointerCancel}
          >
            <CalloutOverlay callouts={callouts} themeId={settings.theme} />
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

        {/* Mobile Consolidated Slim Right Rail (< md) */}
        <div className="flex h-full w-[58px] shrink-0 flex-col items-center justify-start gap-1.5 pt-0.5 md:hidden">
          <button
            type="button"
            onClick={onHold}
            aria-label="暂存方块"
            className={`glass-panel flex w-full flex-col items-center rounded-xl p-1 active:scale-95 ${
              !hud.holdUsed ? 'border-[var(--accent)]/30' : 'opacity-75'
            }`}
          >
            <span className="text-[9px] font-bold text-[var(--text-muted)]">暂存</span>
            <MiniPieceCanvas
              piece={hud.holdPiece}
              themeId={settings.theme}
              colorblind={settings.colorblind}
              dimmed={hud.holdUsed}
              size={44}
              cellSize={9}
            />
          </button>

          <div className="glass-panel flex w-full flex-col items-center gap-1 rounded-xl p-1">
            <span className="text-[9px] font-bold text-[var(--text-muted)]">预览</span>
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

          <div className="glass-panel flex w-full flex-col items-center rounded-xl px-1 py-1.5 text-center">
            <span className="text-[9px] text-[var(--text-muted)]">LV {hud.level}</span>
            <span className="font-mono-num mt-0.5 text-[10px] font-semibold">
              {hud.pps.toFixed(1)} <span className="text-[8px] text-[var(--text-muted)]">PPS</span>
            </span>
            {hud.b2bActive && (
              <span className="mt-1 rounded bg-purple-500/20 px-1 py-0.5 text-[8px] font-bold text-purple-300">
                B2B
              </span>
            )}
            {hud.combo > 0 && (
              <span className="font-mono-num mt-0.5 rounded bg-amber-500/20 px-1 py-0.5 text-[8px] font-bold text-amber-300">
                x{hud.combo}
              </span>
            )}
          </div>
        </div>

        {/* Desktop Right Rail */}
        <aside className="hidden h-full max-h-[760px] w-48 shrink-0 flex-col justify-between md:flex lg:w-52">
          {/* Next Queue (5 pieces) */}
          <div className="glass-panel rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-[11px] font-bold tracking-wider text-[var(--text-secondary)]">
                下一方块
              </span>
              <span className="font-mono-num text-[10px] text-[var(--text-muted)]">5 块预览</span>
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
                主题
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                {THEMES[settings.theme].name}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label="静音开关"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs font-medium hover:bg-white/10"
              >
                {settings.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {settings.muted ? '已静音' : '音效'}
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs font-medium hover:bg-white/10"
              >
                <SettingsIcon className="h-3.5 w-3.5" />
                设置
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs font-medium hover:bg-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重开
              </button>
              <button
                type="button"
                onClick={onPause}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <Pause className="h-3.5 w-3.5" />
                暂停
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

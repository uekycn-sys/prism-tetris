import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ChevronsDown,
  Repeat,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import type { TouchControlLift, TouchLayoutMode } from '../types/game';

interface TouchControlsProps {
  layout: TouchLayoutMode;
  lift: TouchControlLift;
  swapped: boolean;
  visible: boolean;
  onToggleOneHandSide: () => void;
  onPressLeft: () => void;
  onReleaseLeft: () => void;
  onPressRight: () => void;
  onReleaseRight: () => void;
  onPressSoftDrop: () => void;
  onReleaseSoftDrop: () => void;
  onHardDrop: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onRotate180: () => void;
  onHold: () => void;
}

const LIFT_PADDING: Record<TouchControlLift, string> = {
  compact: 'calc(var(--sab) + 6px)',
  comfort: 'calc(var(--sab) + 16px)',
  high: 'calc(var(--sab) + 34px)',
};

function triggerHaptic(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate?.(6);
    } catch {
      // Ignore unsupported vibration errors
    }
  }
}

interface TouchButtonProps {
  label: string;
  className: string;
  style?: React.CSSProperties;
  onPress: () => void;
  onRelease?: () => void;
  children: ReactNode;
}

function TouchButton({
  label,
  className,
  style,
  onPress,
  onRelease,
  children,
}: TouchButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setPressed(true);
    triggerHaptic();
    onPress();
  };

  const handleRelease = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPressed(false);
    onRelease?.();
  };

  return (
    <button
      type="button"
      aria-label={label}
      className={`${className} transition-transform duration-75 select-none touch-none ${
        pressed ? 'scale-[0.94] brightness-125' : ''
      }`}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerUp={handleRelease}
      onPointerCancel={handleRelease}
      onLostPointerCapture={handleRelease}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

type MoveZone = 'left' | 'down' | 'right' | null;

interface GlideMoveStripProps {
  onPressLeft: () => void;
  onReleaseLeft: () => void;
  onPressSoftDrop: () => void;
  onReleaseSoftDrop: () => void;
  onPressRight: () => void;
  onReleaseRight: () => void;
}

function GlideMoveStrip({
  onPressLeft,
  onReleaseLeft,
  onPressSoftDrop,
  onReleaseSoftDrop,
  onPressRight,
  onReleaseRight,
}: GlideMoveStripProps) {
  const [activeZone, setActiveZone] = useState<MoveZone>(null);
  const activeZoneRef = useRef<MoveZone>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const releaseZone = (zone: MoveZone) => {
    if (zone === 'left') onReleaseLeft();
    else if (zone === 'down') onReleaseSoftDrop();
    else if (zone === 'right') onReleaseRight();
  };

  const pressZone = (zone: MoveZone) => {
    if (zone === 'left') onPressLeft();
    else if (zone === 'down') onPressSoftDrop();
    else if (zone === 'right') onPressRight();
  };

  const getZoneFromEvent = (e: ReactPointerEvent<HTMLDivElement>): MoveZone => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return 'down';
    const ratio = (e.clientX - rect.left) / rect.width;
    if (ratio < 0.34) return 'left';
    if (ratio <= 0.66) return 'down';
    return 'right';
  };

  const switchZone = (nextZone: MoveZone) => {
    const prevZone = activeZoneRef.current;
    if (prevZone === nextZone) return;
    if (prevZone) releaseZone(prevZone);
    activeZoneRef.current = nextZone;
    setActiveZone(nextZone);
    if (nextZone) {
      triggerHaptic();
      pressZone(nextZone);
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (activePointerIdRef.current !== null) return;
    activePointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    switchZone(getZoneFromEvent(e));
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    switchZone(getZoneFromEvent(e));
  };

  const handlePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    activePointerIdRef.current = null;
    switchZone(null);
  };

  const segmentClass = (zone: Exclude<MoveZone, null>) =>
    `glass-panel flex flex-1 items-center justify-center rounded-xl transition-transform duration-75 pointer-events-none ${
      activeZone === zone
        ? 'scale-[0.95] brightness-125 border-[var(--accent)]/60 text-[var(--accent)]'
        : 'text-[var(--text-primary)]'
    }`;

  return (
    <div
      role="group"
      aria-label="单手滑动方向区"
      className="flex h-[var(--tp-lg)] w-full gap-1.5 select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={segmentClass('left')} aria-label="触控左移">
        <ArrowLeft className="h-5 w-5" />
      </div>
      <div className={segmentClass('down')} aria-label="触控软降">
        <ArrowDown className="h-5 w-5" />
      </div>
      <div className={segmentClass('right')} aria-label="触控右移">
        <ArrowRight className="h-5 w-5" />
      </div>
    </div>
  );
}

export function TouchControls({
  layout,
  lift,
  swapped,
  visible,
  onToggleOneHandSide,
  onPressLeft,
  onReleaseLeft,
  onPressRight,
  onReleaseRight,
  onPressSoftDrop,
  onReleaseSoftDrop,
  onHardDrop,
  onRotateCW,
  onRotateCCW,
  onRotate180,
  onHold,
}: TouchControlsProps) {
  if (!visible) return null;

  const btnBase =
    'glass-panel flex items-center justify-center rounded-xl text-[var(--text-primary)]';

  const containerStyle: React.CSSProperties = {
    paddingBottom: LIFT_PADDING[lift],
    paddingLeft: 'max(0.75rem, var(--sal))',
    paddingRight: 'max(0.75rem, var(--sar))',
    touchAction: 'none',
  };

  if (layout !== 'two-hand') {
    const isLeftHanded = layout === 'one-hand-left';
    return (
      <div
        className="flex w-full shrink-0 flex-col pt-1 md:hidden"
        style={containerStyle}
      >
        <div
          className={`flex w-full items-stretch gap-2 ${
            isLeftHanded ? 'flex-row-reverse' : ''
          }`}
        >
          {/* Utility side column: Hold, 180°, 1-tap Hand Side Switch */}
          <div className="flex w-[66px] shrink-0 flex-col gap-1.5">
            <TouchButton
              label="触控暂存"
              className={`${btnBase} h-[var(--tp-sm)] w-full text-[11px] font-semibold`}
              onPress={onHold}
            >
              <Repeat className="mr-1 h-3.5 w-3.5 text-[var(--accent)]" />
              暂存
            </TouchButton>

            <TouchButton
              label="触控 180° 旋转"
              className={`${btnBase} font-mono-num h-[var(--tp-lg)] w-full text-xs font-bold`}
              onPress={onRotate180}
            >
              180°
            </TouchButton>

            <button
              type="button"
              aria-label="切换单手左右手模式"
              onClick={onToggleOneHandSide}
              className={`${btnBase} h-[var(--tp-sm)] w-full gap-1 text-[10px] font-medium text-[var(--text-secondary)] active:scale-95`}
            >
              <ArrowLeftRight className="h-3 w-3 text-[var(--accent)]" />
              {isLeftHanded ? '左手' : '右手'}
            </button>
          </div>

          {/* Primary Single-Thumb Zone: Rotate Row, Glide D-Pad, Hard Drop */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* Top Row: Rotate CCW + prominent Rotate CW */}
            <div className="flex w-full items-center gap-1.5">
              <TouchButton
                label="触控逆时针旋转"
                className={`${btnBase} h-[var(--tp-sm)] w-[56px] shrink-0`}
                onPress={onRotateCCW}
              >
                <RotateCcw className="h-4 w-4" />
              </TouchButton>
              <TouchButton
                label="触控顺时针旋转"
                className={`${btnBase} h-[var(--tp-sm)] flex-1 gap-1.5 border-[var(--accent)]/40 text-xs font-semibold`}
                onPress={onRotateCW}
              >
                <RotateCw className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-[var(--accent)]">旋转</span>
              </TouchButton>
            </div>

            {/* Middle Row: Unified Slide-Through Left / Soft Drop / Right Strip */}
            <GlideMoveStrip
              onPressLeft={onPressLeft}
              onReleaseLeft={onReleaseLeft}
              onPressSoftDrop={onPressSoftDrop}
              onReleaseSoftDrop={onReleaseSoftDrop}
              onPressRight={onPressRight}
              onReleaseRight={onReleaseRight}
            />

            {/* Bottom Row: Full-width Hard Drop */}
            <TouchButton
              label="触控硬降"
              className="flex h-[var(--tp-sm)] w-full items-center justify-center rounded-xl text-xs font-bold shadow-md"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
              onPress={onHardDrop}
            >
              <ChevronsDown className="mr-1 h-4 w-4" />
              硬降
            </TouchButton>
          </div>
        </div>
      </div>
    );
  }

  // Two-Hand Split-Thumb Mode
  const rowOrderClass = swapped ? 'flex-row-reverse' : '';

  return (
    <div
      className="flex w-full shrink-0 flex-col gap-1.5 pt-1 md:hidden"
      style={containerStyle}
    >
      {/* Row 1 (Upper / Primary Ergonomic Zone): Left/Right + Rotate CCW/CW */}
      <div className={`flex w-full items-center gap-3 ${rowOrderClass}`}>
        <div className="flex flex-1 items-center gap-1.5">
          <TouchButton
            label="触控左移"
            className={`${btnBase} h-[52px] flex-1`}
            onPress={onPressLeft}
            onRelease={onReleaseLeft}
          >
            <ArrowLeft className="h-5 w-5" />
          </TouchButton>
          <TouchButton
            label="触控右移"
            className={`${btnBase} h-[52px] flex-1`}
            onPress={onPressRight}
            onRelease={onReleaseRight}
          >
            <ArrowRight className="h-5 w-5" />
          </TouchButton>
        </div>

        <div className="flex flex-1 items-center gap-1.5">
          <TouchButton
            label="触控逆时针旋转"
            className={`${btnBase} h-[52px] w-[52px] shrink-0`}
            onPress={onRotateCCW}
          >
            <RotateCcw className="h-5 w-5" />
          </TouchButton>
          <TouchButton
            label="触控顺时针旋转"
            className={`${btnBase} h-[52px] flex-1 border-[var(--accent)]/35`}
            onPress={onRotateCW}
          >
            <RotateCw className="h-5 w-5 text-[var(--accent)]" />
          </TouchButton>
        </div>
      </div>

      {/* Row 2 (Lower / Secondary + Drop Zone): Hold/Soft Drop + Hard Drop/180° */}
      <div className={`flex w-full items-center gap-3 ${rowOrderClass}`}>
        <div className="flex flex-1 items-center gap-1.5">
          <TouchButton
            label="触控暂存"
            className={`${btnBase} h-[44px] w-[62px] shrink-0 text-xs font-semibold`}
            onPress={onHold}
          >
            <Repeat className="mr-1 h-3.5 w-3.5 text-[var(--accent)]" />
            暂存
          </TouchButton>
          <TouchButton
            label="触控软降"
            className={`${btnBase} h-[44px] flex-1 text-xs font-medium`}
            onPress={onPressSoftDrop}
            onRelease={onReleaseSoftDrop}
          >
            <ArrowDown className="mr-1 h-4 w-4" />
            软降
          </TouchButton>
        </div>

        <div className="flex flex-1 items-center gap-1.5">
          <TouchButton
            label="触控硬降"
            className="flex h-[44px] flex-1 items-center justify-center rounded-xl text-xs font-bold shadow-md"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
            }}
            onPress={onHardDrop}
          >
            <ChevronsDown className="mr-1 h-4 w-4" />
            硬降
          </TouchButton>
          <TouchButton
            label="触控 180° 旋转"
            className={`${btnBase} font-mono-num h-[44px] w-[52px] shrink-0 text-xs font-bold`}
            onPress={onRotate180}
          >
            180°
          </TouchButton>
        </div>
      </div>
    </div>
  );
}

import { useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronsDown,
  Repeat,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import type { TouchControlLift } from '../types/game';

interface TouchControlsProps {
  lift: TouchControlLift;
  swapped: boolean;
  visible: boolean;
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
  compact: 'calc(var(--sab) + 8px)',
  comfort: 'calc(var(--sab) + 24px)',
  high: 'calc(var(--sab) + 44px)',
};

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
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(6);
      } catch {
        // Ignore unsupported vibration errors
      }
    }
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

export function TouchControls({
  lift,
  swapped,
  visible,
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

  const rowOrderClass = swapped ? 'flex-row-reverse' : '';

  return (
    <div
      className="flex w-full shrink-0 flex-col gap-1.5 pt-1 md:hidden"
      style={{
        paddingBottom: LIFT_PADDING[lift],
        paddingLeft: 'max(0.75rem, var(--sal))',
        paddingRight: 'max(0.75rem, var(--sar))',
        touchAction: 'none',
      }}
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

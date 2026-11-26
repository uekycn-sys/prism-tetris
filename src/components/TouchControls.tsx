import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronsDown,
  Repeat,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

interface TouchControlsProps {
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

function stopAndRun(fn: () => void) {
  return (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    fn();
  };
}

function stopRelease(fn: () => void) {
  return (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    fn();
  };
}

export function TouchControls({
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
  const btnBase =
    'glass-panel flex items-center justify-center rounded-xl active:scale-95 transition-transform select-none touch-none text-[var(--text-primary)]';

  return (
    <div
      className="flex w-full shrink-0 flex-col gap-1.5 px-3 pb-2.5 pt-1 md:hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Secondary top utility row: Hold & 180° */}
      <div className="flex w-full items-center justify-between gap-2">
        <button
          type="button"
          aria-label="触控暂存"
          className={`${btnBase} h-9 px-3.5 text-xs font-semibold tracking-wide`}
          onPointerDown={stopAndRun(onHold)}
        >
          <Repeat className="mr-1.5 h-3.5 w-3.5 text-[var(--accent)]" />
          暂存
        </button>

        <button
          type="button"
          aria-label="触控 180° 旋转"
          className={`${btnBase} font-mono-num h-9 px-3.5 text-xs font-bold`}
          onPointerDown={stopAndRun(onRotate180)}
        >
          180°
        </button>
      </div>

      {/* Primary ergonomic split-thumb row */}
      <div className="flex w-full items-center justify-between gap-2">
        {/* Left thumb cluster: Movement & Soft Drop */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="触控左移"
            className={`${btnBase} h-12 w-12`}
            onPointerDown={stopAndRun(onPressLeft)}
            onPointerUp={stopRelease(onReleaseLeft)}
            onPointerCancel={stopRelease(onReleaseLeft)}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="触控软降"
            className={`${btnBase} h-12 w-12`}
            onPointerDown={stopAndRun(onPressSoftDrop)}
            onPointerUp={stopRelease(onReleaseSoftDrop)}
            onPointerCancel={stopRelease(onReleaseSoftDrop)}
          >
            <ArrowDown className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="触控右移"
            className={`${btnBase} h-12 w-12`}
            onPointerDown={stopAndRun(onPressRight)}
            onPointerUp={stopRelease(onReleaseRight)}
            onPointerCancel={stopRelease(onReleaseRight)}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Right thumb cluster: Rotate CCW, Hard Drop, Rotate CW */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="触控逆时针旋转"
            className={`${btnBase} h-12 w-12`}
            onPointerDown={stopAndRun(onRotateCCW)}
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="触控硬降"
            className="flex h-12 w-13 items-center justify-center rounded-xl font-semibold shadow-md transition-transform active:scale-95 select-none touch-none"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
            }}
            onPointerDown={stopAndRun(onHardDrop)}
          >
            <ChevronsDown className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="触控顺时针旋转"
            className={`${btnBase} h-12 w-12`}
            onPointerDown={stopAndRun(onRotateCW)}
          >
            <RotateCw className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

import type { CalloutBadge } from '../types/game';

interface CalloutOverlayProps {
  callouts: CalloutBadge[];
}

const TONE_CLASSES: Record<CalloutBadge['tone'], string> = {
  accent: 'border-sky-400/50 bg-sky-500/20 text-sky-200 shadow-sky-500/20',
  violet: 'border-purple-400/55 bg-purple-500/25 text-purple-100 shadow-purple-500/25',
  gold: 'border-amber-400/60 bg-amber-500/25 text-amber-100 shadow-amber-500/25',
  emerald: 'border-emerald-400/55 bg-emerald-500/25 text-emerald-100 shadow-emerald-500/25',
};

export function CalloutOverlay({ callouts }: CalloutOverlayProps) {
  if (callouts.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-3 z-20 flex flex-col items-center gap-1.5 px-2"
      aria-live="polite"
    >
      {callouts.map((c) => (
        <div
          key={c.id}
          className={`animate-callout rounded-full border px-3.5 py-1 text-center shadow-lg backdrop-blur-md ${TONE_CLASSES[c.tone]}`}
        >
          <span className="font-display text-xs font-bold tracking-wider uppercase sm:text-sm">
            {c.label}
          </span>
          {c.sublabel && (
            <span className="font-mono-num ml-2 text-[11px] font-semibold opacity-90">
              {c.sublabel}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

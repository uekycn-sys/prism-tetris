import type { CalloutBadge, ThemeId } from '../types/game';

interface CalloutOverlayProps {
  callouts: CalloutBadge[];
  themeId: ThemeId;
}

const DARK_TONE_CLASSES: Record<CalloutBadge['tone'], string> = {
  accent: 'border-sky-400/50 bg-sky-500/20 text-sky-200 shadow-sky-500/20',
  violet: 'border-purple-400/55 bg-purple-500/25 text-purple-100 shadow-purple-500/25',
  gold: 'border-amber-400/60 bg-amber-500/25 text-amber-100 shadow-amber-500/25',
  emerald: 'border-emerald-400/55 bg-emerald-500/25 text-emerald-100 shadow-emerald-500/25',
};

const LIGHT_TONE_CLASSES: Record<CalloutBadge['tone'], string> = {
  accent: 'border-sky-500/50 bg-sky-100/90 text-sky-900 shadow-sky-500/15',
  violet: 'border-purple-500/50 bg-purple-100/90 text-purple-900 shadow-purple-500/15',
  gold: 'border-amber-500/55 bg-amber-100/90 text-amber-900 shadow-amber-500/15',
  emerald: 'border-emerald-500/50 bg-emerald-100/90 text-emerald-900 shadow-emerald-500/15',
};

export function CalloutOverlay({ callouts, themeId }: CalloutOverlayProps) {
  if (callouts.length === 0) return null;
  const toneMap = themeId === 'zen-frost' ? LIGHT_TONE_CLASSES : DARK_TONE_CLASSES;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-3 z-20 flex flex-col items-center gap-1.5 px-2"
      aria-live="polite"
    >
      {callouts.map((c) => (
        <div
          key={c.id}
          className={`animate-callout rounded-full border px-3.5 py-1 text-center shadow-lg backdrop-blur-md ${toneMap[c.tone]}`}
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

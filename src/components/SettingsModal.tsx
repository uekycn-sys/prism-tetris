import { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import {
  ACTION_LABELS,
  DEFAULT_KEY_BINDINGS,
  DEFAULT_SETTINGS,
  formatKeyCode,
  WASD_KEY_BINDINGS,
} from '../storage/persistence';
import { THEME_ORDER, THEMES } from '../renderer/themes';
import type { ActionName, Settings } from '../types/game';

interface SettingsModalProps {
  settings: Settings;
  onUpdate: (next: Settings) => void;
  onClose: () => void;
}

const ACTIONS_ORDER: ActionName[] = [
  'moveLeft',
  'moveRight',
  'softDrop',
  'hardDrop',
  'rotateCW',
  'rotateCCW',
  'rotate180',
  'hold',
  'pause',
  'restart',
];

export function SettingsModal({ settings, onUpdate, onClose }: SettingsModalProps) {
  const [listeningAction, setListeningAction] = useState<ActionName | null>(null);

  useEffect(() => {
    if (!listeningAction) return;

    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.code === 'Escape') {
        setListeningAction(null);
        return;
      }

      const code = e.code;
      const updatedBindings = { ...settings.keyBindings };

      // Remove this code from any other action to avoid conflicts
      for (const action of ACTIONS_ORDER) {
        updatedBindings[action] = updatedBindings[action].filter((c) => c !== code);
      }

      const existing = updatedBindings[listeningAction];
      updatedBindings[listeningAction] = existing.length >= 2 ? [code, existing[0]] : [code, ...existing];

      onUpdate({ ...settings, keyBindings: updatedBindings });
      setListeningAction(null);
    };

    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [listeningAction, settings, onUpdate]);

  const setHandling = (key: 'das' | 'arr' | 'sdf', val: number) => {
    onUpdate({
      ...settings,
      handling: {
        ...settings.handling,
        [key]: val,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="glass-modal animate-modal modal-scroll flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-y-auto rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-3.5">
          <div>
            <h2 className="font-display text-xl font-bold">Settings & Tuning</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Fine-tune handling, visuals, procedural audio & keybindings
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="glass-panel flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {/* Handling Section */}
          <section className="space-y-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Handling & Physics Feel
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="glass-panel rounded-2xl p-3">
                <div className="flex justify-between text-xs font-medium">
                  <span>DAS</span>
                  <span className="font-mono-num text-[var(--accent)]">{settings.handling.das} ms</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={250}
                  step={1}
                  value={settings.handling.das}
                  onChange={(e) => setHandling('das', Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--accent)]"
                />
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">Auto-shift delay (50–250ms)</p>
              </div>

              <div className="glass-panel rounded-2xl p-3">
                <div className="flex justify-between text-xs font-medium">
                  <span>ARR</span>
                  <span className="font-mono-num text-[var(--accent)]">
                    {settings.handling.arr === 0 ? '0 ms (Instant)' : `${settings.handling.arr} ms`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={settings.handling.arr}
                  onChange={(e) => setHandling('arr', Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--accent)]"
                />
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">Repeat interval (0 = snap)</p>
              </div>

              <div className="glass-panel rounded-2xl p-3">
                <div className="flex justify-between text-xs font-medium">
                  <span>SDF</span>
                  <span className="font-mono-num text-[var(--accent)]">
                    {settings.handling.sdf === 0 ? '∞ Instant' : `${settings.handling.sdf}x`}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={41}
                  step={1}
                  value={settings.handling.sdf === 0 ? 41 : settings.handling.sdf}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    setHandling('sdf', raw >= 41 ? 0 : raw);
                  }}
                  className="mt-2 w-full accent-[var(--accent)]"
                />
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">Soft drop speed (max = ∞)</p>
              </div>
            </div>
          </section>

          {/* Visuals & Audio */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2.5">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Visuals & Accessibility
              </h3>
              <div className="glass-panel space-y-2.5 rounded-2xl p-3">
                <div className="flex gap-1.5">
                  {THEME_ORDER.map((tid) => {
                    const active = settings.theme === tid;
                    return (
                      <button
                        key={tid}
                        type="button"
                        onClick={() => onUpdate({ ...settings, theme: tid })}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all ${
                          active ? '' : 'bg-black/15 text-[var(--text-secondary)]'
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

                <label className="flex cursor-pointer items-center justify-between text-xs">
                  <span>Colorblind High-Contrast & Symbols</span>
                  <input
                    type="checkbox"
                    checked={settings.colorblind}
                    onChange={(e) => onUpdate({ ...settings, colorblind: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between text-xs">
                  <span>Impact Micro-Shake & Bounce</span>
                  <input
                    type="checkbox"
                    checked={settings.screenShake}
                    onChange={(e) => onUpdate({ ...settings, screenShake: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Procedural Web Audio
              </h3>
              <div className="glass-panel space-y-2.5 rounded-2xl p-3">
                <div>
                  <div className="flex justify-between text-xs">
                    <span>SFX Volume</span>
                    <span className="font-mono-num">{Math.round(settings.sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.sfxVolume}
                    onChange={(e) => onUpdate({ ...settings, sfxVolume: Number(e.target.value) })}
                    className="mt-1 w-full accent-[var(--accent)]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span>Ambient Groove (BGM)</span>
                    <span className="font-mono-num">{Math.round(settings.bgmVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.bgmVolume}
                    onChange={(e) => onUpdate({ ...settings, bgmVolume: Number(e.target.value) })}
                    className="mt-1 w-full accent-[var(--accent)]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Key Bindings */}
          <section className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Key Bindings (Click to Rebind)
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdate({ ...settings, keyBindings: DEFAULT_KEY_BINDINGS })}
                  className="glass-panel rounded-lg px-2.5 py-1 text-[11px] font-medium hover:opacity-90"
                >
                  Guideline Preset
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ ...settings, keyBindings: WASD_KEY_BINDINGS })}
                  className="glass-panel rounded-lg px-2.5 py-1 text-[11px] font-medium hover:opacity-90"
                >
                  WASD Dual Preset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {ACTIONS_ORDER.map((action) => {
                const isListening = listeningAction === action;
                const keys = settings.keyBindings[action];
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setListeningAction(isListening ? null : action)}
                    className={`glass-panel flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${
                      isListening ? 'ring-2 ring-[var(--accent)]' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="font-medium">{ACTION_LABELS[action]}</span>
                    <span className="font-mono-num flex items-center gap-1 text-[11px] text-[var(--accent)]">
                      {isListening
                        ? 'Press any key...'
                        : keys.length > 0
                          ? keys.map(formatKeyCode).join(' / ')
                          : 'Unbound'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--surface-border)] pt-3.5">
          <button
            type="button"
            onClick={() => onUpdate(DEFAULT_SETTINGS)}
            className="glass-panel flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Defaults
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-xs font-bold shadow-md"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

import type {
  ActionName,
  GameMode,
  KeyBindings,
  LeaderboardEntry,
  Settings,
  TouchControlLift,
} from '../types/game';

const SETTINGS_KEY = 'prism_tetris_settings_v1';
const SCORES_KEY = 'prism_tetris_scores_v1';

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveLeft: ['ArrowLeft'],
  moveRight: ['ArrowRight'],
  softDrop: ['ArrowDown'],
  hardDrop: ['Space'],
  rotateCW: ['ArrowUp', 'KeyX'],
  rotateCCW: ['KeyZ', 'ControlLeft'],
  rotate180: ['KeyA'],
  hold: ['KeyC', 'ShiftLeft'],
  pause: ['KeyP', 'Escape'],
  restart: ['KeyR'],
};

export const WASD_KEY_BINDINGS: KeyBindings = {
  moveLeft: ['ArrowLeft', 'KeyA'],
  moveRight: ['ArrowRight', 'KeyD'],
  softDrop: ['ArrowDown', 'KeyS'],
  hardDrop: ['Space'],
  rotateCW: ['ArrowUp', 'KeyW', 'KeyX'],
  rotateCCW: ['KeyZ', 'KeyQ', 'ControlLeft'],
  rotate180: ['KeyE'],
  hold: ['KeyC', 'ShiftLeft'],
  pause: ['KeyP', 'Escape'],
  restart: ['KeyR'],
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'neon-prism',
  colorblind: false,
  screenShake: true,
  showGhostPiece: false,
  touchControlLift: 'comfort',
  touchGestures: true,
  showTouchControls: true,
  swapTouchHandedness: false,
  sfxVolume: 0.7,
  bgmVolume: 0.25,
  muted: false,
  handling: {
    das: 133,
    arr: 16,
    sdf: 20,
  },
  keyBindings: DEFAULT_KEY_BINDINGS,
};

export type LeaderboardMap = Record<GameMode, LeaderboardEntry[]>;

const EMPTY_LEADERBOARD: LeaderboardMap = {
  marathon: [],
  sprint: [],
  ultra: [],
  zen: [],
};

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const validLift: TouchControlLift =
      parsed.touchControlLift === 'compact' ||
      parsed.touchControlLift === 'comfort' ||
      parsed.touchControlLift === 'high'
        ? parsed.touchControlLift
        : DEFAULT_SETTINGS.touchControlLift;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      touchControlLift: validLift,
      handling: {
        ...DEFAULT_SETTINGS.handling,
        ...(parsed.handling ?? {}),
      },
      keyBindings: {
        ...DEFAULT_KEY_BINDINGS,
        ...(parsed.keyBindings ?? {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadLeaderboards(): LeaderboardMap {
  if (typeof window === 'undefined') return EMPTY_LEADERBOARD;
  try {
    const raw = window.localStorage.getItem(SCORES_KEY);
    if (!raw) return EMPTY_LEADERBOARD;
    const parsed = JSON.parse(raw) as Partial<LeaderboardMap>;
    return {
      marathon: Array.isArray(parsed.marathon) ? parsed.marathon : [],
      sprint: Array.isArray(parsed.sprint) ? parsed.sprint : [],
      ultra: Array.isArray(parsed.ultra) ? parsed.ultra : [],
      zen: Array.isArray(parsed.zen) ? parsed.zen : [],
    };
  } catch {
    return EMPTY_LEADERBOARD;
  }
}

export function recordLeaderboardEntry(
  entry: Omit<LeaderboardEntry, 'id' | 'dateIso'>
): { map: LeaderboardMap; isNewBest: boolean } {
  const current = loadLeaderboards();
  const fullEntry: LeaderboardEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dateIso: new Date().toISOString(),
  };

  const list = [...current[entry.mode], fullEntry];
  if (entry.mode === 'sprint') {
    list.sort((a, b) => a.elapsedMs - b.elapsedMs);
  } else {
    list.sort((a, b) => b.score - a.score || b.lines - a.lines);
  }

  const trimmed = list.slice(0, 5);
  const isNewBest = trimmed[0]?.id === fullEntry.id;

  const updated: LeaderboardMap = {
    ...current,
    [entry.mode]: trimmed,
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SCORES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
  }

  return { map: updated, isNewBest };
}

export function formatKeyCode(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  switch (code) {
    case 'ArrowLeft':
      return '←';
    case 'ArrowRight':
      return '→';
    case 'ArrowUp':
      return '↑';
    case 'ArrowDown':
      return '↓';
    case 'Space':
      return '空格';
    case 'ShiftLeft':
    case 'ShiftRight':
      return 'Shift';
    case 'ControlLeft':
    case 'ControlRight':
      return 'Ctrl';
    case 'Escape':
      return 'Esc';
    default:
      return code;
  }
}

export const ACTION_LABELS: Record<ActionName, string> = {
  moveLeft: '向左移动',
  moveRight: '向右移动',
  softDrop: '软降（加速下落）',
  hardDrop: '硬降（瞬间落底）',
  rotateCW: '顺时针旋转',
  rotateCCW: '逆时针旋转',
  rotate180: '180° 旋转',
  hold: '暂存方块 (Hold)',
  pause: '暂停 / 菜单',
  restart: '极速重开',
};

export function formatDurationMs(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const hundredths = Math.floor((safe % 1000) / 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

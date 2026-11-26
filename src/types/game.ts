export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type RotationState = 0 | 1 | 2 | 3;

export type GameMode = 'marathon' | 'sprint' | 'ultra' | 'zen';

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';

export type ThemeId = 'neon-prism' | 'zen-frost' | 'retro-phosphor';

export type TSpinType = 'none' | 'mini' | 'full';

export type ActionName =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCW'
  | 'rotateCCW'
  | 'rotate180'
  | 'hold'
  | 'pause'
  | 'restart';

export type KeyBindings = Record<ActionName, string[]>;

export interface HandlingSettings {
  /** Delayed Auto Shift in ms (50 - 250) */
  das: number;
  /** Auto Repeat Rate in ms (0 = instant to wall, 1 - 50) */
  arr: number;
  /** Soft Drop Factor (5 - 40, or 0 = instant to floor) */
  sdf: number;
}

export interface Settings {
  theme: ThemeId;
  colorblind: boolean;
  screenShake: boolean;
  sfxVolume: number;
  bgmVolume: number;
  muted: boolean;
  handling: HandlingSettings;
  keyBindings: KeyBindings;
}

export interface ActivePiece {
  type: PieceType;
  x: number;
  y: number;
  rotation: RotationState;
}

export type BoardGrid = (PieceType | null)[][];

export interface ClearedCell {
  x: number;
  y: number;
  type: PieceType;
}

export interface CalloutBadge {
  id: number;
  label: string;
  sublabel?: string;
  tone: 'accent' | 'gold' | 'violet' | 'emerald';
}

export type EngineEvent =
  | { type: 'move'; dx: number }
  | { type: 'rotate'; dir: 'cw' | 'ccw' | '180'; kickIndex: number; tSpin: TSpinType }
  | { type: 'softDrop'; rows: number }
  | { type: 'hardDrop'; pieceType: PieceType; fromY: number; toY: number; cells: [number, number][] }
  | { type: 'hold'; pieceType: PieceType }
  | { type: 'lock'; pieceType: PieceType; cells: [number, number][] }
  | {
      type: 'lineClear';
      rows: number[];
      clearedCells: ClearedCell[];
      lines: number;
      tSpin: TSpinType;
      isB2B: boolean;
      combo: number;
      isAllClear: boolean;
      points: number;
      callouts: string[];
    }
  | { type: 'levelUp'; level: number }
  | { type: 'zenClear'; clearedRows: number }
  | { type: 'gameOver' }
  | { type: 'victory' };

export interface GameStats {
  mode: GameMode;
  score: number;
  lines: number;
  level: number;
  elapsedMs: number;
  remainingMs: number;
  piecesPlaced: number;
  pps: number;
  combo: number;
  maxCombo: number;
  b2bActive: boolean;
  b2bCount: number;
  tSpins: number;
  tetrises: number;
  allClears: number;
}

export interface HudSnapshot extends GameStats {
  status: GameStatus;
  holdPiece: PieceType | null;
  holdUsed: boolean;
  nextQueue: PieceType[];
  lockProgress: number;
  isGrounded: boolean;
}

export interface LeaderboardEntry {
  id: string;
  mode: GameMode;
  score: number;
  lines: number;
  elapsedMs: number;
  pps: number;
  maxCombo: number;
  tSpins: number;
  dateIso: string;
}

import type { PieceType, RotationState } from '../types/game';

export const BOARD_COLS = 10;
export const VISIBLE_ROWS = 20;
export const BUFFER_ROWS = 4;
export const TOTAL_ROWS = VISIBLE_ROWS + BUFFER_ROWS; // 24

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const SPRINT_TARGET_LINES = 40;
export const ULTRA_DURATION_MS = 120_000;
export const MAX_MARATHON_LEVEL = 20;

export const ALL_PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export type CellOffset = readonly [number, number];
export type KickTable = Record<string, readonly CellOffset[]>;

/**
 * Standard Guideline SRS piece shape offsets relative to piece origin (top-left of bounding box).
 * Coordinates use grid space: +x right, +y down.
 */
export const ROTATION_MATRICES: Record<PieceType, Record<RotationState, readonly CellOffset[]>> = {
  I: {
    0: [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    1: [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    2: [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],
    3: [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
  },
  O: {
    0: [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    1: [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    2: [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    3: [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
  },
  T: {
    0: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    1: [
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    2: [
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    3: [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  },
  S: {
    0: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    1: [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    2: [
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
    ],
    3: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  },
  Z: {
    0: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    1: [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    2: [
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    3: [
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ],
  },
  J: {
    0: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    1: [
      [1, 0],
      [2, 0],
      [1, 1],
      [1, 2],
    ],
    2: [
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    3: [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  },
  L: {
    0: [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    1: [
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    2: [
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
    ],
    3: [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  },
};

/**
 * Standard SRS wall kick offsets for J, L, S, T, Z (+x right, +y down).
 */
export const JLSTZ_KICKS: KickTable = {
  '0>1': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  '1>0': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  '1>2': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  '2>1': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  '2>3': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  '3>2': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  '3>0': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  '0>3': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
};

/**
 * Standard SRS wall kick offsets for I piece (+x right, +y down).
 */
export const I_KICKS: KickTable = {
  '0>1': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, 1],
    [1, -2],
  ],
  '1>0': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, -1],
    [-1, 2],
  ],
  '1>2': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, -2],
    [2, 1],
  ],
  '2>1': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, 2],
    [-2, -1],
  ],
  '2>3': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, -1],
    [-1, 2],
  ],
  '3>2': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, 1],
    [1, -2],
  ],
  '3>0': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, 2],
    [-2, -1],
  ],
  '0>3': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, -2],
    [2, 1],
  ],
};

/**
 * SRS+ 180-degree rotation kick offsets (+x right, +y down).
 */
export const KICKS_180: KickTable = {
  '0>2': [
    [0, 0],
    [0, -1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
  ],
  '2>0': [
    [0, 0],
    [0, 1],
    [-1, 1],
    [1, 1],
    [-1, 0],
    [1, 0],
  ],
  '1>3': [
    [0, 0],
    [1, 0],
    [1, -2],
    [1, -1],
    [0, -2],
    [0, -1],
  ],
  '3>1': [
    [0, 0],
    [-1, 0],
    [-1, -2],
    [-1, -1],
    [0, -2],
    [0, -1],
  ],
};

/**
 * Tetris Guideline gravity curve in milliseconds per row for levels 1..20.
 */
export function getGravityMs(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_MARATHON_LEVEL, level));
  const seconds = Math.pow(0.8 - (clamped - 1) * 0.007, clamped - 1);
  return Math.max(4, seconds * 1000);
}

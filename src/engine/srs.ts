import type { ActivePiece, BoardGrid, RotationState, TSpinType } from '../types/game';
import {
  BOARD_COLS,
  I_KICKS,
  JLSTZ_KICKS,
  KICKS_180,
  ROTATION_MATRICES,
  TOTAL_ROWS,
} from './constants';

export function getPieceCells(piece: ActivePiece): [number, number][] {
  const shape = ROTATION_MATRICES[piece.type][piece.rotation];
  return shape.map(([ox, oy]) => [piece.x + ox, piece.y + oy]);
}

export function isCellOccupied(board: BoardGrid, x: number, y: number): boolean {
  if (x < 0 || x >= BOARD_COLS || y >= TOTAL_ROWS) {
    return true;
  }
  if (y < 0) {
    return false;
  }
  return board[y][x] !== null;
}

export function canPlace(board: BoardGrid, piece: ActivePiece): boolean {
  const shape = ROTATION_MATRICES[piece.type][piece.rotation];
  for (let i = 0; i < shape.length; i++) {
    const x = piece.x + shape[i][0];
    const y = piece.y + shape[i][1];
    if (x < 0 || x >= BOARD_COLS || y < 0 || y >= TOTAL_ROWS) {
      return false;
    }
    if (board[y][x] !== null) {
      return false;
    }
  }
  return true;
}

export interface RotationResult {
  piece: ActivePiece;
  kickIndex: number;
}

export function tryRotate(
  board: BoardGrid,
  piece: ActivePiece,
  dir: 'cw' | 'ccw' | '180'
): RotationResult | null {
  const delta = dir === 'cw' ? 1 : dir === 'ccw' ? 3 : 2;
  const nextRot = ((piece.rotation + delta) % 4) as RotationState;

  if (piece.type === 'O') {
    const candidate: ActivePiece = { ...piece, rotation: nextRot };
    return canPlace(board, candidate) ? { piece: candidate, kickIndex: 0 } : null;
  }

  const key = `${piece.rotation}>${nextRot}`;
  const kicks =
    dir === '180'
      ? KICKS_180[key] ?? [[0, 0]]
      : piece.type === 'I'
        ? I_KICKS[key] ?? [[0, 0]]
        : JLSTZ_KICKS[key] ?? [[0, 0]];

  for (let i = 0; i < kicks.length; i++) {
    const [dx, dy] = kicks[i];
    const candidate: ActivePiece = {
      type: piece.type,
      x: piece.x + dx,
      y: piece.y + dy,
      rotation: nextRot,
    };
    if (canPlace(board, candidate)) {
      return { piece: candidate, kickIndex: i };
    }
  }

  return null;
}

/**
 * Standard Guideline 3-Corner T-Spin rule.
 * Center of the T piece is at (piece.x + 1, piece.y + 1).
 */
export function detectTSpin(
  board: BoardGrid,
  piece: ActivePiece,
  lastActionWasRotate: boolean,
  lastKickIndex: number
): TSpinType {
  if (piece.type !== 'T' || !lastActionWasRotate) {
    return 'none';
  }

  const cx = piece.x + 1;
  const cy = piece.y + 1;

  // Corners relative to T center: TL, TR, BR, BL
  const tl = isCellOccupied(board, cx - 1, cy - 1);
  const tr = isCellOccupied(board, cx + 1, cy - 1);
  const br = isCellOccupied(board, cx + 1, cy + 1);
  const bl = isCellOccupied(board, cx - 1, cy + 1);

  const occupiedCorners = (tl ? 1 : 0) + (tr ? 1 : 0) + (br ? 1 : 0) + (bl ? 1 : 0);
  if (occupiedCorners < 3) {
    return 'none';
  }

  // Front corners based on T facing direction
  let frontCount = 0;
  switch (piece.rotation) {
    case 0: // Facing Up
      frontCount = (tl ? 1 : 0) + (tr ? 1 : 0);
      break;
    case 1: // Facing Right
      frontCount = (tr ? 1 : 0) + (br ? 1 : 0);
      break;
    case 2: // Facing Down
      frontCount = (bl ? 1 : 0) + (br ? 1 : 0);
      break;
    case 3: // Facing Left
      frontCount = (tl ? 1 : 0) + (bl ? 1 : 0);
      break;
  }

  // Full T-Spin if both front corners are occupied OR the 5th SRS kick (index 4) was used
  if (frontCount === 2 || lastKickIndex === 4) {
    return 'full';
  }

  return 'mini';
}

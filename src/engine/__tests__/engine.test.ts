import { describe, expect, it } from 'vitest';
import { BagRandomizer } from '../bag';
import {
  ALL_PIECE_TYPES,
  BOARD_COLS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  TOTAL_ROWS,
  ULTRA_DURATION_MS,
} from '../constants';
import { calculateClearScore } from '../scoring';
import { canPlace, detectTSpin, tryRotate } from '../srs';
import { TetrisEngine } from '../TetrisEngine';
import { DEFAULT_SETTINGS } from '../../storage/persistence';
import type { ActivePiece, BoardGrid, PieceType } from '../../types/game';

function emptyBoard(): BoardGrid {
  return Array.from({ length: TOTAL_ROWS }, () => Array<PieceType | null>(BOARD_COLS).fill(null));
}

describe('BagRandomizer (7-Bag)', () => {
  it('yields all 7 unique tetrominoes in every 7-piece bag across 700 pieces', () => {
    const bag = new BagRandomizer();
    for (let i = 0; i < 100; i++) {
      const slice: PieceType[] = [];
      for (let k = 0; k < 7; k++) {
        slice.push(bag.next());
      }
      expect(new Set(slice).size).toBe(7);
      for (const t of ALL_PIECE_TYPES) {
        expect(slice).toContain(t);
      }
    }
  });

  it('peek returns upcoming pieces without consuming them', () => {
    const bag = new BagRandomizer();
    const peeked = bag.peek(5);
    expect(peeked).toHaveLength(5);
    const drawn = Array.from({ length: 5 }, () => bag.next());
    expect(drawn).toEqual(peeked);
  });
});

describe('SRS Rotation & Wall Kicks', () => {
  it('kicks JLSTZ piece off the left wall when rotating from vertical to horizontal', () => {
    const board = emptyBoard();
    // T in state 1 at x=-1 has occupied cells at (0,10), (0,11), (1,11), (0,12).
    // Rotating CW (1->2) requires shifting x from -1 to 0 via kickIndex 1 (+1, 0).
    const piece: ActivePiece = { type: 'T', x: -1, y: 10, rotation: 1 };
    expect(canPlace(board, piece)).toBe(true);

    const res = tryRotate(board, piece, 'cw');
    expect(res).not.toBeNull();
    expect(res!.piece.rotation).toBe(2);
    expect(res!.piece.x).toBe(0);
    expect(res!.kickIndex).toBe(1);
  });

  it('kicks I piece off the right wall using I-specific kick table', () => {
    const board = emptyBoard();
    // I in state 1 occupies column x+2. At x=7, cells are at col 9.
    const piece: ActivePiece = { type: 'I', x: 7, y: 10, rotation: 1 };
    expect(canPlace(board, piece)).toBe(true);

    const res = tryRotate(board, piece, 'cw'); // 1>2 kicks [-1,0] -> [2,0]...
    expect(res).not.toBeNull();
    expect(res!.piece.rotation).toBe(2);
    expect(res!.piece.x).toBe(6);
    expect(res!.kickIndex).toBe(1);
  });

  it('supports 180-degree rotation with kicks', () => {
    const board = emptyBoard();
    const piece: ActivePiece = { type: 'T', x: 4, y: 21, rotation: 2 };
    // At y=21 in rotation 2, bottom row of T is at y=23 (floor). Rotating 2->0 fits at y=21 or kicks up.
    const res = tryRotate(board, piece, '180');
    expect(res).not.toBeNull();
    expect(res!.piece.rotation).toBe(0);
  });

  it('performs classic T-Spin Double kick (0>1 kick index 4)', () => {
    const kickBoard = emptyBoard();
    // Start T: x=1, y=19, rot=0 -> cells (2,19), (1,20), (2,20), (3,20).
    // Kick 0 [0,0]: x=1,y=19,rot=1 -> (2,19),(2,20),(3,20),(2,21) -> blocked at (2,21).
    kickBoard[21][2] = 'L';
    // Kick 1 [-1,0]: x=0,y=19,rot=1 -> (1,19),(1,20),(2,20),(1,21) -> blocked at (1,19).
    kickBoard[19][1] = 'L';
    // Kick 2 [-1,-1]: x=0,y=18,rot=1 -> (1,18),(1,19),(2,19),(1,20) -> blocked at (1,19).
    // Kick 3 [0,+2]: x=1,y=21,rot=1 -> (2,21),(2,22),(3,22),(2,23) -> blocked at (2,21).
    // Kick 4 [-1,+2]: x=0,y=21,rot=1 -> (1,21),(1,22),(2,22),(1,23) -> FREE!
    const startT: ActivePiece = { type: 'T', x: 1, y: 19, rotation: 0 };
    expect(canPlace(kickBoard, startT)).toBe(true);

    const res = tryRotate(kickBoard, startT, 'cw');
    expect(res).not.toBeNull();
    expect(res!.kickIndex).toBe(4);
    expect(res!.piece).toEqual({ type: 'T', x: 0, y: 21, rotation: 1 });
  });
});

describe('T-Spin Detection', () => {
  it('detects Full T-Spin when both front corners and one back corner are occupied', () => {
    const board = emptyBoard();
    // T at x=3, y=21, rotation=2 (facing down). Center = (4,22).
    // Front corners (bottom): BL=(3,23), BR=(5,23). Back corner: TL=(3,21).
    board[23][3] = 'I';
    board[23][5] = 'I';
    board[21][3] = 'J';
    const piece: ActivePiece = { type: 'T', x: 3, y: 21, rotation: 2 };
    expect(detectTSpin(board, piece, true, 0)).toBe('full');
  });

  it('detects Mini T-Spin when 3 corners occupied and only 1 front corner occupied (kickIndex < 4)', () => {
    const board = emptyBoard();
    // T at x=3, y=21, rotation=2 (facing down). Center = (4,22).
    // Front corners: BL=(3,23) occupied, BR=(5,23) empty. Back corners: TL=(3,21), TR=(5,21) occupied.
    board[23][3] = 'I';
    board[21][3] = 'J';
    board[21][5] = 'J';
    const piece: ActivePiece = { type: 'T', x: 3, y: 21, rotation: 2 };
    expect(detectTSpin(board, piece, true, 1)).toBe('mini');
  });

  it('upgrades Mini to Full T-Spin when kickIndex === 4', () => {
    const board = emptyBoard();
    board[23][3] = 'I';
    board[21][3] = 'J';
    board[21][5] = 'J';
    const piece: ActivePiece = { type: 'T', x: 3, y: 21, rotation: 2 };
    expect(detectTSpin(board, piece, true, 4)).toBe('full');
  });

  it('returns none if last action was not a rotation', () => {
    const board = emptyBoard();
    board[23][3] = 'I';
    board[23][5] = 'I';
    board[21][3] = 'J';
    const piece: ActivePiece = { type: 'T', x: 3, y: 21, rotation: 2 };
    expect(detectTSpin(board, piece, false, 0)).toBe('none');
  });
});

describe('Guideline Scoring', () => {
  it('scores Single, Double, Triple, Tetris, B2B, Combo, and All Clear accurately', () => {
    const tetris1 = calculateClearScore({
      lines: 4,
      tSpin: 'none',
      level: 1,
      b2bActive: false,
      combo: -1,
      isAllClear: false,
    });
    expect(tetris1.points).toBe(800);
    expect(tetris1.nextB2B).toBe(true);
    expect(tetris1.callouts).toContain('TETRIS');

    // Back-to-back T-Spin Double on level 2 with combo=0 -> nextCombo=1
    const b2bTsd = calculateClearScore({
      lines: 2,
      tSpin: 'full',
      level: 2,
      b2bActive: true,
      combo: 0,
      isAllClear: false,
    });
    // Base 1200 * 2 = 2400 * 1.5 = 3600 + combo (50 * 1 * 2 = 100) = 3700
    expect(b2bTsd.points).toBe(3700);
    expect(b2bTsd.isB2BTriggered).toBe(true);
    expect(b2bTsd.callouts).toEqual(['T-SPIN DOUBLE', 'BACK-TO-BACK', 'COMBO x1']);

    // Non-difficult clear breaks B2B
    const single = calculateClearScore({
      lines: 1,
      tSpin: 'none',
      level: 1,
      b2bActive: true,
      combo: 1,
      isAllClear: false,
    });
    expect(single.nextB2B).toBe(false);
    expect(single.points).toBe(100 + 100); // 100 + 50*2*1

    // All Clear bonus
    const ac = calculateClearScore({
      lines: 4,
      tSpin: 'none',
      level: 1,
      b2bActive: true,
      combo: -1,
      isAllClear: true,
    });
    // 800 * 1.5 + 3200 = 4400
    expect(ac.points).toBe(4400);
    expect(ac.callouts).toContain('ALL CLEAR');
  });
});

function advanceEngine(engine: TetrisEngine, totalMs: number): void {
  let rem = totalMs;
  while (rem > 0) {
    const step = Math.min(50, rem);
    engine.update(step);
    rem -= step;
  }
}

describe('TetrisEngine Lock Delay & Game Modes', () => {
  it('locks piece after 500ms grounded and allows up to 15 move/rotate resets', () => {
    const engine = new TetrisEngine(() => 0.1);
    engine.start('marathon');

    // Soft drop to floor
    engine.softDropToFloor();
    expect(engine.isGrounded()).toBe(true);

    // Move left/right 15 times at 400ms intervals without locking
    for (let i = 0; i < MAX_LOCK_RESETS; i++) {
      advanceEngine(engine, 400);
      expect(engine.piecesPlaced).toBe(0);
      const moved = engine.move(i % 2 === 0 ? -1 : 1);
      expect(moved).toBe(true);
    }

    // 16th reset should NOT reset lock timer
    advanceEngine(engine, 300);
    engine.move(-1); // Exceeds 15 resets
    advanceEngine(engine, LOCK_DELAY_MS - 300 + 20);
    expect(engine.piecesPlaced).toBe(1);
  });

  it('triggers victory at 40 lines in Sprint mode', () => {
    const engine = new TetrisEngine(() => 0.1);
    engine.start('sprint');

    // Pre-fill 39 lines cleared and set up 1 bottom row missing 4 cells for an I-piece
    engine.lines = 39;
    for (let x = 0; x < 6; x++) {
      engine.board[TOTAL_ROWS - 1][x] = 'J';
    }
    engine.activePiece = { type: 'I', x: 6, y: TOTAL_ROWS - 2, rotation: 0 };
    engine.hardDrop();

    expect(engine.lines).toBe(40);
    expect(engine.status).toBe('victory');
  });

  it('finishes Ultra mode after 120 seconds', () => {
    const engine = new TetrisEngine(() => 0.5);
    engine.start('ultra');
    let elapsed = 0;
    while (elapsed < ULTRA_DURATION_MS) {
      engine.update(100);
      elapsed += 100;
    }
    expect(engine.remainingMs).toBe(0);
    expect(engine.status).toBe('victory');
  });

  it('never Game Overs in Zen mode even when stack fills to the top', () => {
    const engine = new TetrisEngine(() => 0.2);
    engine.start('zen');

    // Fill rows 1..23 with checkerboard gaps so no row clears, forcing spawn block-out
    for (let y = 1; y < TOTAL_ROWS; y++) {
      for (let x = 0; x < BOARD_COLS; x++) {
        engine.board[y][x] = 'T';
      }
      engine.board[y][y % 2 === 0 ? 0 : 9] = null;
    }

    let zenCleared = false;
    engine.onEvent((ev) => {
      if (ev.type === 'zenClear') zenCleared = true;
    });

    engine.hardDrop();
    expect(engine.status).toBe('playing');
    expect(zenCleared).toBe(true);
    expect(engine.activePiece).not.toBeNull();
  });

  it('tracks getLockProgress and getStackTopRow accurately', () => {
    const engine = new TetrisEngine(() => 0.1);
    engine.start('marathon');

    expect(engine.getStackTopRow()).toBe(TOTAL_ROWS);
    expect(engine.getLockProgress()).toBe(0);

    engine.softDropToFloor();
    expect(engine.isGrounded()).toBe(true);
    advanceEngine(engine, LOCK_DELAY_MS / 2);
    expect(engine.getLockProgress()).toBeCloseTo(0.5, 2);

    engine.hardDrop();
    expect(engine.getStackTopRow()).toBeLessThan(TOTAL_ROWS);
    expect(engine.getLockProgress()).toBe(0);
  });
});

describe('Default Settings', () => {
  it('disables ghost piece by default and uses comfort touch control lift', () => {
    expect(DEFAULT_SETTINGS.showGhostPiece).toBe(false);
    expect(DEFAULT_SETTINGS.touchControlLift).toBe('comfort');
    expect(DEFAULT_SETTINGS.touchGestures).toBe(true);
    expect(DEFAULT_SETTINGS.showTouchControls).toBe(true);
    expect(DEFAULT_SETTINGS.swapTouchHandedness).toBe(false);
  });
});

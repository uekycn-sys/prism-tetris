import type {
  ActivePiece,
  BoardGrid,
  ClearedCell,
  EngineEvent,
  GameMode,
  GameStatus,
  HudSnapshot,
  PieceType,
  TSpinType,
} from '../types/game';
import { BagRandomizer } from './bag';
import {
  BOARD_COLS,
  BUFFER_ROWS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  MAX_MARATHON_LEVEL,
  SPRINT_TARGET_LINES,
  TOTAL_ROWS,
  ULTRA_DURATION_MS,
  getGravityMs,
} from './constants';
import { calculateClearScore } from './scoring';
import { canPlace, detectTSpin, getPieceCells, tryRotate } from './srs';

export type EngineListener = (event: EngineEvent) => void;

function createEmptyBoard(): BoardGrid {
  return Array.from({ length: TOTAL_ROWS }, () => Array<PieceType | null>(BOARD_COLS).fill(null));
}

function getSpawnPosition(type: PieceType): ActivePiece {
  // O spawns centered at x=3 with offsets [1,2] -> columns 4,5.
  // I spawns at x=3 -> columns 3..6.
  // 3-wide pieces spawn at x=3 -> columns 3..5.
  return {
    type,
    x: 3,
    y: BUFFER_ROWS - 2, // row 2 in 24-row grid (just above visible row 4)
    rotation: 0,
  };
}

export class TetrisEngine {
  public board: BoardGrid = createEmptyBoard();
  public activePiece: ActivePiece | null = null;
  public holdPiece: PieceType | null = null;
  public holdUsed = false;

  public status: GameStatus = 'menu';
  public mode: GameMode = 'marathon';

  public score = 0;
  public lines = 0;
  public level = 1;
  public elapsedMs = 0;
  public remainingMs = ULTRA_DURATION_MS;
  public piecesPlaced = 0;

  public combo = -1;
  public maxCombo = 0;
  public b2bActive = false;
  public b2bCount = 0;
  public tSpins = 0;
  public tetrises = 0;
  public allClears = 0;

  private bag: BagRandomizer;
  private gravityTimerMs = 0;
  private lockTimerMs = 0;
  private lockResets = 0;
  private lowestY = 0;
  private lastActionWasRotate = false;
  private lastKickIndex = 0;
  private listeners = new Set<EngineListener>();

  constructor(rng: () => number = Math.random) {
    this.bag = new BagRandomizer(rng);
  }

  onEvent(listener: EngineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: EngineEvent): void {
    this.listeners.forEach((fn) => fn(event));
  }

  start(mode: GameMode): void {
    this.mode = mode;
    this.board = createEmptyBoard();
    this.bag.reset();
    this.activePiece = null;
    this.holdPiece = null;
    this.holdUsed = false;

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.elapsedMs = 0;
    this.remainingMs = mode === 'ultra' ? ULTRA_DURATION_MS : 0;
    this.piecesPlaced = 0;

    this.combo = -1;
    this.maxCombo = 0;
    this.b2bActive = false;
    this.b2bCount = 0;
    this.tSpins = 0;
    this.tetrises = 0;
    this.allClears = 0;

    this.gravityTimerMs = 0;
    this.lockTimerMs = 0;
    this.lockResets = 0;
    this.lowestY = 0;
    this.lastActionWasRotate = false;
    this.lastKickIndex = 0;

    this.status = 'playing';
    this.spawnNextPiece();
  }

  restart(): void {
    this.start(this.mode);
  }

  pause(): void {
    if (this.status === 'playing') {
      this.status = 'paused';
    }
  }

  resume(): void {
    if (this.status === 'paused') {
      this.status = 'playing';
    }
  }

  returnToMenu(): void {
    this.status = 'menu';
    this.activePiece = null;
  }

  getNextQueue(count = 5): PieceType[] {
    return this.bag.peek(count);
  }

  getCurrentGravityMs(): number {
    if (this.mode === 'sprint' || this.mode === 'zen') {
      return getGravityMs(1);
    }
    return getGravityMs(this.level);
  }

  isGrounded(): boolean {
    if (!this.activePiece) return false;
    return !canPlace(this.board, { ...this.activePiece, y: this.activePiece.y + 1 });
  }

  getLockProgress(): number {
    return this.isGrounded() ? Math.min(1, this.lockTimerMs / LOCK_DELAY_MS) : 0;
  }

  getStackTopRow(): number {
    for (let y = 0; y < TOTAL_ROWS; y++) {
      for (let x = 0; x < BOARD_COLS; x++) {
        if (this.board[y][x] !== null) {
          return y;
        }
      }
    }
    return TOTAL_ROWS;
  }

  getGhostY(): number | null {
    if (!this.activePiece) return null;
    let gy = this.activePiece.y;
    while (canPlace(this.board, { ...this.activePiece, y: gy + 1 })) {
      gy++;
    }
    return gy;
  }

  private spawnPiece(type: PieceType): void {
    const candidate = getSpawnPosition(type);

    if (!canPlace(this.board, candidate)) {
      // Try one row higher in buffer zone as Guideline safety
      const higher = { ...candidate, y: candidate.y - 1 };
      if (canPlace(this.board, higher)) {
        this.activatePiece(higher);
        return;
      }

      if (this.mode === 'zen') {
        this.clearZenBottomRows(4);
        if (canPlace(this.board, candidate)) {
          this.activatePiece(candidate);
          return;
        }
      }

      this.activePiece = null;
      this.status = 'gameover';
      this.emit({ type: 'gameOver' });
      return;
    }

    this.activatePiece(candidate);
  }

  private activatePiece(piece: ActivePiece): void {
    this.activePiece = piece;
    this.gravityTimerMs = 0;
    this.lockTimerMs = 0;
    this.lockResets = 0;
    this.lowestY = piece.y;
    this.lastActionWasRotate = false;
    this.lastKickIndex = 0;
  }

  private spawnNextPiece(): void {
    const nextType = this.bag.next();
    this.holdUsed = false;
    this.spawnPiece(nextType);
  }

  private clearZenBottomRows(rowCount: number): void {
    const count = Math.min(rowCount, TOTAL_ROWS);
    this.board.splice(TOTAL_ROWS - count, count);
    for (let i = 0; i < count; i++) {
      this.board.unshift(Array<PieceType | null>(BOARD_COLS).fill(null));
    }
    this.emit({ type: 'zenClear', clearedRows: count });
  }

  private onSuccessfulMoveOrRotate(movedDown: boolean): void {
    if (!this.activePiece) return;
    if (movedDown && this.activePiece.y > this.lowestY) {
      this.lowestY = this.activePiece.y;
      this.lockTimerMs = 0;
      this.lockResets = 0;
      return;
    }

    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimerMs = 0;
      this.lockResets++;
    } else if (!this.isGrounded()) {
      // If a move/kick pushed piece off ground, reset timer without consuming lock reset
      this.lockTimerMs = 0;
    }
  }

  move(dx: -1 | 1): boolean {
    if (this.status !== 'playing' || !this.activePiece) return false;
    const candidate: ActivePiece = { ...this.activePiece, x: this.activePiece.x + dx };
    if (!canPlace(this.board, candidate)) {
      return false;
    }
    this.activePiece = candidate;
    this.lastActionWasRotate = false;
    this.onSuccessfulMoveOrRotate(false);
    this.emit({ type: 'move', dx });
    return true;
  }

  moveToWall(dx: -1 | 1): boolean {
    if (this.status !== 'playing' || !this.activePiece) return false;
    let moved = false;
    while (canPlace(this.board, { ...this.activePiece, x: this.activePiece.x + dx })) {
      this.activePiece = { ...this.activePiece, x: this.activePiece.x + dx };
      this.lastActionWasRotate = false;
      this.onSuccessfulMoveOrRotate(false);
      moved = true;
    }
    if (moved) {
      this.emit({ type: 'move', dx });
    }
    return moved;
  }

  rotate(dir: 'cw' | 'ccw' | '180'): boolean {
    if (this.status !== 'playing' || !this.activePiece) return false;
    const result = tryRotate(this.board, this.activePiece, dir);
    if (!result) return false;

    this.activePiece = result.piece;
    this.lastActionWasRotate = true;
    this.lastKickIndex = result.kickIndex;
    this.onSuccessfulMoveOrRotate(result.piece.y > this.lowestY);

    const tSpin = detectTSpin(this.board, this.activePiece, true, result.kickIndex);
    this.emit({ type: 'rotate', dir, kickIndex: result.kickIndex, tSpin });
    return true;
  }

  softDropStep(): boolean {
    if (this.status !== 'playing' || !this.activePiece) return false;
    const candidate: ActivePiece = { ...this.activePiece, y: this.activePiece.y + 1 };
    if (!canPlace(this.board, candidate)) {
      return false;
    }
    this.activePiece = candidate;
    this.gravityTimerMs = 0;
    this.lastActionWasRotate = false;
    this.score += 1;
    this.onSuccessfulMoveOrRotate(true);
    this.emit({ type: 'softDrop', rows: 1 });
    return true;
  }

  softDropToFloor(): boolean {
    if (this.status !== 'playing' || !this.activePiece) return false;
    let dropped = 0;
    while (canPlace(this.board, { ...this.activePiece, y: this.activePiece.y + 1 })) {
      this.activePiece = { ...this.activePiece, y: this.activePiece.y + 1 };
      dropped++;
    }
    if (dropped > 0) {
      this.gravityTimerMs = 0;
      this.lastActionWasRotate = false;
      this.score += dropped;
      this.onSuccessfulMoveOrRotate(true);
      this.emit({ type: 'softDrop', rows: dropped });
      return true;
    }
    return false;
  }

  hardDrop(): void {
    if (this.status !== 'playing' || !this.activePiece) return;
    const fromY = this.activePiece.y;
    const ghostY = this.getGhostY() ?? fromY;
    const dist = ghostY - fromY;

    if (dist > 0) {
      this.activePiece = { ...this.activePiece, y: ghostY };
      this.score += dist * 2;
      this.lastActionWasRotate = false;
    }

    const cells = getPieceCells(this.activePiece);
    this.emit({
      type: 'hardDrop',
      pieceType: this.activePiece.type,
      fromY,
      toY: ghostY,
      cells,
    });

    this.lockActivePiece();
  }

  hold(): boolean {
    if (this.status !== 'playing' || !this.activePiece || this.holdUsed) {
      return false;
    }

    const currentType = this.activePiece.type;
    this.holdUsed = true;

    if (this.holdPiece === null) {
      this.holdPiece = currentType;
      const nextType = this.bag.next();
      this.spawnPiece(nextType);
    } else {
      const swapType = this.holdPiece;
      this.holdPiece = currentType;
      this.spawnPiece(swapType);
    }

    this.emit({ type: 'hold', pieceType: currentType });
    return true;
  }

  private lockActivePiece(): void {
    if (!this.activePiece) return;
    const piece = this.activePiece;
    const cells = getPieceCells(piece);

    // Check lock-out: if ALL cells are completely in the hidden buffer zone (< BUFFER_ROWS)
    const allAboveVisible = cells.every(([, y]) => y < BUFFER_ROWS);

    for (let i = 0; i < cells.length; i++) {
      const [x, y] = cells[i];
      if (y >= 0 && y < TOTAL_ROWS && x >= 0 && x < BOARD_COLS) {
        this.board[y][x] = piece.type;
      }
    }

    this.piecesPlaced++;
    this.emit({ type: 'lock', pieceType: piece.type, cells });

    const tSpin: TSpinType = detectTSpin(
      this.board,
      piece,
      this.lastActionWasRotate,
      this.lastKickIndex
    );

    // Detect full rows
    const fullRows: number[] = [];
    const clearedCells: ClearedCell[] = [];
    for (let y = 0; y < TOTAL_ROWS; y++) {
      let full = true;
      for (let x = 0; x < BOARD_COLS; x++) {
        if (this.board[y][x] === null) {
          full = false;
          break;
        }
      }
      if (full) {
        fullRows.push(y);
        for (let x = 0; x < BOARD_COLS; x++) {
          const cellType = this.board[y][x];
          if (cellType) {
            clearedCells.push({ x, y, type: cellType });
          }
        }
      }
    }

    if (fullRows.length > 0) {
      for (let i = fullRows.length - 1; i >= 0; i--) {
        this.board.splice(fullRows[i], 1);
      }
      for (let i = 0; i < fullRows.length; i++) {
        this.board.unshift(Array<PieceType | null>(BOARD_COLS).fill(null));
      }
    }

    // Check All Clear after row collapse
    const isAllClear =
      fullRows.length > 0 &&
      this.board.every((row) => row.every((cell) => cell === null));

    const scoreResult = calculateClearScore({
      lines: fullRows.length,
      tSpin,
      level: this.level,
      b2bActive: this.b2bActive,
      combo: this.combo,
      isAllClear,
    });

    this.score += scoreResult.points;
    this.b2bActive = scoreResult.nextB2B;
    if (scoreResult.isB2BTriggered) {
      this.b2bCount++;
    }
    this.combo = scoreResult.nextCombo;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    if (tSpin !== 'none' && fullRows.length > 0) {
      this.tSpins++;
    }
    if (fullRows.length === 4) {
      this.tetrises++;
    }
    if (isAllClear) {
      this.allClears++;
    }

    if (fullRows.length > 0 || tSpin !== 'none') {
      this.emit({
        type: 'lineClear',
        rows: fullRows,
        clearedCells,
        lines: fullRows.length,
        tSpin,
        isB2B: scoreResult.isB2BTriggered,
        combo: this.combo,
        isAllClear,
        points: scoreResult.points,
        callouts: scoreResult.callouts,
      });
    }

    if (fullRows.length > 0) {
      this.lines += fullRows.length;
      if (this.mode === 'marathon' || this.mode === 'ultra') {
        const nextLevel = Math.min(MAX_MARATHON_LEVEL, Math.floor(this.lines / 10) + 1);
        if (nextLevel > this.level) {
          this.level = nextLevel;
          this.emit({ type: 'levelUp', level: this.level });
        }
      }
    }

    this.activePiece = null;

    // Sprint victory check
    if (this.mode === 'sprint' && this.lines >= SPRINT_TARGET_LINES) {
      this.status = 'victory';
      this.emit({ type: 'victory' });
      return;
    }

    // Lock-out check (only if no lines were cleared or stack remains above visible zone)
    if (allAboveVisible && fullRows.length === 0) {
      if (this.mode === 'zen') {
        this.clearZenBottomRows(4);
      } else {
        this.status = 'gameover';
        this.emit({ type: 'gameOver' });
        return;
      }
    }

    this.spawnNextPiece();
  }

  update(rawDtMs: number): void {
    if (this.status !== 'playing') return;

    const dtMs = Math.max(0, Math.min(rawDtMs, 100));
    this.elapsedMs += dtMs;

    if (this.mode === 'ultra') {
      this.remainingMs = Math.max(0, ULTRA_DURATION_MS - this.elapsedMs);
      if (this.remainingMs <= 0) {
        this.status = 'victory';
        this.emit({ type: 'victory' });
        return;
      }
    }

    if (!this.activePiece) return;

    // Gravity accumulation (consistent across 60/120/144Hz)
    if (!this.isGrounded()) {
      const gravityMs = this.getCurrentGravityMs();
      this.gravityTimerMs += dtMs;
      let steps = 0;
      while (this.gravityTimerMs >= gravityMs && steps < TOTAL_ROWS) {
        this.gravityTimerMs -= gravityMs;
        const nextPos: ActivePiece = { ...this.activePiece, y: this.activePiece.y + 1 };
        if (canPlace(this.board, nextPos)) {
          this.activePiece = nextPos;
          this.lastActionWasRotate = false;
          if (this.activePiece.y > this.lowestY) {
            this.lowestY = this.activePiece.y;
            this.lockTimerMs = 0;
            this.lockResets = 0;
          }
          steps++;
        } else {
          this.gravityTimerMs = 0;
          break;
        }
      }
    } else {
      this.gravityTimerMs = 0;
    }

    // Lock delay processing
    if (this.isGrounded()) {
      this.lockTimerMs += dtMs;
      if (this.lockTimerMs >= LOCK_DELAY_MS) {
        this.lockActivePiece();
      }
    }
  }

  getHudSnapshot(): HudSnapshot {
    const pps = this.elapsedMs > 50 ? this.piecesPlaced / (this.elapsedMs / 1000) : 0;
    const grounded = this.isGrounded();
    return {
      status: this.status,
      mode: this.mode,
      score: this.score,
      lines: this.lines,
      level: this.level,
      elapsedMs: this.elapsedMs,
      remainingMs: this.remainingMs,
      piecesPlaced: this.piecesPlaced,
      pps,
      combo: Math.max(0, this.combo),
      maxCombo: this.maxCombo,
      b2bActive: this.b2bActive,
      b2bCount: this.b2bCount,
      tSpins: this.tSpins,
      tetrises: this.tetrises,
      allClears: this.allClears,
      holdPiece: this.holdPiece,
      holdUsed: this.holdUsed,
      nextQueue: this.getNextQueue(5),
      lockProgress: grounded ? Math.min(1, this.lockTimerMs / LOCK_DELAY_MS) : 0,
      isGrounded: grounded,
    };
  }
}

import { BOARD_COLS, BUFFER_ROWS, VISIBLE_ROWS } from '../engine/constants';
import { getPieceCells } from '../engine/srs';
import type { TetrisEngine } from '../engine/TetrisEngine';
import type { PieceType, ThemeId } from '../types/game';
import type { EffectsManager } from './particles';
import { getPieceStyle, THEMES, type ThemePalette } from './themes';

const PEEK_ROWS = 0.55; // Show top half-row buffer zone peek like TETR.IO

export function drawColorblindMark(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  x: number,
  y: number,
  size: number
): void {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.2;

  ctx.save();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(1.4, size * 0.075);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case 'I':
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();
      break;
    case 'O':
      ctx.strokeRect(cx - r * 0.75, cy - r * 0.75, r * 1.5, r * 1.5);
      break;
    case 'T':
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r * 0.8);
      ctx.lineTo(cx - r, cy + r * 0.8);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'S':
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.8, cy + r * 0.8);
      ctx.lineTo(cx + r * 0.8, cy - r * 0.8);
      ctx.stroke();
      break;
    case 'Z':
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.8, cy - r * 0.8);
      ctx.lineTo(cx + r * 0.8, cy + r * 0.8);
      ctx.stroke();
      break;
    case 'J':
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'L':
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

export function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: PieceType,
  theme: ThemePalette,
  colorblind: boolean,
  alpha = 1,
  lockPulse = 0
): void {
  const style = getPieceStyle(theme, type, colorblind);
  const pad = Math.max(0.75, size * 0.035);
  const bx = x + pad;
  const by = y + pad;
  const bs = size - pad * 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (theme.pixelArt) {
    // Crisp retro pixel block with inner phosphor highlight
    ctx.fillStyle = style.dark;
    ctx.fillRect(bx, by, bs, bs);
    const inset = Math.max(2, Math.floor(bs * 0.14));
    ctx.fillStyle = style.base;
    ctx.fillRect(bx + inset, by + inset, bs - inset * 2, bs - inset * 2);
    ctx.fillStyle = style.light;
    ctx.fillRect(bx + inset, by + inset, Math.max(2, bs * 0.24), Math.max(2, bs * 0.24));
  } else {
    const radius = Math.max(2, Math.min(5, bs * 0.16));
    ctx.beginPath();
    ctx.roundRect(bx, by, bs, bs, radius);

    // Subtle jewel gradient body
    const grad = ctx.createLinearGradient(bx, by, bx, by + bs);
    grad.addColorStop(0, style.light);
    grad.addColorStop(0.24, style.base);
    grad.addColorStop(1, style.dark);
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner specular top highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(1, bs * 0.05);
    ctx.beginPath();
    ctx.moveTo(bx + radius, by + 1);
    ctx.lineTo(bx + bs - radius, by + 1);
    ctx.stroke();

    // Inner bevel shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx + 0.5, by + 0.5, bs - 1, bs - 1, radius);
    ctx.stroke();
  }

  // Lock delay warning tint when grounded
  if (lockPulse > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.08 + lockPulse * 0.26})`;
    ctx.fillRect(bx, by, bs, bs);
  }

  if (colorblind) {
    drawColorblindMark(ctx, type, bx, by, bs);
  }

  ctx.restore();
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize = 30;
  private cssWidth = 300;
  private cssHeight = 616;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
  }

  resize(cellSize: number): { width: number; height: number } {
    const snappedCell = Math.max(14, Math.floor(cellSize));
    this.cellSize = snappedCell;
    this.cssWidth = snappedCell * BOARD_COLS;
    this.cssHeight = Math.round(snappedCell * (VISIBLE_ROWS + PEEK_ROWS));

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(this.cssWidth * dpr);
    this.canvas.height = Math.round(this.cssHeight * dpr);
    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: this.cssWidth, height: this.cssHeight };
  }

  render(
    engine: TetrisEngine,
    effects: EffectsManager,
    themeId: ThemeId,
    colorblind: boolean
  ): void {
    const ctx = this.ctx;
    const theme = THEMES[themeId];
    const cell = this.cellSize;
    const topOffset = Math.round(cell * PEEK_ROWS);

    ctx.save();

    // Board background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.cssHeight);
    bgGrad.addColorStop(0, theme.boardBgTop);
    bgGrad.addColorStop(1, theme.boardBgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);

    // Subtle ambient stardust
    effects.renderBackground(ctx, this.cssWidth, this.cssHeight, themeId);

    // Apply micro shake + elastic hard-drop bump inside playfield
    ctx.save();
    ctx.translate(effects.shakeX, effects.shakeY);

    // Crisp 1px grid lines
    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < BOARD_COLS; x++) {
      const px = Math.floor(x * cell) + 0.5;
      ctx.moveTo(px, topOffset);
      ctx.lineTo(px, this.cssHeight);
    }
    for (let y = 0; y <= VISIBLE_ROWS; y++) {
      const py = Math.floor(topOffset + y * cell) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(this.cssWidth, py);
    }
    ctx.stroke();

    // Top buffer zone divider line
    ctx.strokeStyle = theme.bufferDivider;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, topOffset + 0.5);
    ctx.lineTo(this.cssWidth, topOffset + 0.5);
    ctx.stroke();

    // Hard drop beam trails
    effects.renderBehindPieces(ctx, cell, topOffset);

    // Locked blocks (including top peek row from buffer zone)
    const startRow = BUFFER_ROWS - 1;
    for (let y = startRow; y < engine.board.length; y++) {
      const visY = y - BUFFER_ROWS;
      for (let x = 0; x < BOARD_COLS; x++) {
        const cellType = engine.board[y][x];
        if (!cellType) continue;
        drawBlock(
          ctx,
          x * cell,
          topOffset + visY * cell,
          cell,
          cellType,
          theme,
          colorblind,
          1,
          0
        );
      }
    }

    // Ghost & Active Piece
    if (engine.activePiece && engine.status !== 'menu') {
      const piece = engine.activePiece;
      const ghostY = engine.getGhostY();
      const style = getPieceStyle(theme, piece.type, colorblind);

      if (ghostY !== null && ghostY > piece.y) {
        const ghostCells = getPieceCells({ ...piece, y: ghostY });
        ctx.save();
        for (const [gx, gy] of ghostCells) {
          const visY = gy - BUFFER_ROWS;
          if (visY < -1) continue;
          const rx = gx * cell + 1.5;
          const ry = topOffset + visY * cell + 1.5;
          const rs = cell - 3;

          ctx.globalAlpha = theme.ghostFillAlpha;
          ctx.fillStyle = style.base;
          ctx.beginPath();
          ctx.roundRect(rx, ry, rs, rs, theme.pixelArt ? 0 : 3);
          ctx.fill();

          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = style.base;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      const activeCells = getPieceCells(piece);
      const snapshot = engine.getHudSnapshot();
      const lockPulse = snapshot.isGrounded ? snapshot.lockProgress : 0;

      for (const [ax, ay] of activeCells) {
        const visY = ay - BUFFER_ROWS;
        if (visY < -1.5) continue;
        drawBlock(
          ctx,
          ax * cell,
          topOffset + visY * cell,
          cell,
          piece.type,
          theme,
          colorblind,
          1,
          lockPulse
        );
      }
    }

    // Foreground flashes & physics particles
    effects.renderForeground(ctx, cell, this.cssWidth, topOffset, themeId);

    ctx.restore(); // end shake translate

    // Retro CRT Scanline filter
    if (theme.scanlines) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      for (let sy = 0; sy < this.cssHeight; sy += 4) {
        ctx.fillRect(0, sy, this.cssWidth, 1.5);
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

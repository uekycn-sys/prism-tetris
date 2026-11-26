import { useEffect, useRef } from 'react';
import { ROTATION_MATRICES } from '../engine/constants';
import type { PieceType, ThemeId } from '../types/game';
import { drawBlock } from './CanvasRenderer';
import { THEMES } from './themes';

interface MiniPieceCanvasProps {
  piece: PieceType | null;
  themeId: ThemeId;
  colorblind: boolean;
  dimmed?: boolean;
  size?: number;
  cellSize?: number;
}

export function MiniPieceCanvas({
  piece,
  themeId,
  colorblind,
  dimmed = false,
  size = 68,
  cellSize = 15,
}: MiniPieceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const width = size;
    const height = Math.round(size * 0.66);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!piece) return;

    const cells = ROTATION_MATRICES[piece][0];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const [cx, cy] of cells) {
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
    }

    const pieceW = (maxX - minX + 1) * cellSize;
    const pieceH = (maxY - minY + 1) * cellSize;
    const startX = (width - pieceW) / 2 - minX * cellSize;
    const startY = (height - pieceH) / 2 - minY * cellSize;
    const theme = THEMES[themeId];
    const alpha = dimmed ? 0.32 : 1;

    for (const [cx, cy] of cells) {
      drawBlock(
        ctx,
        startX + cx * cellSize,
        startY + cy * cellSize,
        cellSize,
        piece,
        theme,
        colorblind,
        alpha,
        0
      );
    }
  }, [piece, themeId, colorblind, dimmed, size, cellSize]);

  return <canvas ref={canvasRef} className="block" aria-hidden="true" />;
}

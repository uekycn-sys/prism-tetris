import type { PieceType, ThemeId } from '../types/game';

export interface PieceStyle {
  base: string;
  light: string;
  dark: string;
  glow: string;
}

export interface ThemePalette {
  id: ThemeId;
  name: string;
  subtitle: string;
  boardBgTop: string;
  boardBgBottom: string;
  gridLine: string;
  bufferDivider: string;
  ghostStroke: string;
  ghostFillAlpha: number;
  flashColor: string;
  particleGlow: boolean;
  scanlines: boolean;
  pixelArt: boolean;
  stardustColor: string | null;
  pieces: Record<PieceType, PieceStyle>;
}

export const THEMES: Record<ThemeId, ThemePalette> = {
  'neon-prism': {
    id: 'neon-prism',
    name: '深空霓虹',
    subtitle: '深空棱镜',
    boardBgTop: '#070b18',
    boardBgBottom: '#0b1226',
    gridLine: 'rgba(148, 163, 184, 0.085)',
    bufferDivider: 'rgba(56, 189, 248, 0.35)',
    ghostStroke: 'rgba(255, 255, 255, 0.45)',
    ghostFillAlpha: 0.14,
    flashColor: '#ffffff',
    particleGlow: true,
    scanlines: false,
    pixelArt: false,
    stardustColor: 'rgba(148, 197, 255, 0.32)',
    pieces: {
      I: { base: '#22d3ee', light: '#a5f3fc', dark: '#0891b2', glow: 'rgba(34, 211, 238, 0.55)' },
      O: { base: '#facc15', light: '#fef08a', dark: '#ca8a04', glow: 'rgba(250, 204, 21, 0.52)' },
      T: { base: '#c084fc', light: '#e9d5ff', dark: '#9333ea', glow: 'rgba(192, 132, 252, 0.55)' },
      S: { base: '#34d399', light: '#a7f3d0', dark: '#059669', glow: 'rgba(52, 211, 153, 0.52)' },
      Z: { base: '#fb7185', light: '#fecdd3', dark: '#e11d48', glow: 'rgba(251, 113, 133, 0.55)' },
      J: { base: '#60a5fa', light: '#bfdbfe', dark: '#2563eb', glow: 'rgba(96, 165, 250, 0.52)' },
      L: { base: '#fb923c', light: '#fed7aa', dark: '#ea580c', glow: 'rgba(251, 146, 60, 0.52)' },
    },
  },
  'zen-frost': {
    id: 'zen-frost',
    name: '极简磨砂',
    subtitle: '白昼极简',
    boardBgTop: '#f8fafc',
    boardBgBottom: '#edf2f7',
    gridLine: 'rgba(15, 23, 42, 0.065)',
    bufferDivider: 'rgba(79, 70, 229, 0.28)',
    ghostStroke: 'rgba(15, 23, 42, 0.32)',
    ghostFillAlpha: 0.14,
    flashColor: '#ffffff',
    particleGlow: false,
    scanlines: false,
    pixelArt: false,
    stardustColor: 'rgba(99, 102, 241, 0.12)',
    pieces: {
      I: { base: '#0ea5e9', light: '#bae6fd', dark: '#0369a1', glow: 'rgba(14, 165, 233, 0.2)' },
      O: { base: '#eab308', light: '#fef08a', dark: '#a16207', glow: 'rgba(234, 179, 8, 0.2)' },
      T: { base: '#8b5cf6', light: '#ddd6fe', dark: '#6d28d9', glow: 'rgba(139, 92, 246, 0.2)' },
      S: { base: '#10b981', light: '#a7f3d0', dark: '#047857', glow: 'rgba(16, 185, 129, 0.2)' },
      Z: { base: '#f43f5e', light: '#fecdd3', dark: '#be123c', glow: 'rgba(244, 63, 94, 0.2)' },
      J: { base: '#3b82f6', light: '#bfdbfe', dark: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.2)' },
      L: { base: '#f97316', light: '#fed7aa', dark: '#c2410c', glow: 'rgba(249, 115, 22, 0.2)' },
    },
  },
  'retro-phosphor': {
    id: 'retro-phosphor',
    name: '复古掌机',
    subtitle: 'CRT 荧光',
    boardBgTop: '#040a05',
    boardBgBottom: '#08130a',
    gridLine: 'rgba(74, 222, 128, 0.1)',
    bufferDivider: 'rgba(74, 222, 128, 0.45)',
    ghostStroke: 'rgba(134, 239, 172, 0.55)',
    ghostFillAlpha: 0.12,
    flashColor: '#dcfce7',
    particleGlow: true,
    scanlines: true,
    pixelArt: true,
    stardustColor: null,
    pieces: {
      I: { base: '#4ade80', light: '#bbf7d0', dark: '#166534', glow: 'rgba(74, 222, 128, 0.4)' },
      O: { base: '#a3e635', light: '#ecfccb', dark: '#3f6212', glow: 'rgba(163, 230, 53, 0.4)' },
      T: { base: '#2dd4bf', light: '#ccfbf1', dark: '#115e59', glow: 'rgba(45, 212, 191, 0.4)' },
      S: { base: '#86efac', light: '#dcfce7', dark: '#15803d', glow: 'rgba(134, 239, 172, 0.4)' },
      Z: { base: '#34d399', light: '#a7f3d0', dark: '#065f46', glow: 'rgba(52, 211, 153, 0.4)' },
      J: { base: '#22c55e', light: '#bbf7d0', dark: '#14532d', glow: 'rgba(34, 197, 94, 0.4)' },
      L: { base: '#bef264', light: '#f7fee7', dark: '#4d7c0f', glow: 'rgba(190, 242, 100, 0.4)' },
    },
  },
};

export const THEME_ORDER: ThemeId[] = ['neon-prism', 'zen-frost', 'retro-phosphor'];

/**
 * Okabe-Ito inspired high-contrast colorblind-safe palette.
 */
export const COLORBLIND_PIECES: Record<PieceType, PieceStyle> = {
  I: { base: '#56B4E9', light: '#bae6fd', dark: '#0284c7', glow: 'rgba(86, 180, 233, 0.5)' },
  O: { base: '#F0E442', light: '#fef9c3', dark: '#ca8a04', glow: 'rgba(240, 228, 66, 0.5)' },
  T: { base: '#CC79A7', light: '#fbcfe8', dark: '#9d174d', glow: 'rgba(204, 121, 167, 0.5)' },
  S: { base: '#009E73', light: '#99f6e4', dark: '#065f46', glow: 'rgba(0, 158, 115, 0.5)' },
  Z: { base: '#D55E00', light: '#fed7aa', dark: '#9a3412', glow: 'rgba(213, 94, 0, 0.5)' },
  J: { base: '#0072B2', light: '#93c5fd', dark: '#1e3a8a', glow: 'rgba(0, 114, 178, 0.5)' },
  L: { base: '#E69F00', light: '#fde68a', dark: '#b45309', glow: 'rgba(230, 159, 0, 0.5)' },
};

export function getPieceStyle(theme: ThemePalette, type: PieceType, colorblind: boolean): PieceStyle {
  return colorblind ? COLORBLIND_PIECES[type] : theme.pieces[type];
}

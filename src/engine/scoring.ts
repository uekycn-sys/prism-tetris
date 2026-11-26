import type { TSpinType } from '../types/game';

export interface ScoreCalcInput {
  lines: number;
  tSpin: TSpinType;
  level: number;
  b2bActive: boolean;
  combo: number;
  isAllClear: boolean;
}

export interface ScoreCalcResult {
  points: number;
  nextB2B: boolean;
  isB2BTriggered: boolean;
  nextCombo: number;
  callouts: string[];
}

/**
 * Computes Tetris Guideline action score including T-Spins, Back-to-Back (1.5x),
 * Combo scaling, and All Clear bonuses.
 */
export function calculateClearScore(input: ScoreCalcInput): ScoreCalcResult {
  const { lines, tSpin, level, b2bActive, combo, isAllClear } = input;
  const callouts: string[] = [];

  if (lines === 0) {
    let base = 0;
    if (tSpin === 'mini') {
      base = 100 * level;
      callouts.push('MINI T-SPIN');
    } else if (tSpin === 'full') {
      base = 400 * level;
      callouts.push('T-SPIN');
    }

    return {
      points: base,
      nextB2B: b2bActive, // 0-line T-Spins preserve active B2B state
      isB2BTriggered: false,
      nextCombo: -1,
      callouts,
    };
  }

  let basePoints = 0;
  let isDifficult = false;

  if (tSpin === 'full') {
    isDifficult = true;
    switch (lines) {
      case 1:
        basePoints = 800;
        callouts.push('T-SPIN SINGLE');
        break;
      case 2:
        basePoints = 1200;
        callouts.push('T-SPIN DOUBLE');
        break;
      case 3:
      default:
        basePoints = 1600;
        callouts.push('T-SPIN TRIPLE');
        break;
    }
  } else if (tSpin === 'mini') {
    isDifficult = true;
    switch (lines) {
      case 1:
        basePoints = 200;
        callouts.push('MINI T-SPIN SINGLE');
        break;
      case 2:
      default:
        basePoints = 400;
        callouts.push('MINI T-SPIN DOUBLE');
        break;
    }
  } else {
    switch (lines) {
      case 1:
        basePoints = 100;
        break;
      case 2:
        basePoints = 300;
        break;
      case 3:
        basePoints = 500;
        break;
      case 4:
      default:
        basePoints = 800;
        isDifficult = true;
        callouts.push('TETRIS');
        break;
    }
  }

  let total = basePoints * level;
  const isB2BTriggered = isDifficult && b2bActive;
  if (isB2BTriggered) {
    total = Math.round(total * 1.5);
    callouts.push('BACK-TO-BACK');
  }

  const nextCombo = combo + 1;
  if (nextCombo > 0) {
    total += 50 * nextCombo * level;
    callouts.push(`COMBO x${nextCombo}`);
  }

  if (isAllClear) {
    let acBase = 0;
    if (lines === 4 && b2bActive) {
      acBase = 3200;
    } else if (lines === 1) {
      acBase = 800;
    } else if (lines === 2) {
      acBase = 1200;
    } else if (lines === 3) {
      acBase = 1800;
    } else {
      acBase = 2000;
    }
    total += acBase * level;
    callouts.push('ALL CLEAR');
  }

  return {
    points: total,
    nextB2B: isDifficult,
    isB2BTriggered,
    nextCombo,
    callouts,
  };
}

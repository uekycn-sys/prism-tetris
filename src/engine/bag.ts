import type { PieceType } from '../types/game';
import { ALL_PIECE_TYPES } from './constants';

/**
 * 7-Bag Randomizer ensuring every 7-piece sequence contains all 7 tetrominoes.
 */
export class BagRandomizer {
  private queue: PieceType[] = [];
  private readonly rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
  }

  private refillBag(): void {
    const bag: PieceType[] = [...ALL_PIECE_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const tmp = bag[i];
      bag[i] = bag[j];
      bag[j] = tmp;
    }
    this.queue.push(...bag);
  }

  private ensureCount(count: number): void {
    while (this.queue.length < count) {
      this.refillBag();
    }
  }

  next(): PieceType {
    this.ensureCount(1);
    return this.queue.shift()!;
  }

  peek(count: number): PieceType[] {
    this.ensureCount(count);
    return this.queue.slice(0, count);
  }

  reset(): void {
    this.queue = [];
  }
}

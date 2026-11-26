import type { HandlingSettings } from '../types/game';

export interface InputCallbacks {
  onMoveLeft: () => boolean;
  onMoveRight: () => boolean;
  onMoveToWall: (dx: -1 | 1) => boolean;
  onSoftDropStep: () => boolean;
  onSoftDropToFloor: () => boolean;
}

/**
 * Handles DAS (Delayed Auto Shift), ARR (Auto Repeat Rate), and SDF (Soft Drop Factor)
 * independently of display refresh rate (60Hz / 120Hz / 144Hz+).
 */
export class InputController {
  private leftHeld = false;
  private rightHeld = false;
  private softDropHeld = false;
  private priorityDir: -1 | 1 | null = null;

  private dasTimerMs = 0;
  private dasTriggered = false;
  private arrTimerMs = 0;
  private softDropTimerMs = 0;

  private handling: HandlingSettings;
  private readonly callbacks: InputCallbacks;

  constructor(handling: HandlingSettings, callbacks: InputCallbacks) {
    this.handling = { ...handling };
    this.callbacks = callbacks;
  }

  setHandling(handling: HandlingSettings): void {
    this.handling = { ...handling };
  }

  reset(): void {
    this.leftHeld = false;
    this.rightHeld = false;
    this.softDropHeld = false;
    this.priorityDir = null;
    this.dasTimerMs = 0;
    this.dasTriggered = false;
    this.arrTimerMs = 0;
    this.softDropTimerMs = 0;
  }

  pressLeft(): void {
    if (this.leftHeld) return;
    this.leftHeld = true;
    this.priorityDir = -1;
    this.dasTimerMs = 0;
    this.dasTriggered = false;
    this.arrTimerMs = 0;
    this.callbacks.onMoveLeft();
  }

  releaseLeft(): void {
    this.leftHeld = false;
    if (this.rightHeld) {
      this.priorityDir = 1;
      this.dasTimerMs = 0;
      this.dasTriggered = false;
      this.arrTimerMs = 0;
    } else {
      this.priorityDir = null;
    }
  }

  pressRight(): void {
    if (this.rightHeld) return;
    this.rightHeld = true;
    this.priorityDir = 1;
    this.dasTimerMs = 0;
    this.dasTriggered = false;
    this.arrTimerMs = 0;
    this.callbacks.onMoveRight();
  }

  releaseRight(): void {
    this.rightHeld = false;
    if (this.leftHeld) {
      this.priorityDir = -1;
      this.dasTimerMs = 0;
      this.dasTriggered = false;
      this.arrTimerMs = 0;
    } else {
      this.priorityDir = null;
    }
  }

  pressSoftDrop(): void {
    if (this.softDropHeld) return;
    this.softDropHeld = true;
    this.softDropTimerMs = 0;
    if (this.handling.sdf === 0) {
      this.callbacks.onSoftDropToFloor();
    } else {
      this.callbacks.onSoftDropStep();
    }
  }

  releaseSoftDrop(): void {
    this.softDropHeld = false;
    this.softDropTimerMs = 0;
  }

  isSoftDropping(): boolean {
    return this.softDropHeld;
  }

  update(dtMs: number, currentGravityMs: number): void {
    // Horizontal DAS / ARR
    if (this.priorityDir !== null) {
      const dir = this.priorityDir;
      const stepFn = dir === -1 ? this.callbacks.onMoveLeft : this.callbacks.onMoveRight;

      if (!this.dasTriggered) {
        this.dasTimerMs += dtMs;
        if (this.dasTimerMs >= this.handling.das) {
          this.dasTriggered = true;
          const overflow = this.dasTimerMs - this.handling.das;
          if (this.handling.arr === 0) {
            this.callbacks.onMoveToWall(dir);
          } else {
            stepFn();
            this.arrTimerMs = overflow;
          }
        }
      } else {
        if (this.handling.arr === 0) {
          this.callbacks.onMoveToWall(dir);
        } else {
          this.arrTimerMs += dtMs;
          let safety = 0;
          while (this.arrTimerMs >= this.handling.arr && safety < 16) {
            this.arrTimerMs -= this.handling.arr;
            if (!stepFn()) {
              this.arrTimerMs = 0;
              break;
            }
            safety++;
          }
        }
      }
    }

    // Soft drop
    if (this.softDropHeld) {
      if (this.handling.sdf === 0) {
        this.callbacks.onSoftDropToFloor();
      } else {
        const effectiveInterval = Math.max(4, currentGravityMs / Math.max(1, this.handling.sdf));
        this.softDropTimerMs += dtMs;
        let safety = 0;
        while (this.softDropTimerMs >= effectiveInterval && safety < 24) {
          this.softDropTimerMs -= effectiveInterval;
          if (!this.callbacks.onSoftDropStep()) {
            this.softDropTimerMs = 0;
            break;
          }
          safety++;
        }
      }
    }
  }
}

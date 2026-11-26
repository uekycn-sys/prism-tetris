import type { ClearedCell, PieceType, ThemeId } from '../types/game';
import { getPieceStyle, THEMES } from './themes';

interface Particle {
  x: number; // grid x (0..10)
  y: number; // visible grid y (0..20)
  vx: number; // cells/sec
  vy: number; // cells/sec
  size: number; // fraction of cell
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  color: string;
}

interface HardDropTrail {
  col: number;
  fromVisibleY: number;
  toVisibleY: number;
  color: string;
  life: number;
  maxLife: number;
}

interface LineFlash {
  visibleY: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Stardust {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  speed: number;
  radius: number;
  alpha: number;
}

export class EffectsManager {
  private particles: Particle[] = [];
  private trails: HardDropTrail[] = [];
  private flashes: LineFlash[] = [];
  private stardust: Stardust[] = [];

  public shakeX = 0;
  public shakeY = 0;
  private shakeIntensity = 0;
  private bumpOffset = 0;
  private bumpVelocity = 0;
  private pulseEnergy = 0;

  constructor() {
    for (let i = 0; i < 36; i++) {
      this.stardust.push({
        x: Math.random(),
        y: Math.random(),
        speed: 0.012 + Math.random() * 0.028,
        radius: 0.7 + Math.random() * 1.4,
        alpha: 0.25 + Math.random() * 0.65,
      });
    }
  }

  clear(): void {
    this.particles = [];
    this.trails = [];
    this.flashes = [];
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.bumpOffset = 0;
    this.bumpVelocity = 0;
    this.pulseEnergy = 0;
  }

  spawnHardDrop(
    cells: [number, number][],
    fromY: number,
    toY: number,
    pieceType: PieceType,
    themeId: ThemeId,
    colorblind: boolean,
    bufferRows: number,
    enableShake: boolean
  ): void {
    const theme = THEMES[themeId];
    const style = getPieceStyle(theme, pieceType, colorblind);
    const deltaY = toY - fromY;

    if (deltaY > 0) {
      // Group cells by column so each column gets one clean vertical light beam
      const colBottom = new Map<number, number>();
      for (const [cx, cy] of cells) {
        const prev = colBottom.get(cx);
        if (prev === undefined || cy > prev) {
          colBottom.set(cx, cy);
        }
      }
      colBottom.forEach((bottomY, col) => {
        const visibleTo = bottomY - bufferRows + 1;
        const visibleFrom = Math.max(0, visibleTo - deltaY);
        if (visibleTo > 0) {
          this.trails.push({
            col,
            fromVisibleY: visibleFrom,
            toVisibleY: visibleTo,
            color: style.base,
            life: 0.19,
            maxLife: 0.19,
          });
        }
      });
    }

    if (enableShake) {
      this.bumpVelocity = Math.min(26, this.bumpVelocity + 16);
      this.shakeIntensity = Math.max(this.shakeIntensity, 1.8);
    }
  }

  spawnLineClear(
    rows: number[],
    clearedCells: ClearedCell[],
    lines: number,
    isSpecial: boolean,
    themeId: ThemeId,
    colorblind: boolean,
    bufferRows: number,
    enableShake: boolean
  ): void {
    const theme = THEMES[themeId];

    for (const row of rows) {
      const visibleY = row - bufferRows;
      if (visibleY >= 0) {
        this.flashes.push({
          visibleY,
          life: 0.22,
          maxLife: 0.22,
          color: theme.flashColor,
        });
      }
    }

    // Spawn 4-6 particles per cleared cell (capped for smooth 144Hz performance)
    const perCell = lines >= 4 || isSpecial ? 6 : 4;
    for (const cell of clearedCells) {
      const visibleY = cell.y - bufferRows;
      if (visibleY < 0) continue;
      const style = getPieceStyle(theme, cell.type, colorblind);
      for (let i = 0; i < perCell; i++) {
        if (this.particles.length >= 260) break;
        const angle = (Math.random() - 0.5) * Math.PI * 1.4 - Math.PI * 0.5;
        const speed = 2.8 + Math.random() * (lines >= 4 || isSpecial ? 9.5 : 6.5);
        this.particles.push({
          x: cell.x + 0.2 + Math.random() * 0.6,
          y: visibleY + 0.2 + Math.random() * 0.6,
          vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1),
          vy: Math.sin(angle) * speed - Math.random() * 2.5,
          size: 0.14 + Math.random() * 0.18,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 12,
          life: 0.38 + Math.random() * 0.34,
          maxLife: 0.72,
          color: i % 3 === 0 ? style.light : style.base,
        });
      }
    }

    this.pulseEnergy = Math.min(1, this.pulseEnergy + (lines >= 4 || isSpecial ? 0.9 : 0.45));

    if (enableShake) {
      const shakePower = lines >= 4 || isSpecial ? 5.2 : 2.2 + lines * 0.6;
      this.shakeIntensity = Math.max(this.shakeIntensity, shakePower);
      this.bumpVelocity += lines * 6;
    }
  }

  update(dtMs: number): void {
    const dt = Math.min(0.05, dtMs / 1000);

    // Update stardust drift
    const speedBoost = 1 + this.pulseEnergy * 2.5;
    for (let i = 0; i < this.stardust.length; i++) {
      const s = this.stardust[i];
      s.y -= s.speed * speedBoost * dt;
      if (s.y < -0.02) {
        s.y = 1.02;
        s.x = Math.random();
      }
    }
    this.pulseEnergy = Math.max(0, this.pulseEnergy - dt * 1.8);

    // Update trails
    for (let i = this.trails.length - 1; i >= 0; i--) {
      this.trails[i].life -= dt;
      if (this.trails[i].life <= 0) {
        this.trails.splice(i, 1);
      }
    }

    // Update flashes
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      this.flashes[i].life -= dt;
      if (this.flashes[i].life <= 0) {
        this.flashes.splice(i, 1);
      }
    }

    // Update particles with gravity & air drag
    const gravity = 24;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vx *= Math.pow(0.25, dt);
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
    }

    // Elastic vertical bump spring
    const springK = 260;
    const damping = 18;
    const accel = -springK * this.bumpOffset - damping * this.bumpVelocity;
    this.bumpVelocity += accel * dt;
    this.bumpOffset += this.bumpVelocity * dt;
    if (Math.abs(this.bumpOffset) < 0.05 && Math.abs(this.bumpVelocity) < 0.2) {
      this.bumpOffset = 0;
      this.bumpVelocity = 0;
    }

    // Micro screen shake decay
    if (this.shakeIntensity > 0.08) {
      this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity + this.bumpOffset;
      this.shakeIntensity *= Math.pow(0.002, dt);
    } else {
      this.shakeIntensity = 0;
      this.shakeX = 0;
      this.shakeY = this.bumpOffset;
    }
  }

  renderBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    themeId: ThemeId
  ): void {
    const theme = THEMES[themeId];
    if (!theme.stardustColor) return;

    ctx.save();
    ctx.fillStyle = theme.stardustColor;
    for (let i = 0; i < this.stardust.length; i++) {
      const s = this.stardust[i];
      ctx.globalAlpha = s.alpha * (0.55 + this.pulseEnergy * 0.45);
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderBehindPieces(
    ctx: CanvasRenderingContext2D,
    cellSize: number,
    topOffset: number
  ): void {
    if (this.trails.length === 0) return;
    ctx.save();
    for (let i = 0; i < this.trails.length; i++) {
      const t = this.trails[i];
      const alpha = Math.max(0, t.life / t.maxLife);
      const x = t.col * cellSize;
      const y1 = topOffset + t.fromVisibleY * cellSize;
      const y2 = topOffset + t.toVisibleY * cellSize;

      const grad = ctx.createLinearGradient(0, y1, 0, y2);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.65, t.color);
      grad.addColorStop(1, '#ffffff');

      ctx.globalAlpha = alpha * 0.48;
      ctx.fillStyle = grad;
      ctx.fillRect(x + 2, y1, cellSize - 4, Math.max(0, y2 - y1));
    }
    ctx.restore();
  }

  renderForeground(
    ctx: CanvasRenderingContext2D,
    cellSize: number,
    boardWidth: number,
    topOffset: number,
    themeId: ThemeId
  ): void {
    const theme = THEMES[themeId];

    // Flashes
    if (this.flashes.length > 0) {
      ctx.save();
      for (let i = 0; i < this.flashes.length; i++) {
        const f = this.flashes[i];
        const progress = 1 - f.life / f.maxLife;
        const alpha = (1 - progress) * 0.85;
        const y = topOffset + f.visibleY * cellSize;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        ctx.fillRect(0, y, boardWidth, cellSize);

        // Sweeping beam highlight
        const beamX = progress * boardWidth;
        const grad = ctx.createLinearGradient(beamX - cellSize * 2, 0, beamX + cellSize * 2, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, boardWidth, cellSize);
      }
      ctx.restore();
    }

    // Particles
    if (this.particles.length > 0) {
      ctx.save();
      if (theme.particleGlow) {
        ctx.shadowBlur = 10;
      }
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const alpha = Math.max(0, Math.min(1, p.life / (p.maxLife * 0.65)));
        const px = p.x * cellSize;
        const py = topOffset + p.y * cellSize;
        const size = p.size * cellSize;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (theme.particleGlow) {
          ctx.shadowColor = p.color;
        }
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      }
      ctx.restore();
    }
  }
}

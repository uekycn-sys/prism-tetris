# PRISM TETRIS

A commercial-grade Web Tetris built with **Vite + React + TypeScript + Tailwind CSS + HTML5 Canvas 2D + Web Audio API**. Engineered around the **Tetris Guideline** specification with a pure TypeScript physics/state engine, high-DPI Canvas rendering pipeline, zero-asset procedural sound synthesis, and responsive desktop/mobile controls.

## Highlights

- **Tetris Guideline Core Engine (`src/engine/`)**
  - **10 × 20 Playfield + 4-Row Buffer Zone** with frame-rate-independent delta-time simulation (consistent across 60Hz, 120Hz, and 144Hz displays).
  - **7-Bag Randomizer** preventing long piece droughts.
  - **Complete SRS (Super Rotation System)** with authentic JLSTZ & I wall-kick tables plus 180° SRS+ kicks.
  - **3-Corner T-Spin Detection** distinguishing Full vs. Mini T-Spin and awarding T-Spin Single / Double / Triple.
  - **500ms Lock Delay** with up to 15 move/rotate resets.
  - **Full Scoring**: Single / Double / Triple / Tetris, T-Spins, Back-to-Back (1.5×), Combo scaling, Soft/Hard Drop points, and All Clear bonuses.
  - **4 Game Modes**: **Marathon** (Levels 1–20), **40-Line Sprint** (ms timer & live PPS), **Ultra 2m** (120s score attack), and **Zen** (endless practice with automatic bottom-row refresh).

- **Visuals & Game Juice (`src/renderer/`)**
  - High-DPI (`devicePixelRatio`) Canvas 2D renderer with **3 live-switchable themes**: **Neon Prism**, **Zen Frost**, and **Retro Phosphor**.
  - **Colorblind High-Contrast Mode** with Okabe-Ito palette and geometric piece symbols.
  - Hard-drop light beams, line-clear flash sweeps, gravity-driven physics particles, elastic drop bounce, micro screen-shake, and animated callout badges.

- **Procedural Web Audio (`src/audio/SoundEngine.ts`)**
  - Zero external `.mp3`/`.wav` dependencies.
  - Pentatonic ascending line-clear & combo chimes, harmonic chords for Tetris/T-Spin/All Clear, sub-bass hard-drop impacts, and an optional level-reactive ambient synth groove.

- **Pro Handling & Persistence (`src/storage/persistence.ts`)**
  - Tunable **DAS** (50–250ms, default `133ms`), **ARR** (0–50ms, default `16ms`, `0ms` = instant), and **SDF** (`5x–40x` + `∞ Instant`, default `20x`).
  - Interactive key rebinding + 1-click **Guideline** and **WASD Dual** presets, plus ergonomic mobile touch controls.
  - Top 5 local leaderboards per mode & user settings persisted in `localStorage`.

## Default Controls

| Action | Guideline Preset | WASD Dual Preset |
| :--- | :--- | :--- |
| Move Left / Right | `←` / `→` | `←` `A` / `→` `D` |
| Soft Drop | `↓` | `↓` `S` |
| Hard Drop | `Space` | `Space` |
| Rotate CW | `↑` / `X` | `↑` `W` `X` |
| Rotate CCW | `Z` / `Ctrl` | `Z` `Q` `Ctrl` |
| Rotate 180° | `A` | `E` |
| Hold | `C` / `Shift` | `C` / `Shift` |
| Pause / Restart | `P` / `Esc` · `R` | `P` / `Esc` · `R` |

## Local Development

```bash
npm install
npm run dev
```

Run unit tests and typecheck:

```bash
npm run typecheck
npm test
```

Build for production & preview locally:

```bash
npm run build
npm run preview
```

## GitHub Pages Deployment

The repository includes `.github/workflows/deploy.yml` configured with `base: './'` in `vite.config.ts` so all bundled assets resolve cleanly on subpath URLs (`https://<user>.github.io/<repo>/`).

1. Push to the `main` branch.
2. In your GitHub repository, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. The workflow automatically runs tests, builds `dist/`, and deploys to GitHub Pages.

import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundEngine } from './audio/SoundEngine';
import { GameLayout } from './components/GameLayout';
import { GameOverModal } from './components/GameOverModal';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { TouchControls } from './components/TouchControls';
import { BUFFER_ROWS } from './engine/constants';
import { InputController } from './engine/input';
import { TetrisEngine } from './engine/TetrisEngine';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { EffectsManager } from './renderer/particles';
import { THEME_ORDER } from './renderer/themes';
import {
  loadLeaderboards,
  loadSettings,
  recordLeaderboardEntry,
  saveSettings,
  type LeaderboardMap,
} from './storage/persistence';
import type {
  ActionName,
  CalloutBadge,
  GameMode,
  HudSnapshot,
  Settings,
  ThemeId,
} from './types/game';

const CALLOUT_ZH: Record<string, string> = {
  'MINI T-SPIN': '迷你 T-SPIN',
  'T-SPIN': 'T-SPIN',
  'T-SPIN SINGLE': 'T-SPIN 单消',
  'T-SPIN DOUBLE': 'T-SPIN 双消',
  'T-SPIN TRIPLE': 'T-SPIN 三消',
  'MINI T-SPIN SINGLE': '迷你 T-SPIN 单消',
  'MINI T-SPIN DOUBLE': '迷你 T-SPIN 双消',
  TETRIS: 'TETRIS 四消',
  'BACK-TO-BACK': 'B2B 连击',
  'ALL CLEAR': '全消 ALL CLEAR',
};

function translateCallout(label: string): string {
  if (CALLOUT_ZH[label]) return CALLOUT_ZH[label];
  if (label.startsWith('COMBO x')) return `连消 x${label.slice(7)}`;
  return label;
}

export function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [leaderboards, setLeaderboards] = useState<LeaderboardMap>(() => loadLeaderboards());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [callouts, setCallouts] = useState<CalloutBadge[]>([]);
  const [isNewBest, setIsNewBest] = useState(false);

  const engineRef = useRef<TetrisEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new TetrisEngine();
  }
  const [hud, setHud] = useState<HudSnapshot>(() => engineRef.current!.getHudSnapshot());

  const soundRef = useRef<SoundEngine | null>(null);
  if (!soundRef.current) {
    soundRef.current = new SoundEngine();
  }

  const effectsRef = useRef<EffectsManager | null>(null);
  if (!effectsRef.current) {
    effectsRef.current = new EffectsManager();
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const inputRef = useRef<InputController | null>(null);
  const settingsRef = useRef<Settings>(settings);
  const settingsOpenRef = useRef(settingsOpen);
  const calloutSeqRef = useRef(1);
  const lastTouchHardDropAtRef = useRef(0);

  settingsRef.current = settings;
  settingsOpenRef.current = settingsOpen;

  // Apply theme to root document and persist settings
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    const themeColorMap: Record<ThemeId, string> = {
      'neon-prism': '#060913',
      'zen-frost': '#eef1f5',
      'retro-phosphor': '#050b06',
    };
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeColorMap[settings.theme]);
    saveSettings(settings);
    soundRef.current?.configure({
      sfxVolume: settings.sfxVolume,
      bgmVolume: settings.bgmVolume,
      muted: settings.muted,
    });
    inputRef.current?.setHandling(settings.handling);
  }, [settings]);

  const pushCallout = useCallback((label: string, sublabel?: string, tone: CalloutBadge['tone'] = 'accent') => {
    const id = calloutSeqRef.current++;
    setCallouts((prev) => [...prev.slice(-2), { id, label, sublabel, tone }]);
    window.setTimeout(() => {
      setCallouts((prev) => prev.filter((item) => item.id !== id));
    }, 1550);
  }, []);

  // Initialize InputController & Engine event listeners
  useEffect(() => {
    const engine = engineRef.current!;
    const sound = soundRef.current!;
    const effects = effectsRef.current!;

    inputRef.current = new InputController(settingsRef.current.handling, {
      onMoveLeft: () => engine.move(-1),
      onMoveRight: () => engine.move(1),
      onMoveToWall: (dx) => engine.moveToWall(dx),
      onSoftDropStep: () => engine.softDropStep(),
      onSoftDropToFloor: () => engine.softDropToFloor(),
    });

    const unsub = engine.onEvent((ev) => {
      const curSettings = settingsRef.current;
      switch (ev.type) {
        case 'move':
          sound.playMove();
          break;
        case 'rotate':
          sound.playRotate(ev.tSpin !== 'none');
          break;
        case 'softDrop':
          sound.playSoftDrop();
          break;
        case 'hardDrop':
          sound.playHardDrop();
          effects.spawnHardDrop(
            ev.cells,
            ev.fromY,
            ev.toY,
            ev.pieceType,
            curSettings.theme,
            curSettings.colorblind,
            BUFFER_ROWS,
            curSettings.screenShake
          );
          break;
        case 'hold':
          sound.playHold();
          break;
        case 'lock':
          sound.playLock();
          break;
        case 'lineClear': {
          if (ev.lines > 0) {
            sound.playLineClear(ev.lines, ev.combo, ev.tSpin, ev.isB2B);
            effects.spawnLineClear(
              ev.rows,
              ev.clearedCells,
              ev.lines,
              ev.tSpin !== 'none' || ev.isB2B,
              curSettings.theme,
              curSettings.colorblind,
              BUFFER_ROWS,
              curSettings.screenShake
            );
          }
          if (ev.isAllClear) {
            sound.playAllClear();
          }
          ev.callouts.forEach((label, idx) => {
            const tone: CalloutBadge['tone'] = label.includes('ALL CLEAR')
              ? 'emerald'
              : label.includes('T-SPIN') || label.includes('BACK-TO-BACK')
                ? 'violet'
                : label.includes('COMBO')
                  ? 'gold'
                  : 'accent';
            pushCallout(
              translateCallout(label),
              idx === 0 && ev.points > 0 ? `+${ev.points}` : undefined,
              tone
            );
          });
          break;
        }
        case 'levelUp':
          sound.setLevel(ev.level);
          sound.playLevelUp();
          pushCallout(`等级 ${ev.level}`, undefined, 'accent');
          break;
        case 'zenClear':
          pushCallout('禅意清底', `-${ev.clearedRows} 行`, 'emerald');
          break;
        case 'gameOver':
        case 'victory': {
          sound.stopAmbient();
          if (ev.type === 'victory') {
            sound.playVictory();
          } else {
            sound.playGameOver();
          }
          inputRef.current?.reset();

          const snap = engine.getHudSnapshot();
          if (snap.piecesPlaced > 0 || snap.lines > 0 || snap.score > 0) {
            const res = recordLeaderboardEntry({
              mode: snap.mode,
              score: snap.score,
              lines: snap.lines,
              elapsedMs: snap.elapsedMs,
              pps: snap.pps,
              maxCombo: snap.maxCombo,
              tSpins: snap.tSpins,
            });
            setLeaderboards(res.map);
            setIsNewBest(res.isNewBest);
          }
          break;
        }
      }
    });

    return () => {
      unsub();
      sound.stopAmbient();
    };
  }, [pushCallout]);

  // Initialize CanvasRenderer when playing board mounts
  useEffect(() => {
    if (hud.status === 'menu') {
      rendererRef.current = null;
      return;
    }
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
    }
  }, [hud.status]);

  const handleResizeBoard = useCallback((cellSize: number) => {
    if (!canvasRef.current) return;
    if (!rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
    }
    rendererRef.current.resize(cellSize);
  }, []);

  // Main 60/120/144Hz Delta-Time Simulation & Render Loop
  useEffect(() => {
    if (hud.status === 'menu') return;

    let rafId = 0;
    let lastTime = performance.now();
    let hudTickAccum = 0;

    const frame = (now: number) => {
      const rawDt = now - lastTime;
      lastTime = now;
      const dt = Math.max(0, Math.min(rawDt, 50));

      const engine = engineRef.current!;
      const effects = effectsRef.current!;

      if (engine.status === 'playing' && !settingsOpenRef.current) {
        inputRef.current?.update(dt, engine.getCurrentGravityMs());
        engine.update(dt);
      }

      effects.update(dt);

      if (rendererRef.current) {
        rendererRef.current.render(
          engine,
          effects,
          settingsRef.current.theme,
          settingsRef.current.colorblind,
          settingsRef.current.showGhostPiece
        );
      }

      hudTickAccum += dt;
      const snap = engine.getHudSnapshot();
      if (hudTickAccum >= 45 || snap.status !== hud.status) {
        hudTickAccum = 0;
        setHud(snap);
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [hud.status]);

  const startMode = useCallback((mode: GameMode) => {
    soundRef.current?.unlock();
    effectsRef.current?.clear();
    inputRef.current?.reset();
    setCallouts([]);
    setIsNewBest(false);

    const engine = engineRef.current!;
    engine.start(mode);
    soundRef.current?.setLevel(1);
    soundRef.current?.startAmbient();
    setHud(engine.getHudSnapshot());
  }, []);

  const restartCurrent = useCallback(() => {
    soundRef.current?.unlock();
    effectsRef.current?.clear();
    inputRef.current?.reset();
    setCallouts([]);
    setIsNewBest(false);

    const engine = engineRef.current!;
    engine.restart();
    soundRef.current?.setLevel(1);
    soundRef.current?.startAmbient();
    setHud(engine.getHudSnapshot());
  }, []);

  const pauseGame = useCallback(() => {
    const engine = engineRef.current!;
    if (engine.status === 'playing') {
      engine.pause();
      inputRef.current?.reset();
      soundRef.current?.stopAmbient();
      setHud(engine.getHudSnapshot());
    }
  }, []);

  const resumeGame = useCallback(() => {
    const engine = engineRef.current!;
    if (engine.status === 'paused') {
      engine.resume();
      soundRef.current?.unlock();
      soundRef.current?.startAmbient();
      setHud(engine.getHudSnapshot());
    }
  }, []);

  const returnToMenu = useCallback(() => {
    const engine = engineRef.current!;
    engine.returnToMenu();
    inputRef.current?.reset();
    effectsRef.current?.clear();
    soundRef.current?.stopAmbient();
    setCallouts([]);
    setHud(engine.getHudSnapshot());
  }, []);

  const cycleTheme = useCallback(() => {
    setSettings((prev) => {
      const idx = THEME_ORDER.indexOf(prev.theme);
      const nextTheme = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
      return { ...prev, theme: nextTheme };
    });
  }, []);

  const selectTheme = useCallback((theme: ThemeId) => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const toggleMute = useCallback(() => {
    soundRef.current?.unlock();
    setSettings((prev) => ({ ...prev, muted: !prev.muted }));
  }, []);

  const toggleGhostPiece = useCallback(() => {
    setSettings((prev) => ({ ...prev, showGhostPiece: !prev.showGhostPiece }));
  }, []);

  const handleTouchHardDrop = useCallback(() => {
    const now = performance.now();
    if (now - lastTouchHardDropAtRef.current < 115) return;
    lastTouchHardDropAtRef.current = now;
    soundRef.current?.unlock();
    const engine = engineRef.current;
    if (!engine) return;
    engine.hardDrop();
    setHud(engine.getHudSnapshot());
  }, []);

  const handleTouchHold = useCallback(() => {
    soundRef.current?.unlock();
    const engine = engineRef.current;
    if (!engine) return;
    engine.hold();
    setHud(engine.getHudSnapshot());
  }, []);

  const handleTouchRotateCW = useCallback(() => {
    soundRef.current?.unlock();
    engineRef.current?.rotate('cw');
  }, []);

  const handleTouchMoveLeft = useCallback(() => {
    soundRef.current?.unlock();
    engineRef.current?.move(-1);
  }, []);

  const handleTouchMoveRight = useCallback(() => {
    soundRef.current?.unlock();
    engineRef.current?.move(1);
  }, []);

  const handleTouchSoftDropStep = useCallback(() => {
    soundRef.current?.unlock();
    engineRef.current?.softDropStep();
  }, []);

    // Global keyboard bindings
  useEffect(() => {
    const findAction = (code: string): ActionName | null => {
      const bindings = settingsRef.current.keyBindings;
      for (const action of Object.keys(bindings) as ActionName[]) {
        if (bindings[action].includes(code)) {
          return action;
        }
      }
      return null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (settingsOpenRef.current) return;
      const engine = engineRef.current!;
      if (engine.status === 'menu') return;

      const action = findAction(e.code);
      if (!action) return;

      e.preventDefault();
      soundRef.current?.unlock();

      if (action === 'pause') {
        if (e.repeat) return;
        if (engine.status === 'playing') pauseGame();
        else if (engine.status === 'paused') resumeGame();
        return;
      }

      if (action === 'restart') {
        if (e.repeat) return;
        restartCurrent();
        return;
      }

      if (engine.status !== 'playing') return;

      switch (action) {
        case 'moveLeft':
          if (!e.repeat) inputRef.current?.pressLeft();
          break;
        case 'moveRight':
          if (!e.repeat) inputRef.current?.pressRight();
          break;
        case 'softDrop':
          if (!e.repeat) inputRef.current?.pressSoftDrop();
          break;
        case 'hardDrop':
          if (!e.repeat) {
            engine.hardDrop();
            setHud(engine.getHudSnapshot());
          }
          break;
        case 'rotateCW':
          if (!e.repeat) engine.rotate('cw');
          break;
        case 'rotateCCW':
          if (!e.repeat) engine.rotate('ccw');
          break;
        case 'rotate180':
          if (!e.repeat) engine.rotate('180');
          break;
        case 'hold':
          if (!e.repeat) {
            engine.hold();
            setHud(engine.getHudSnapshot());
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const action = findAction(e.code);
      if (!action) return;
      if (action === 'moveLeft') inputRef.current?.releaseLeft();
      if (action === 'moveRight') inputRef.current?.releaseRight();
      if (action === 'softDrop') inputRef.current?.releaseSoftDrop();
    };

    const handleBlur = () => {
      inputRef.current?.reset();
      if (engineRef.current?.status === 'playing') {
        pauseGame();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        inputRef.current?.reset();
        if (engineRef.current?.status === 'playing') {
          pauseGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseGame, resumeGame, restartCurrent]);

  const handleOpenSettings = useCallback(() => {
    if (engineRef.current?.status === 'playing') {
      pauseGame();
    }
    setSettingsOpen(true);
  }, [pauseGame]);

  return (
    <div className="app-backdrop h-dvh w-screen overflow-hidden">
      {hud.status === 'menu' ? (
        <MainMenu
          settings={settings}
          leaderboards={leaderboards}
          onStartMode={startMode}
          onSelectTheme={selectTheme}
          onToggleMute={toggleMute}
          onOpenSettings={handleOpenSettings}
        />
      ) : (
        <GameLayout
          hud={hud}
          settings={settings}
          callouts={callouts}
          canvasRef={canvasRef}
          onResizeBoard={handleResizeBoard}
          onCycleTheme={cycleTheme}
          onToggleMute={toggleMute}
          onToggleGhost={toggleGhostPiece}
          onOpenSettings={handleOpenSettings}
          onPause={pauseGame}
          onRestart={restartCurrent}
          onHold={handleTouchHold}
          onMoveLeft={handleTouchMoveLeft}
          onMoveRight={handleTouchMoveRight}
          onSoftDropStep={handleTouchSoftDropStep}
          onHardDropTouch={handleTouchHardDrop}
          onRotateCW={handleTouchRotateCW}
          touchControls={
            <TouchControls
              lift={settings.touchControlLift}
              swapped={settings.swapTouchHandedness}
              visible={settings.showTouchControls}
              onPressLeft={() => {
                soundRef.current?.unlock();
                inputRef.current?.pressLeft();
              }}
              onReleaseLeft={() => inputRef.current?.releaseLeft()}
              onPressRight={() => {
                soundRef.current?.unlock();
                inputRef.current?.pressRight();
              }}
              onReleaseRight={() => inputRef.current?.releaseRight()}
              onPressSoftDrop={() => {
                soundRef.current?.unlock();
                inputRef.current?.pressSoftDrop();
              }}
              onReleaseSoftDrop={() => inputRef.current?.releaseSoftDrop()}
              onHardDrop={handleTouchHardDrop}
              onRotateCW={handleTouchRotateCW}
              onRotateCCW={() => {
                soundRef.current?.unlock();
                engineRef.current?.rotate('ccw');
              }}
              onRotate180={() => {
                soundRef.current?.unlock();
                engineRef.current?.rotate('180');
              }}
              onHold={handleTouchHold}
            />
          }
        />
      )}

      {hud.status === 'paused' && !settingsOpen && (
        <PauseModal
          onResume={resumeGame}
          onRestart={restartCurrent}
          onOpenSettings={handleOpenSettings}
          onReturnMenu={returnToMenu}
        />
      )}

      {(hud.status === 'gameover' || hud.status === 'victory') && (
        <GameOverModal
          stats={hud}
          isVictory={hud.status === 'victory'}
          isNewBest={isNewBest}
          leaderboard={leaderboards[hud.mode]}
          onPlayAgain={restartCurrent}
          onReturnMenu={returnToMenu}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdate={setSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;

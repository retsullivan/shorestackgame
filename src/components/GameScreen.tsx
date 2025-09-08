import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Pause, Timer, Info } from "lucide-react";
import { ScreenBorder } from "./ScreenBorder";
import { Header } from "./Header";
import { useEffect, useMemo, useRef, useState } from "react";
import { getLevelData } from "../gameplay-logic/levels";
import RockStackingGame, { RockStackingGameHandle } from "../gameplay-logic/RockStackingGame";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useIsMobile } from "./ui/use-mobile";
import CharacterOverlay from "./CharacterOverlay";
import { GoalModal, WinModal, FailModal, PauseModal } from "./GameScreenModal";
import { getTheme } from "../gameplay-logic/themes";
import { useSettings } from "./SettingsContext";

interface GameScreenProps {
  onNavigate: (screen: string) => void;
  onStartLevel?: (levelId: number) => void;
  levelNumber?: number;
}

export function GameScreen({ onNavigate, onStartLevel, levelNumber = 1 }: GameScreenProps) {
  const levelData = useMemo(() => getLevelData(levelNumber), [levelNumber]);
  const overlayThemeName = levelData.overlayTheme ?? levelData.theme;
  const themeConfig = useMemo(() => getTheme(overlayThemeName), [overlayThemeName]);
  const overlayVariant: 'daytime' | 'sunset' = useMemo(() => {
    const key = String(overlayThemeName || '').toLowerCase();
    return key.includes('sunset') ? 'sunset' : 'daytime';
  }, [overlayThemeName]);
  const { masterVolume, musicEnabled } = useSettings();
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [winOpen, setWinOpen] = useState(false);
  const [failOpen, setFailOpen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [goalOpen, setGoalOpen] = useState(true);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [showWave, setShowWave] = useState(false);
  const [horizonPageY, setHorizonPageY] = useState<number | null>(null);
  // retained for mobile height challenge marker; not used for overlay positioning
  const [snailHeightPx] = useState<number>(0);
  const [snailClimb, setSnailClimb] = useState(false);
  const [snailHappy, setSnailHappy] = useState(false);
  // (unused placeholder retained for potential future loop-based timing)
  const [stackTopPage, setStackTopPage] = useState<{ x: number; y: number } | null>(null);
  const [stackRightBasePage, setStackRightBasePage] = useState<{ x: number; y: number } | null>(null);
  
  const [snailPhase, setSnailPhase] = useState<'idle' | 'glide' | 'jump' | 'happy'>('idle');
  // derived via onStateChange each frame; no need to store unused values
  const isMobile = useIsMobile();
  const gameRef = useRef<RockStackingGameHandle | null>(null);
  const climbTimerRef = useRef<number | null>(null);
  const happyTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const failAudioRef = useRef<HTMLAudioElement | null>(null);

  const isTimed = levelData.challenge?.type === 'timed' || levelData.challenge?.type === 'timed-height' || levelData.challenge?.type === 'timed_height';
  const initialTrayTotal = useMemo(() => levelData.types.reduce((acc, t) => acc + (t.count || 0), 0), [levelData.types]);
  const startingTime = useMemo(() => {
    if (isTimed) return levelData.challenge?.timeLimit ?? 0;
    return null;
  }, [isTimed, levelData.challenge]);

  useEffect(() => {
    setTimeLeft(startingTime);
    setPaused(true);
    setWinOpen(false);
    setFailOpen(false);
    setGameOver(false);
    setHasInteracted(false);
    setGoalOpen(true);
    setShowWave(false);
    setSnailClimb(false);
    setSnailHappy(false);
    setSnailPhase('idle');
    if (climbTimerRef.current) {
      window.clearTimeout(climbTimerRef.current);
      climbTimerRef.current = null;
    }
    if (happyTimerRef.current) {
      window.clearTimeout(happyTimerRef.current);
      happyTimerRef.current = null;
    }
    // Stop and cleanup audios on level change
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} audioRef.current = null; }
    if (failAudioRef.current) { try { failAudioRef.current.pause(); } catch {} failAudioRef.current = null; }
    
  }, [startingTime, levelNumber]);

  // Reset helper to clear snail animations and timers
  const resetSnailAndTimers = () => {
    setSnailClimb(false);
    setSnailHappy(false);
    setSnailPhase('idle');
    
    setStackTopPage(null);
    setStackRightBasePage(null);
    if (climbTimerRef.current) { window.clearTimeout(climbTimerRef.current); climbTimerRef.current = null; }
    if (happyTimerRef.current) { window.clearTimeout(happyTimerRef.current); happyTimerRef.current = null; }
    
  };

  // Timer loop
  useEffect(() => {
    if (!isTimed || timeLeft === null || paused || gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      setPaused(true);
      setShowWave(true);
      // 1s after wave shows, reset rocks back to tray; then open fail modal
      window.setTimeout(() => {
        gameRef.current?.reset();
      }, 1000);
      window.setTimeout(() => {
        setShowWave(false);
        setFailOpen(true);
      }, 1600);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => (t === null ? t : t - 1)), 1000);
    return () => clearInterval(id);
  }, [isTimed, timeLeft, paused, gameOver]);

  // Completion detection: height or default balance
  const isHeightLevel = levelData.challenge?.type === 'height' || levelData.challenge?.type === 'timed-height' || levelData.challenge?.type === 'timed_height';
  const handleStateChange = (s: { totalPlaced: number; staticCount: number; remainingTray: number; touchingGroundStatic: number; stackHeightPx?: number; }) => {
    // Ignore pre-game frames where nothing has been placed yet
    if (s.totalPlaced === 0 && s.remainingTray === initialTrayTotal) return;
    if (s.totalPlaced > 0 && !hasInteracted) setHasInteracted(true);
    if (!hasInteracted) return;
    // height is used directly from s.stackHeightPx when present
    if (!gameOver) {
      if (isHeightLevel) {
        // Use stricter target so three small unrotated rocks aren't enough by default.
        // Rotated stacks still count due to orientation-aware height measurement in the game loop.
        const fallback = Math.min(260, Math.round((typeof window !== 'undefined' ? window.innerHeight : 600) * 0.28));
        const target = Math.max(40, Math.round((snailHeightPx > 0 ? snailHeightPx : fallback) * 0.9));
        if ((s.stackHeightPx ?? 0) >= target && s.staticCount === s.totalPlaced && s.touchingGroundStatic >= 1) {
          setGameOver(true);
          setPaused(true);
          setWinOpen(true);
          setSnailClimb(true);
          setSnailPhase('glide');
          if (climbTimerRef.current) window.clearTimeout(climbTimerRef.current);
          // Streamlined and faster: brief glide → quick jump → short happy → modal
          climbTimerRef.current = window.setTimeout(() => {
            setSnailPhase('jump');
            const afterJump = window.setTimeout(() => {
              setSnailHappy(true);
              setSnailPhase('happy');
            }, 200);
            happyTimerRef.current = afterJump as unknown as number;
          }, 200);
        }
      } else if (s.remainingTray === 0 && s.staticCount === s.totalPlaced && s.touchingGroundStatic === 1) {
        // default success
        setGameOver(true);
        setPaused(true);
        setWinOpen(true);
        setSnailClimb(true);
        setSnailPhase('glide');
        if (climbTimerRef.current) window.clearTimeout(climbTimerRef.current);
        climbTimerRef.current = window.setTimeout(() => {
          setSnailPhase('jump');
          const afterJump = window.setTimeout(() => {
            setSnailHappy(true);
            setSnailPhase('happy');
          }, 200);
          happyTimerRef.current = afterJump as unknown as number;
        }, 200);
      }
    }
  };

  const hasWon = snailClimb || snailHappy || winOpen;

  // Music: play theme track during gameplay; keep playing through win state until next level
  useEffect(() => {
    if (!musicEnabled) {
      if (audioRef.current) { try { audioRef.current.pause(); } catch {} }
      if (failAudioRef.current) { try { failAudioRef.current.pause(); } catch {} }
      return;
    }
    // Ensure we have a theme track
    if (!themeConfig.musicUrl) {
      if (audioRef.current) { try { audioRef.current.pause(); } catch {} }
      return;
    }
    // If fail music is playing, don't start theme until failure ends/reset
    if (failAudioRef.current) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(themeConfig.musicUrl);
      audioRef.current.loop = true;
    }
    // Volume is 0..1
    audioRef.current.volume = Math.max(0, Math.min(1, masterVolume / 100));
    // Play during active gameplay OR after a win (until navigation/next level). Never play if fail modal is open.
    const shouldPlayTheme = ((!paused && !gameOver && !goalOpen) || hasWon) && !failOpen;
    if (shouldPlayTheme) {
      // Start/resume
      const el = audioRef.current;
      if (el.paused) { el.currentTime = el.currentTime; el.play().catch(() => {}); }
    } else {
      try { audioRef.current.pause(); } catch {}
    }
    return () => {
      // no-op; cleanup happens on level change/unmount
    };
  }, [themeConfig.musicUrl, paused, gameOver, goalOpen, hasWon, failOpen, masterVolume, musicEnabled]);

  // Switch to lose music when failing
  useEffect(() => {
    if (!musicEnabled) return;
    if (!failOpen) return;
    // pause theme
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} }
    // start fail music
    if (!failAudioRef.current) {
      // Use Vite glob dynamic import via new Audio with resolved path. We know file lives under assets/music
      // The loader in themes resolves music, but lose track is fixed name
      const base = (import.meta as any).glob('../assets/music/**.{mp3,ogg,wav}', { eager: true, as: 'url' }) as Record<string, string>;
      const direct = base['../assets/music/lose_shorestack.mp3']
        || Object.entries(base).find(([p]) => p.endsWith('/lose_shorestack.mp3'))?.[1]
        || Object.entries(base).find(([p]) => p.toLowerCase().includes('lose_shorestack'))?.[1];
      if (direct) {
        failAudioRef.current = new Audio(direct);
        failAudioRef.current.loop = false;
      }
    }
    if (failAudioRef.current) {
      const el = failAudioRef.current;
      el.volume = Math.max(0, Math.min(1, masterVolume / 100));
      el.currentTime = 0;
      el.play().catch(() => {});
    }
    return () => {
      // when fail modal closes or component unmounts, stop fail music
      if (failAudioRef.current && !failOpen) { try { failAudioRef.current.pause(); } catch {} failAudioRef.current = null; }
    };
  }, [failOpen, masterVolume, musicEnabled]);

  // Stop all music when leaving the level screen (unmount)
  useEffect(() => {
    return () => {
      if (audioRef.current) { try { audioRef.current.pause(); } catch {} }
      if (failAudioRef.current) { try { failAudioRef.current.pause(); } catch {} }
      audioRef.current = null;
      failAudioRef.current = null;
    };
  }, []);

  return (
    <ScreenBorder>
      <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(180deg, ${themeConfig.colors.sky} 0%, ${themeConfig.colors.sky} 60%, ${themeConfig.colors.water} 100%)` }}>
        {/* Game Header */}
        <div className="flex flex-col px-3 py-2 md:p-4 gap-2 sm:gap-0">
          <div className="flex items-center space-x-2 md:space-x-8">
            <Header
              title={`LEVEL ${String(levelNumber).padStart(2, '0')}`}
              subtitle={levelData.goal}
              onBack={() => onNavigate('levels')}
            />
          </div>
        </div>

        <div className="flex flex-row justify-between items-center">
          <div className="p-2">
            {isMobile ? (
              <Popover>
                <PopoverTrigger className="inline-flex items-center text-beach-dark-rock ml-4 w-full ">
                  <Info className="w-8 h-4" aria-label="Rotation info" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[200px]">
                  <div className="pixel-font text-xs text-beach-dark-rock">
                    Drag rocks to build a stack. While dragging, tap with a second finger to rotate.
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <HoverCard>
                <HoverCardTrigger className="inline-flex items-center text-beach-dark-rock ml-4">
                  <Info className="w-8 h-4" aria-label="Rotation info" />
                </HoverCardTrigger>
                <HoverCardContent align="start" className="w-fit">
                  <div className="pixel-font text-xs text-beach-dark-rock text-wrap">
                    Drag and drops rocks in a stack below. Press SPACEBAR to rotate.
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
          {/* Game Stats */}
          <div className="w-full flex flex-row justify-end items-center space-x-2 p-2">
            {/* Score hidden for now */}
            {isTimed && (
              <div className="flex items-center">
                <div className={`retro-button pixel-font text-beach-foam px-3 h-10 md:h-12 inline-flex items-center gap-2 ${timeLeft !== null && timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                  <Timer className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
                  <span className="text-xs md:text-sm">{timeLeft ?? 0}s</span>
                </div>
              </div>
            )}

            {!hasWon && (
              <Button onClick={() => { gameRef.current?.reset(); resetSnailAndTimers(); setShowWave(false); setGameOver(false); setHasInteracted(false); setTimeLeft(startingTime); }} className="retro-button pixel-font text-beach-dark-rock w-20 h-10 md:w-20 md:h-12 p-2 text-xs">
                RESET
              </Button>
            )}
            <Button onClick={() => { setPaused(true); setPauseOpen(true); }} className="retro-button pixel-font text-beach-dark-rock w-10 h-10 md:w-12 md:h-12 p-2 text-xs">
              <Pause className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
            </Button>
          </div>
        </div>


        {/* Game Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas-based gameplay fills the former stacking area bounds */}
          <div className="absolute left-0 right-0 top-0 bottom-0 pixel-border z-10">
            <RockStackingGame
              key={levelNumber}
              ref={gameRef}
              types={levelData.types}
              theme={levelData.theme}
              paused={paused}
              onStateChange={handleStateChange}
              themeColors={{ sky: themeConfig.colors.sky, water: themeConfig.colors.water }}
              onHorizonChange={(y) => setHorizonPageY(y)}
              onStackTopChange={(x, y) => setStackTopPage({ x, y })}
              onStackRightBaseChange={(x, y) => setStackRightBasePage({ x, y })}
              islands={themeConfig.islands}
              
            />
            {isMobile && (levelData.challenge?.type === 'height' || levelData.challenge?.type === 'timed-height' || levelData.challenge?.type === 'timed_height') && (
              <div
                className="pointer-events-none select-none"
                style={{ position: 'absolute', right: 8, bottom: 20, width: 8, height: `${Math.max(0, Math.round((snailHeightPx > 0 ? snailHeightPx : Math.min(260, Math.round((typeof window !== 'undefined' ? window.innerHeight : 600) * 0.28))) * 0.9))}px`, background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.55))', boxShadow: '0 0 0 2px rgba(0,0,0,0.15) inset', borderRadius: 2 }}
              />
            )}
          </div>
        </div>

        {/* Game Controls Panel */}
        <div className="p-3 md:p-4 pixel-border" style={{ backgroundColor: 'var(--muted-foreground)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">

            <div className="w-full sm:w-auto">
              <Progress value={0} className="h-2" />
            </div>
          </div>
        </div>
        {/* Modals */}
        <PauseModal
          open={pauseOpen}
          onOpenChange={(open) => { setPauseOpen(open); if (!open) setPaused(false); }}
          isTimed={isTimed}
          timeLeft={timeLeft}
          onResume={() => { setPauseOpen(false); setPaused(false); }}
          onRestart={() => { gameRef.current?.reset(); resetSnailAndTimers(); setShowWave(false); setGameOver(false); setHasInteracted(false); setTimeLeft(startingTime); setPauseOpen(false); setPaused(false); }}
        />
        <GoalModal
          open={goalOpen}
          onOpenChange={(open) => { setGoalOpen(open); if (!open) setPaused(false); }}
          levelNumber={levelNumber}
          goalText={levelData.goal ?? ""}
          tip={levelData.tip ?? ""}
          isTimed={isTimed}
          startingTime={startingTime}
          onStart={() => { setGoalOpen(false); setPaused(false); setHasInteracted(false); setTimeLeft(startingTime); }}
        />

        <WinModal
          open={winOpen}
          onOpenChange={setWinOpen}
          levelNumber={levelNumber}
          isTimed={isTimed}
          timeLeft={timeLeft}
          onLevels={() => { setWinOpen(false); setSnailClimb(false); setSnailHappy(false); if (climbTimerRef.current) { window.clearTimeout(climbTimerRef.current); climbTimerRef.current = null; } if (happyTimerRef.current) { window.clearTimeout(happyTimerRef.current); happyTimerRef.current = null; } onNavigate('levels'); }}
          onNext={() => {
            gameRef.current?.reset();
            setGameOver(false);
            setPaused(false);
            setFailOpen(false);
            setWinOpen(false);
            setSnailClimb(false);
            setSnailHappy(false);
            if (climbTimerRef.current) { window.clearTimeout(climbTimerRef.current); climbTimerRef.current = null; }
            if (happyTimerRef.current) { window.clearTimeout(happyTimerRef.current); happyTimerRef.current = null; }
            setTimeLeft(null);
            const next = levelNumber + 1;
            if (onStartLevel) onStartLevel(next);
            else onNavigate('levels');
          }}
        />

        <FailModal
          open={failOpen}
          onOpenChange={setFailOpen}
          isTimed={isTimed}
          onLevels={() => { setFailOpen(false); setSnailClimb(false); setSnailHappy(false); if (happyTimerRef.current) { window.clearTimeout(happyTimerRef.current); happyTimerRef.current = null; } onNavigate('levels'); }}
          onRetry={() => { setFailOpen(false); setSnailClimb(false); setSnailHappy(false); if (happyTimerRef.current) { window.clearTimeout(happyTimerRef.current); happyTimerRef.current = null; } gameRef.current?.reset(); setShowWave(false); setGameOver(false); setPaused(false); setHasInteracted(false); setTimeLeft(startingTime); }}
        />
        {/* Character Overlay */}
        {!isMobile && !pauseOpen && (
          <CharacterOverlay
            showWave={showWave}
            horizonPageY={horizonPageY ?? undefined}
            islands={[]}
            showClimb={snailClimb}
            stackTopPage={stackTopPage ?? undefined}
            rightBasePage={snailPhase === 'glide' ? (stackRightBasePage ?? undefined) : undefined}
            stepTargetPage={snailPhase === 'jump' ? (stackTopPage ?? null) : null}
            showHappy={snailHappy}
            onHappyLoopMs={undefined}
            isScared={Boolean(isTimed && timeLeft !== null && timeLeft <= 5 && !snailHappy && !snailClimb)}
            isSad={Boolean((failOpen || showWave || (isTimed && timeLeft !== null && timeLeft <= 0)) && !snailHappy && !snailClimb)}
            variantTheme={overlayVariant}
          />
        )}
      </div>
    </ScreenBorder>
  );
}
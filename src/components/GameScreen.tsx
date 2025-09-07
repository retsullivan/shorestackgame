import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Pause, Timer, Info, ArrowLeft } from "lucide-react";
import { ScreenBorder } from "./ScreenBorder";
import { Header } from "./Header";
import { useEffect, useMemo, useRef, useState } from "react";
import { getLevelData } from "../gameplay-logic/levels";
import RockStackingGame, { RockStackingGameHandle } from "../gameplay-logic/RockStackingGame";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useIsMobile } from "./ui/use-mobile";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

interface GameScreenProps {
  onNavigate: (screen: string) => void;
  onStartLevel?: (levelId: number) => void;
  levelNumber?: number;
}

export function GameScreen({ onNavigate, onStartLevel, levelNumber = 1 }: GameScreenProps) {
  const levelData = useMemo(() => getLevelData(levelNumber), [levelNumber]);
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [winOpen, setWinOpen] = useState(false);
  const [failOpen, setFailOpen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [goalOpen, setGoalOpen] = useState(true);
  // derived via onStateChange each frame; no need to store unused values
  const isMobile = useIsMobile();
  const gameRef = useRef<RockStackingGameHandle | null>(null);

  const isTimed = levelData.challenge?.type === 'timed';
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
  }, [startingTime, levelNumber]);

  // Timer loop
  useEffect(() => {
    if (!isTimed || timeLeft === null || paused || gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      setPaused(true);
      setFailOpen(true);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => (t === null ? t : t - 1)), 1000);
    return () => clearInterval(id);
  }, [isTimed, timeLeft, paused, gameOver]);

  // Completion detection: all rocks used and exactly one rock touching ground
  const handleStateChange = (s: { totalPlaced: number; staticCount: number; remainingTray: number; touchingGroundStatic: number; }) => {
    // Ignore pre-game frames where nothing has been placed yet
    if (s.totalPlaced === 0 && s.remainingTray === initialTrayTotal) return;
    if (s.totalPlaced > 0 && !hasInteracted) setHasInteracted(true);
    if (!hasInteracted) return;
    if (!gameOver && s.remainingTray === 0 && s.staticCount === s.totalPlaced && s.touchingGroundStatic === 1) {
      // success
      setGameOver(true);
      setPaused(true);
      setWinOpen(true);
    }
  };

  return (
    <ScreenBorder>
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #8e44ad 0%, #4fb3d9 80%, #e8d5b7 100%)' }}>
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
                    Drag and drops rocks in a stack below. To rotate tap with a second finger.
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

            <Button onClick={() => gameRef.current?.reset()} className="retro-button pixel-font text-beach-dark-rock w-20 h-10 md:w-20 md:h-12 p-2 text-xs">
              RESET
            </Button>
            <Button onClick={() => setPaused(p => !p)} className="retro-button pixel-font text-beach-dark-rock w-10 h-10 md:w-12 md:h-12 p-2 text-xs">
              <Pause className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
            </Button>
          </div>
        </div>


        {/* Game Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas-based gameplay fills the former stacking area bounds */}
          <div className="absolute left-0 right-0 top-0 bottom-0 pixel-border">
            <RockStackingGame key={levelNumber} ref={gameRef} types={levelData.types} theme={levelData.theme} paused={paused} onStateChange={handleStateChange} />
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
        {/* WIN MODAL */}
        {/* GOAL MODAL */}
        <Dialog open={goalOpen} onOpenChange={(open) => { setGoalOpen(open); if (!open) setPaused(false); }}>
          <DialogContent hideClose>
            <DialogHeader>
              <DialogTitle className="pixel-font">LEVEL {String(levelNumber)} GOAL</DialogTitle>
            </DialogHeader>
            <div className="pixel-font text-sm">{levelData.goal}</div>
            {isTimed && (
              <div className="pixel-font text-xs mt-2">You have {startingTime ?? 0}s. The timer starts when you press START.</div>
            )}
            <DialogFooter className="w-full">
              <div className="flex w-full items-center justify-end gap-2">
                <Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm" onClick={() => { setGoalOpen(false); setPaused(false); setHasInteracted(false); setTimeLeft(startingTime); }}>START</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* WIN MODAL */}
        <Dialog open={winOpen} onOpenChange={setWinOpen}>
          <DialogContent hideClose>
            <DialogHeader>
              <DialogTitle className="pixel-font">LEVEL {String(levelNumber)} COMPLETED!</DialogTitle>
            </DialogHeader>
            <div className="pixel-font text-sm">{isTimed ? `Finished with ${timeLeft ?? 0}s left.` : ``}</div>
            <DialogFooter className="w-full">
              <div className="flex w-full items-center justify-between gap-2">
                <div>
                  <Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm inline-flex items-center gap-2" onClick={() => { setWinOpen(false); onNavigate('levels'); }}>
                    <ArrowLeft className="w-4 h-4" />
                    LEVELS
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm" onClick={() => { setWinOpen(false); gameRef.current?.reset(); setGameOver(false); setPaused(false); setTimeLeft(startingTime); }}>REPLAY</Button>
                  <Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm" onClick={() => {
                    // fully reset local state and gameplay before moving to next level
                    gameRef.current?.reset();
                    setGameOver(false);
                    setPaused(false);
                    setFailOpen(false);
                    setWinOpen(false);
                    setTimeLeft(null);
                    const next = levelNumber + 1;
                    if (onStartLevel) onStartLevel(next);
                    else onNavigate('levels');
                  }}>NEXT</Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* FAIL MODAL */}
        <Dialog open={failOpen} onOpenChange={setFailOpen}>
          <DialogContent hideClose>
            <DialogHeader>
              <DialogTitle className="pixel-font">TRY AGAIN?</DialogTitle>
            </DialogHeader>
            <div className="pixel-font text-sm">{isTimed ? `Time's up!` : `Challenge not met.`}</div>
            <DialogFooter className="w-full">
              <div className="flex w-full items-center justify-between gap-2">
                <div>
                  <Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm inline-flex items-center gap-2" onClick={() => { setFailOpen(false); onNavigate('levels'); }}>
                    <ArrowLeft className="w-4 h-4" />
                    LEVELS
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button className="retro-button pixel-font text-beach-foam w-28 h-12 md:w-32 md:h-14 text-xs md:text-sm" onClick={() => { setFailOpen(false); gameRef.current?.reset(); setGameOver(false); setPaused(false); setHasInteracted(false); setTimeLeft(startingTime); }}>RETRY</Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScreenBorder>
  );
}
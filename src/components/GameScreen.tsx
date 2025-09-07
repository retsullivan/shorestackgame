import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Pause, Target, Timer, Info } from "lucide-react";
import { ScreenBorder } from "./ScreenBorder";
import { Header } from "./Header";
import { useRef, useState } from "react";
import { getLevelData } from "../gameplay-logic/levels";
import RockStackingGame, { RockStackingGameHandle } from "../gameplay-logic/RockStackingGame";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useIsMobile } from "./ui/use-mobile";

interface GameScreenProps {
  onNavigate: (screen: string) => void;
  levelNumber?: number;
}

export function GameScreen({ onNavigate, levelNumber = 1 }: GameScreenProps) {
  const [score] = useState(0);
  const [timeLeft] = useState(90);
  const levelData = getLevelData(levelNumber);
  const isMobile = useIsMobile();
  const gameRef = useRef<RockStackingGameHandle | null>(null);

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

            <div className="flex items-center space-x-1 md:space-x-2">
              <Target className="w-3 h-3 md:w-4 md:h-4 text-beach-dark-rock" strokeWidth={3} />
              <span className="pixel-font text-xs md:text-sm text-beach-dark-rock">SCORE: {score}</span>
            </div>

            <div className="flex items-center space-x-1 md:space-x-2">
              <Timer className="w-3 h-3 md:w-4 md:h-4 text-beach-dark-rock" strokeWidth={3} />
              <span className="pixel-font text-xs md:text-sm text-beach-dark-rock">{timeLeft}s</span>
            </div>

            <Button onClick={() => gameRef.current?.reset()} className="retro-button pixel-font text-beach-dark-rock w-20 h-10 md:w-20 md:h-12 p-2 text-xs">
              RESET
            </Button>
            <Button className="retro-button pixel-font text-beach-dark-rock w-10 h-10 md:w-12 md:h-12 p-2 text-xs">
              <Pause className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
            </Button>
          </div>
        </div>


        {/* Game Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas-based gameplay fills the former stacking area bounds */}
          <div className="absolute left-0 right-0 top-0 bottom-0 pixel-border">
            <RockStackingGame ref={gameRef} types={levelData.types} />
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
        </div>
    </ScreenBorder>
  );
}
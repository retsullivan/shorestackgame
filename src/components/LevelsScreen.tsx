import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, Lock } from "lucide-react";
import { ScreenBorder } from "./ScreenBorder";
import { Header } from "./Header";
import { listLevels } from "../gameplay-logic/levels";

interface LevelsScreenProps {
  onNavigate: (screen: string) => void;
  onStartLevel?: (levelId: number) => void;
}

export function LevelsScreen({ onNavigate, onStartLevel }: LevelsScreenProps) {
  const levels = listLevels()
    .sort((a, b) => a.id - b.id)
    .map((lvl) => ({
      id: lvl.id,
      name: lvl.name,
      // TODO: wire stars/unlocks to real progress data; defaults for now
      stars: 0,
      unlocked: true,
      difficulty: (lvl.challenge?.difficulty ?? "easy").toUpperCase(),
    }));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "bg-beach-seaweed";
      case "MEDIUM": return "bg-beach-water";
      case "HARD": return "bg-beach-coral";
      case "EXPERT": return "bg-beach-sunset";
      default: return "bg-beach-rock";
    }
  };

  return (
    <ScreenBorder>
      <div className="min-h-screen px-6 py-6 md:p-8" style={{ background: 'linear-gradient(180deg, #4fb3d9 0%, #26a0a7 50%, #2081a8 100%)' }}>
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Header 
          title="SELECT LEVEL" 
          onBack={() => onNavigate('welcome')}
        />


        {/* Levels Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          {levels.map((level) => (
            <div 
              key={level.id}
              className={`p-3 md:p-6 pixel-border rounded-lg cursor-pointer transition-transform hover:scale-105 ${
                level.unlocked ? 'bg-beach-foam' : 'bg-beach-sand opacity-60'
              }`}
              onClick={() => level.unlocked && (onStartLevel ? onStartLevel(level.id) : onNavigate('game'))}
            >
              {/* Level Header */}
              <div className="flex justify-between items-center mb-2 md:mb-4">
                <div className="pixel-font text-sm md:text-lg text-beach-dark-rock">
                  {level.id.toString().padStart(2, '0')}
                </div>
                {!level.unlocked && <Lock className="w-3 h-3 md:w-4 md:h-4 text-beach-dark-rock" strokeWidth={3} />}
              </div>

              {/* Level Name */}
              <h3 className="pixel-font text-xs md:text-sm text-beach-dark-rock mb-2 md:mb-3">
                {level.name}
              </h3>

              {/* Difficulty Badge */}
              <div className="mb-2 md:mb-4">
                <Badge className={`pixel-font text-xs text-beach-foam ${getDifficultyColor(level.difficulty)} border-none`}>
                  {level.difficulty}
                </Badge>
              </div>

            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button 
            onClick={() => (onStartLevel ? onStartLevel(1) : onNavigate('game'))}
            className="retro-button pixel-font text-beach-foam text-xs md:text-sm px-6 md:px-8 h-10 md:h-12 w-full sm:w-auto"
          >
            CONTINUE PLAYING
          </Button>
          <Button 
            onClick={() => onNavigate('welcome')}
            className="retro-button pixel-font text-beach-foam text-xs md:text-sm px-6 md:px-8 h-10 md:h-12 w-full sm:w-auto"
          >
            BACK TO MENU
          </Button>
        </div>

        
        </div>
      </div>
    </ScreenBorder>
  );
}
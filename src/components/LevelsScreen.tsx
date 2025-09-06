import React from 'react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, Star, Lock } from "lucide-react";
import { ScreenBorder } from "./ScreenBorder";

interface LevelsScreenProps {
  onNavigate: (screen: string) => void;
}

export function LevelsScreen({ onNavigate }: LevelsScreenProps) {
  const levels = [
    { id: 1, name: "TIDE POOLS", stars: 3, unlocked: true, difficulty: "EASY" },
    { id: 2, name: "CORAL COVE", stars: 2, unlocked: true, difficulty: "EASY" },
    { id: 3, name: "ROCKY SHORE", stars: 3, unlocked: true, difficulty: "EASY" },
    { id: 4, name: "KELP FOREST", stars: 1, unlocked: true, difficulty: "MEDIUM" },
    { id: 5, name: "DEEP WATERS", stars: 0, unlocked: true, difficulty: "MEDIUM" },
    { id: 6, name: "STORM BEACH", stars: 0, unlocked: false, difficulty: "MEDIUM" },
    { id: 7, name: "WHALE POINT", stars: 0, unlocked: false, difficulty: "HARD" },
    { id: 8, name: "MYSTIC CAVES", stars: 0, unlocked: false, difficulty: "HARD" },
    { id: 9, name: "CRYSTAL DEPTHS", stars: 0, unlocked: false, difficulty: "EXPERT" },
  ];

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
      <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(180deg, #4fb3d9 0%, #26a0a7 50%, #2081a8 100%)' }}>
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 md:mb-8">
          <Button
            onClick={() => onNavigate('welcome')}
            className="retro-button pixel-font text-beach-foam mr-3 md:mr-4 w-10 h-10 md:w-12 md:h-12 p-0"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
          <div>
            <h1 className="pixel-font text-lg md:text-3xl text-beach-foam">SELECT LEVEL</h1>
            <p className="pixel-font text-xs md:text-sm text-beach-foam mt-1 md:mt-2">Choose your beach adventure!</p>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="bg-beach-foam p-4 md:p-6 mb-6 md:mb-8 pixel-border">
          <div className="flex justify-around md:justify-between items-center">
            <div className="text-center">
              <div className="pixel-font text-base md:text-lg text-beach-dark-rock">9</div>
              <div className="pixel-font text-xs text-beach-dark-rock">LEVELS UNLOCKED</div>
            </div>
            <div className="text-center">
              <div className="pixel-font text-base md:text-lg text-beach-dark-rock">9★</div>
              <div className="pixel-font text-xs text-beach-dark-rock">STARS COLLECTED</div>
            </div>
            <div className="text-center">
              <div className="pixel-font text-base md:text-lg text-beach-dark-rock">5</div>
              <div className="pixel-font text-xs text-beach-dark-rock">LEVELS COMPLETED</div>
            </div>
          </div>
        </div>

        {/* Levels Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          {levels.map((level) => (
            <div 
              key={level.id}
              className={`p-3 md:p-6 pixel-border cursor-pointer transition-transform hover:scale-105 ${
                level.unlocked ? 'bg-beach-foam' : 'bg-beach-sand opacity-60'
              }`}
              onClick={() => level.unlocked && onNavigate('game')}
            >
              {/* Level Header */}
              <div className="flex justify-between items-center mb-2 md:mb-4">
                <div className="pixel-font text-sm md:text-lg text-beach-dark-rock">
                  {level.id.toString().padStart(2, '0')}
                </div>
                {!level.unlocked && <Lock className="w-3 h-3 md:w-4 md:h-4 text-beach-dark-rock" />}
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

              {/* Stars */}
              <div className="flex justify-center space-x-1">
                {Array.from({ length: 3 }).map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    className={`w-3 h-3 md:w-4 md:h-4 ${
                      starIndex < level.stars
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-beach-rock'
                    }`}
                  />
                ))}
              </div>

              {/* Decorative creatures for unlocked levels */}
              {level.unlocked && (
                <div className="flex justify-center mt-2 md:mt-4 space-x-1 md:space-x-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-beach-coral rounded-full pixel-border"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-beach-seaweed rounded-full pixel-border"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button 
            onClick={() => onNavigate('game')}
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

        {/* Floating sea elements */}
        <div className="fixed top-20 left-10 animate-bounce" style={{ animationDelay: '0s' }}>
          <div className="w-4 h-4 bg-beach-foam rounded-full pixel-border opacity-80"></div>
        </div>
        <div className="fixed top-40 right-16 animate-bounce" style={{ animationDelay: '1s' }}>
          <div className="w-6 h-6 bg-beach-foam rounded-full pixel-border opacity-80"></div>
        </div>
        <div className="fixed bottom-32 left-20 animate-bounce" style={{ animationDelay: '2s' }}>
          <div className="w-5 h-5 bg-beach-foam rounded-full pixel-border opacity-80"></div>
        </div>
        </div>
      </div>
    </ScreenBorder>
  );
}
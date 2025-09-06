import React from 'react';
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ArrowLeft, Pause, RotateCw, Target, Timer, Star } from "lucide-react";
import { ScreenBorder } from "./ScreenBorder";
import { useState } from "react";

interface GameScreenProps {
  onNavigate: (screen: string) => void;
}

export function GameScreen({ onNavigate }: GameScreenProps) {
  const [score, setScore] = useState(1250);
  const [timeLeft, setTimeLeft] = useState(45);
  const [towers, setTowers] = useState(2);
  const [selectedRock, setSelectedRock] = useState<number | null>(null);

  const rocks = [
    { id: 1, type: 'coral', x: 100, y: 400, stacked: false },
    { id: 2, type: 'seaweed', x: 150, y: 420, stacked: false },
    { id: 3, type: 'water', x: 200, y: 380, stacked: false },
    { id: 4, type: 'sand', x: 250, y: 410, stacked: false },
    { id: 5, type: 'coral', x: 120, y: 300, stacked: true },
    { id: 6, type: 'water', x: 160, y: 280, stacked: true },
  ];

  const creatures = [
    { id: 1, type: 'crab', x: 50, y: 450, happiness: 80 },
    { id: 2, type: 'starfish', x: 300, y: 430, happiness: 60 },
    { id: 3, type: 'seahorse', x: 400, y: 420, happiness: 90 },
  ];

  const getRockColor = (type: string) => {
    switch (type) {
      case 'coral': return 'bg-beach-coral';
      case 'seaweed': return 'bg-beach-seaweed';
      case 'water': return 'bg-beach-water';
      case 'sand': return 'bg-beach-sand';
      default: return 'bg-beach-rock';
    }
  };

  const getCreatureColor = (type: string) => {
    switch (type) {
      case 'crab': return 'bg-red-400';
      case 'starfish': return 'bg-purple-400';
      case 'seahorse': return 'bg-green-400';
      default: return 'bg-blue-400';
    }
  };

  return (
    <ScreenBorder>
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #8e44ad 0%, #4fb3d9 80%, #e8d5b7 100%)' }}>
      {/* Game Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-3 md:p-4 bg-beach-foam pixel-border gap-2 sm:gap-0">
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button
            onClick={() => onNavigate('levels')}
            className="retro-button pixel-font text-beach-dark-rock w-8 h-8 md:w-10 md:h-10 p-0 text-xs"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
          <div className="pixel-font text-xs md:text-sm text-beach-dark-rock">LEVEL 01 - TIDE POOLS</div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-6">
          <div className="flex items-center space-x-1 md:space-x-2">
            <Target className="w-3 h-3 md:w-4 md:h-4 text-beach-dark-rock" />
            <span className="pixel-font text-xs md:text-sm text-beach-dark-rock">SCORE: {score}</span>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-2">
            <Timer className="w-3 h-3 md:w-4 md:h-4 text-beach-dark-rock" />
            <span className="pixel-font text-xs md:text-sm text-beach-dark-rock">{timeLeft}s</span>
          </div>

          <Button className="retro-button pixel-font text-beach-dark-rock w-8 h-8 md:w-10 md:h-10 p-0 text-xs">
            <Pause className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Beach Background Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-beach-sand pixel-border"></div>
        
        {/* Water Area */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-beach-water opacity-80"></div>

        {/* Rocks */}
        {rocks.map((rock) => (
          <div
            key={rock.id}
            className={`absolute w-8 h-8 ${getRockColor(rock.type)} pixel-border cursor-pointer transition-transform hover:scale-110 ${
              selectedRock === rock.id ? 'scale-125 ring-2 ring-beach-foam' : ''
            }`}
            style={{ left: rock.x, top: rock.y }}
            onClick={() => setSelectedRock(selectedRock === rock.id ? null : rock.id)}
          />
        ))}

        {/* Creatures */}
        {creatures.map((creature) => (
          <div key={creature.id} className="absolute" style={{ left: creature.x, top: creature.y }}>
            <div className={`w-6 h-6 ${getCreatureColor(creature.type)} rounded-full pixel-border animate-pulse`}></div>
            {/* Happiness indicator */}
            <div className="absolute -top-2 -left-2 w-10">
              <Progress value={creature.happiness} className="h-1" />
            </div>
          </div>
        ))}

        {/* Rock Stacks Visualization */}
        <div className="absolute left-120 bottom-32">
          <div className="space-y-1">
            <div className="w-8 h-6 bg-beach-water pixel-border"></div>
            <div className="w-8 h-6 bg-beach-coral pixel-border"></div>
            <div className="w-8 h-6 bg-beach-sand pixel-border"></div>
          </div>
        </div>

        <div className="absolute left-180 bottom-32">
          <div className="space-y-1">
            <div className="w-8 h-6 bg-beach-seaweed pixel-border"></div>
            <div className="w-8 h-6 bg-beach-rock pixel-border"></div>
          </div>
        </div>
      </div>

      {/* Game Controls Panel */}
      <div className="bg-beach-foam p-3 md:p-4 pixel-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4">
            <div className="pixel-font text-xs md:text-sm text-beach-dark-rock">TOWERS: {towers}/3</div>
            <div className="pixel-font text-xs md:text-sm text-beach-dark-rock">GOAL: BUILD 3 TOWERS</div>
          </div>

          <div className="flex space-x-2 w-full sm:w-auto">
            <Button 
              disabled={!selectedRock}
              className="retro-button pixel-font text-beach-dark-rock text-xs px-3 md:px-4 h-7 md:h-8 disabled:opacity-50 flex-1 sm:flex-none"
            >
              <RotateCw className="w-3 h-3 mr-1" />
              ROTATE
            </Button>
            
            <Button className="retro-button pixel-font text-beach-dark-rock text-xs px-3 md:px-4 h-7 md:h-8 flex-1 sm:flex-none">
              HINT
            </Button>
          </div>
        </div>

        {/* Objective Progress */}
        <div className="mt-3 md:mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="pixel-font text-xs text-beach-dark-rock">STACK HEIGHT GOAL</span>
            <span className="pixel-font text-xs text-beach-dark-rock">6/8 ROCKS</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>
      </div>

      {/* Floating UI Elements */}
      <div className="absolute top-16 md:top-20 right-2 md:right-4 bg-beach-foam p-2 md:p-3 pixel-border">
        <div className="flex items-center space-x-1 md:space-x-2">
          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-yellow-400" />
          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-yellow-400" />
          <Star className="w-3 h-3 md:w-4 md:h-4 text-beach-rock" />
        </div>
        <div className="pixel-font text-xs text-beach-dark-rock text-center mt-1">2/3 STARS</div>
      </div>

      {/* Animated water bubbles */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="absolute bottom-10 w-2 h-2 bg-beach-foam rounded-full pixel-border animate-bounce opacity-60"
          style={{
            left: `${20 + i * 15}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: '2s'
          }}
        />
      ))}
      </div>
    </ScreenBorder>
  );
}
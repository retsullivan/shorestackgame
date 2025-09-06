import React from 'react';
import { Button } from "./ui/button";
import { ArrowLeft, Target, Zap, Star, Trophy } from "lucide-react";
import { ScreenBorder } from "./ScreenBorder";

interface HowToPlayScreenProps {
  onNavigate: (screen: string) => void;
}

export function HowToPlayScreen({ onNavigate }: HowToPlayScreenProps) {
  const instructions = [
    {
      icon: Target,
      title: "STACK ROCKS",
      description: "Click and drag rocks to build towers. Each creature has favorite rock patterns!"
    },
    {
      icon: Zap,
      title: "MATCH COLORS",
      description: "Sea creatures love colorful stacks! Match their preferred rock colors for bonus points."
    },
    {
      icon: Star,
      title: "BALANCE IS KEY",
      description: "Keep your towers steady! Wobbly stacks might tumble into the tide."
    },
    {
      icon: Trophy,
      title: "COMPLETE GOALS",
      description: "Each level has different objectives. Build high, build wide, or build smart!"
    }
  ];

  return (
    <ScreenBorder>
      <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(45deg, #ff6b9d 0%, #8e44ad 50%, #4fb3d9 100%)' }}>
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 md:mb-8">
          <Button
            onClick={() => onNavigate('welcome')}
            className="retro-button pixel-font text-beach-foam mr-3 md:mr-4 w-10 h-10 md:w-12 md:h-12 p-0"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
          <h1 className="pixel-font text-lg md:text-3xl text-beach-foam">HOW TO PLAY</h1>
        </div>

        {/* Game Story */}
        <div className="bg-beach-foam p-4 md:p-6 mb-6 md:mb-8 pixel-border">
          <h2 className="pixel-font text-base md:text-lg text-beach-dark-rock mb-3 md:mb-4">THE STORY</h2>
          <p className="pixel-font text-xs md:text-sm text-beach-dark-rock leading-relaxed mb-3 md:mb-4">
            Welcome to the magical shores of the Pacific Northwest! Here, playful sea creatures 
            spend their days building beautiful rock towers along the rocky beaches.
          </p>
          <p className="pixel-font text-xs md:text-sm text-beach-dark-rock leading-relaxed">
            As their trusted helper, you'll stack colorful rocks to create amazing sculptures 
            that make each creature happy. Every stack tells a story!
          </p>
        </div>

        {/* Instructions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {instructions.map((instruction, index) => (
            <div key={index} className="bg-beach-foam p-4 md:p-6 pixel-border">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-beach-water rounded-full pixel-border flex items-center justify-center mr-3 md:mr-4">
                  <instruction.icon className="w-5 h-5 md:w-6 md:h-6 text-beach-foam" />
                </div>
                <h3 className="pixel-font text-xs md:text-sm text-beach-dark-rock">{instruction.title}</h3>
              </div>
              <p className="pixel-font text-xs text-beach-dark-rock leading-relaxed">
                {instruction.description}
              </p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-beach-foam p-4 md:p-6 mb-6 md:mb-8 pixel-border">
          <h2 className="pixel-font text-base md:text-lg text-beach-dark-rock mb-3 md:mb-4">CONTROLS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-beach-water pixel-border mr-3 flex items-center justify-center">
                  <span className="pixel-font text-xs text-beach-foam">🖱</span>
                </div>
                <span className="pixel-font text-xs text-beach-dark-rock">CLICK & DRAG TO MOVE ROCKS</span>
              </div>
              <div className="flex items-center">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-beach-water pixel-border mr-3 flex items-center justify-center">
                  <span className="pixel-font text-xs text-beach-foam">R</span>
                </div>
                <span className="pixel-font text-xs text-beach-dark-rock">ROTATE SELECTED ROCK</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-beach-water pixel-border mr-3 flex items-center justify-center">
                  <span className="pixel-font text-xs text-beach-foam">⎵</span>
                </div>
                <span className="pixel-font text-xs text-beach-dark-rock">PAUSE GAME</span>
              </div>
              <div className="flex items-center">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-beach-water pixel-border mr-3 flex items-center justify-center">
                  <span className="pixel-font text-xs text-beach-foam">ESC</span>
                </div>
                <span className="pixel-font text-xs text-beach-dark-rock">RETURN TO MENU</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button 
            onClick={() => onNavigate('levels')}
            className="retro-button pixel-font text-beach-foam text-xs md:text-sm px-6 md:px-8 h-10 md:h-12 w-full sm:w-auto"
          >
            START PLAYING
          </Button>
          <Button 
            onClick={() => onNavigate('welcome')}
            className="retro-button pixel-font text-beach-foam text-xs md:text-sm px-6 md:px-8 h-10 md:h-12 w-full sm:w-auto"
          >
            BACK TO MENU
          </Button>
        </div>

        {/* Decorative bottom wave */}
        <div className="mt-12 flex justify-center">
          <div className="flex space-x-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i}
                className="w-3 h-3 bg-beach-foam rounded-full pixel-border animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </ScreenBorder>
  );
}
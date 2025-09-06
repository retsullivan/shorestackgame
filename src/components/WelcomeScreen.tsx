import React from 'react';
import { Button } from "./ui/button";
import { ScreenBorder } from "./ScreenBorder";
import exampleImage from '../assets/b8fd1025232463cfed6666e09afbdba9b0b25fb2.png';

interface WelcomeScreenProps {
  onNavigate: (screen: string) => void;
}

export function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <ScreenBorder>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #8e44ad 0%, #ff6b9d 50%, #4fb3d9 100%)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <img src={exampleImage} alt="Beach background" className="w-full h-full object-cover" />
      </div>
      
      {/* Floating sea creatures */}
      <div className="absolute top-20 left-16 animate-bounce" style={{ animationDelay: '0.5s' }}>
        <div className="w-8 h-8 bg-beach-coral rounded-full pixel-border"></div>
      </div>
      <div className="absolute top-32 right-20 animate-bounce" style={{ animationDelay: '1s' }}>
        <div className="w-6 h-6 bg-beach-seaweed rounded-full pixel-border"></div>
      </div>
      <div className="absolute bottom-40 left-24 animate-bounce" style={{ animationDelay: '1.5s' }}>
        <div className="w-10 h-10 bg-beach-water rounded-full pixel-border"></div>
      </div>
      
      <div className="relative z-10 text-center max-w-2xl">
        {/* Game Title */}
        <h1 className="pixel-font text-2xl md:text-4xl lg:text-6xl text-beach-foam mb-3 md:mb-4 drop-shadow-lg">
          Creature Climbers
        </h1>
        <h2 className="pixel-font text-sm md:text-lg lg:text-xl text-beach-foam mb-6 md:mb-8 drop-shadow-md">
          BEACH ADVENTURES
        </h2>
        
        {/* Subtitle */}
        <p className="pixel-font text-xs md:text-sm text-beach-foam mb-8 md:mb-12 opacity-90 max-w-xs md:max-w-md mx-auto px-4">
          Help cute sea creatures build magnificent rock towers on the Pacific coast!
        </p>
        
        {/* Menu Buttons */}
        <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 px-4">
          <Button
            onClick={() => onNavigate('levels')}
            className="retro-button pixel-font text-beach-foam w-full max-w-xs md:max-w-64 h-12 md:h-14 text-xs md:text-sm"
          >
            START GAME
          </Button>
          
          <Button
            onClick={() => onNavigate('howtoplay')}
            className="retro-button pixel-font text-beach-foam w-full max-w-xs md:max-w-64 h-12 md:h-14 text-xs md:text-sm"
          >
            HOW TO PLAY
          </Button>
          
          <Button
            onClick={() => onNavigate('settings')}
            className="retro-button pixel-font text-beach-foam w-full max-w-xs md:max-w-64 h-12 md:h-14 text-xs md:text-sm"
          >
            SETTINGS
          </Button>
        </div>
        
        {/* Decorative elements */}
        <div className="flex justify-center space-x-4">
          <div className="w-4 h-4 bg-beach-sand pixel-border"></div>
          <div className="w-4 h-4 bg-beach-rock pixel-border"></div>
          <div className="w-4 h-4 bg-beach-sand pixel-border"></div>
          <div className="w-4 h-4 bg-beach-rock pixel-border"></div>
          <div className="w-4 h-4 bg-beach-sand pixel-border"></div>
        </div>
      </div>
      </div>
    </ScreenBorder>
  );
}
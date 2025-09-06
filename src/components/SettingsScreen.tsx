import React from 'react';
import { Button } from "./ui/button";
import { ArrowLeft, Volume2, Music, Gamepad2 } from "lucide-react";
import { RetroSlider } from "./RetroSlider";
import { RetroToggle } from "./RetroToggle";
import { ScreenBorder } from "./ScreenBorder";
import { useState } from "react";

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const [masterVolume, setMasterVolume] = useState(75);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(true);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(false);
  const [particleEffectsEnabled, setParticleEffectsEnabled] = useState(true);

  return (
    <ScreenBorder>
      <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(135deg, #26a0a7 0%, #4fb3d9 100%)' }}>
        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 md:mb-8">
          <Button
            onClick={() => onNavigate('welcome')}
            className="retro-button pixel-font text-beach-foam mr-3 md:mr-4 w-10 h-10 md:w-12 md:h-12 p-0"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
          <h1 className="pixel-font text-xl md:text-3xl text-beach-foam">SETTINGS</h1>
        </div>

        {/* Settings Panel */}
        <div className="bg-beach-foam p-4 md:p-8 pixel-border rounded-none space-y-6 md:space-y-8">
          
          {/* Audio Settings */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="pixel-font text-base md:text-lg text-beach-dark-rock flex items-center">
              <Volume2 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              AUDIO
            </h2>
            
            <div className="space-y-4 pl-2 md:pl-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <label className="pixel-font text-xs md:text-sm text-beach-dark-rock">MASTER VOLUME</label>
                <div className="w-full sm:w-48">
                  <RetroSlider 
                    value={masterVolume} 
                    onChange={setMasterVolume} 
                    max={100} 
                    step={5} 
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="pixel-font text-xs md:text-sm text-beach-dark-rock">MUSIC</label>
                <RetroToggle checked={musicEnabled} onChange={setMusicEnabled} />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="pixel-font text-xs md:text-sm text-beach-dark-rock">SOUND EFFECTS</label>
                <RetroToggle checked={soundEffectsEnabled} onChange={setSoundEffectsEnabled} />
              </div>
            </div>
          </div>

          {/* Controls Settings */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="pixel-font text-base md:text-lg text-beach-dark-rock flex items-center">
              <Gamepad2 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              CONTROLS
            </h2>
            
            <div className="space-y-4 pl-2 md:pl-6">
              <div className="flex items-center justify-between">
                <label className="pixel-font text-xs md:text-sm text-beach-dark-rock">VIBRATION</label>
                <RetroToggle checked={vibrationEnabled} onChange={setVibrationEnabled} />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="pixel-font text-xs md:text-sm text-beach-dark-rock">AUTO-PAUSE</label>
                <RetroToggle checked={autoPauseEnabled} onChange={setAutoPauseEnabled} />
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="pixel-font text-base md:text-lg text-beach-dark-rock flex items-center">
              <Music className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              DISPLAY
            </h2>
            
            <div className="space-y-4 pl-2 md:pl-6">
              <div className="flex items-center justify-between">
                <label className="pixel-font text-xs md:text-sm text-beach-dark-rock">FULLSCREEN</label>
                <RetroToggle checked={fullscreenEnabled} onChange={setFullscreenEnabled} />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="pixel-font text-xs md:text-sm text-beach-dark-rock">PARTICLE EFFECTS</label>
                <RetroToggle checked={particleEffectsEnabled} onChange={setParticleEffectsEnabled} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
            <Button className="retro-button pixel-font text-beach-foam text-xs px-6 h-10 w-full sm:w-auto">
              RESET TO DEFAULT
            </Button>
            <Button 
              onClick={() => onNavigate('welcome')}
              className="retro-button pixel-font text-beach-foam text-xs px-6 h-10 w-full sm:w-auto"
            >
              SAVE & EXIT
            </Button>
          </div>
        </div>

        {/* Decorative sea creatures */}
        <div className="flex justify-center mt-8 space-x-6">
          <div className="w-6 h-6 bg-beach-coral rounded-full pixel-border animate-pulse"></div>
          <div className="w-8 h-8 bg-beach-seaweed rounded-full pixel-border animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="w-6 h-6 bg-beach-sunset rounded-full pixel-border animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        </div>
      </div>
    </ScreenBorder>
  );
}
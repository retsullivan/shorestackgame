import { Button } from "./ui/button";
import { Volume2 } from "lucide-react";
import { RetroSlider } from "./RetroSlider";
import { RetroToggle } from "./RetroToggle";
import { ScreenBorder } from "./ScreenBorder";
import { Header } from "./Header";
import { useState } from "react";
import { useSettings } from "./SettingsContext";

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { masterVolume, setMasterVolume, musicEnabled, setMusicEnabled } = useSettings();
  const [localMasterVolume, setLocalMasterVolume] = useState(masterVolume);
  

  return (
    <ScreenBorder>
      <div className="min-h-screen px-6 py-6 md:p-8" style={{ background: 'linear-gradient(135deg, #26a0a7 0%, #4fb3d9 100%)' }}>
        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Header 
          title="SETTINGS" 
          onBack={() => onNavigate('welcome')}
        />

        {/* Settings Panel */}
        <div className="bg-beach-foam p-6 md:p-8 pixel-border rounded-lg space-y-6 md:space-y-8">
          
          {/* Audio Settings */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="pixel-font text-base md:text-lg text-beach-dark-rock flex items-center">
              <Volume2 className="w-4 h-4 md:w-5 md:h-5 mr-2" strokeWidth={3} />
              AUDIO
            </h2>
            
            <div className="space-y-4 pl-2 md:pl-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <label className="pixel-font text-xs md:text-sm text-beach-dark-rock">MASTER VOLUME</label>
                <div className="w-full sm:w-48">
                  <RetroSlider 
                    value={localMasterVolume} 
                    onChange={setLocalMasterVolume} 
                    max={100} 
                    step={5} 
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="pixel-font text-xs md:text-sm text-beach-dark-rock">MUSIC</label>
                <RetroToggle checked={musicEnabled} onChange={setMusicEnabled} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
            <Button 
              onClick={() => { setLocalMasterVolume(75); setMusicEnabled(true); }}
              className="retro-button pixel-font text-beach-foam text-xs px-6 h-10 w-full sm:w-auto">
              RESET TO DEFAULT
            </Button>
            <Button 
              onClick={() => { setMasterVolume(localMasterVolume); onNavigate('welcome'); }}
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
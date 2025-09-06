import { Button } from "./ui/button";
import { ScreenBorder } from "./ScreenBorder";
import exampleImage from '../assets/sph_beach_night.jpg';

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
      
      
      
      <div className="relative z-10 text-center max-w-2xl">
        {/* Game Title */}
        <h1 className="pixel-font text-2xl md:text-4xl lg:text-6xl text-beach-foam mb-3 md:mb-4 drop-shadow-lg">
          Creature Climbers
        </h1>
        <h2 className="pixel-font text-sm md:text-lg lg:text-xl text-beach-foam mb-6 md:mb-8 drop-shadow-md">
          BEACH ADVENTURE
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
        
       
      </div>
      </div>
    </ScreenBorder>
  );
}
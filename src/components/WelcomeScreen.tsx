import { Button } from "./ui/button";
import { ScreenBorder } from "./ScreenBorder";
import exampleImage from '../assets/sph_beach_night.jpg';
import logoImage from '../assets/shorestack_logo_large.png';

interface WelcomeScreenProps {
  onNavigate: (screen: string) => void;
}

export function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <ScreenBorder>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #8e44ad 0%, #ff6b9d 50%, #4fb3d9 100%)', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <img src={exampleImage} alt="Beach background" className="w-full h-full object-cover" />
      </div>
      
      
      
      <div className="relative z-10 text-center max-w-2xl px-2">
        {/* Game Title (Logo) */}
        <div className="flex justify-center mb-3 md:mb-4">
          <img src={logoImage} alt="Shore Stack logo" className="w-40 sm:w-48 md:w-72 lg:w-96 drop-shadow-lg" />
        </div>
        <h2 className="pixel-font text-sm sm:text-md lg:text-xl text-beach-foam mb-4 md:mb-8 drop-shadow-md">
          A COZY RETRO PUZZLE GAME
        </h2>
        
        {/* Subtitle */}
        {/*<p className="pixel-font text-xs md:text-sm text-beach-foam mb-8 md:mb-12 opacity-90 max-w-xs md:max-w-md mx-auto px-4">
          Help cute sea creatures build magnificent rock towers on the Pacific coast!
        </p> */}
        
        {/* Menu Buttons */}
        <div className="flex flex-col space-y-3 md:space-y-4 mt-4 md:mt-8 mb-6 md:mb-8 px-4 justify-center items-center">
          <Button
            onClick={() => onNavigate('levels')}
            className="retro-button pixel-font text-beach-foam w-full max-w-[18rem] sm:max-w-xs md:max-w-64 h-12 md:h-14 text-xs md:text-sm"
          >
            LEVELS
          </Button>
          
          <Button
            onClick={() => onNavigate('howtoplay')}
            className="retro-button pixel-font text-beach-foam w-full max-w-[18rem] sm:max-w-xs md:max-w-64 h-12 md:h-14 text-xs md:text-sm"
          >
            HOW TO PLAY
          </Button>
          
          {/* <Button
            onClick={() => onNavigate('snaildance')}
            className="retro-button pixel-font text-beach-foam w-full max-w-[18rem] sm:max-w-xs md:max-w-64 h-12 md:h-14 text-xs md:text-sm"
          >
            DANCE PARTY
          </Button> */}

          <Button
            onClick={() => onNavigate('settings')}
            className="retro-button pixel-font text-beach-foam w-full max-w-[18rem] sm:max-w-xs md:max-w-64 h-12 md:h-14 text-xs md:text-sm"
          >
            SETTINGS
          </Button>
        </div>
        
       
      </div>
      </div>
    </ScreenBorder>
  );
}
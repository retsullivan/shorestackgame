import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HowToPlayScreen } from './components/HowToPlayScreen';
import { LevelsScreen } from './components/LevelsScreen';
import { GameScreen } from './components/GameScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('welcome');

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsScreen onNavigate={handleNavigate} />;
      case 'howtoplay':
        return <HowToPlayScreen onNavigate={handleNavigate} />;
      case 'levels':
        return <LevelsScreen onNavigate={handleNavigate} />;
      case 'game':
        return <GameScreen onNavigate={handleNavigate} />;
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderScreen()}
    </div>
  );
}
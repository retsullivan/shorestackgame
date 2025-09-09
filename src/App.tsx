import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HowToPlayScreen } from './components/HowToPlayScreen';
import { LevelsScreen } from './components/LevelsScreen';
import { GameScreen } from './components/GameScreen';
import { SettingsProvider } from './components/SettingsContext';
import { SnailDanceScreen } from './components/SnailDanceScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('welcome');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleStartLevel = (levelId: number) => {
    setSelectedLevel(levelId);
    setCurrentScreen('game');
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
        return <LevelsScreen onNavigate={handleNavigate} onStartLevel={handleStartLevel} />;
      case 'game':
        return <GameScreen onNavigate={handleNavigate} levelNumber={selectedLevel} onStartLevel={handleStartLevel} />;
      case 'snaildance':
        return <SnailDanceScreen onNavigate={handleNavigate} />;
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <SettingsProvider>
      <div className="min-h-screen">
        {renderScreen()}
      </div>
    </SettingsProvider>
  );
}
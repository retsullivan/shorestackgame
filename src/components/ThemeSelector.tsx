import { Button } from "./ui/button";

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  unlockedThemes: string[];
}

export function ThemeSelector({ currentTheme, onThemeChange, unlockedThemes }: ThemeSelectorProps) {
  const themes = [
    { id: 'pacific', name: 'Pacific Cove', colors: ['#8e44ad', '#ff6b9d', '#4fb3d9'] },
    { id: 'tropical', name: 'Tropical Paradise', colors: ['#f39c12', '#e74c3c', '#3498db'] },
    { id: 'arctic', name: 'Arctic Waters', colors: ['#d5dbdb', '#85c1e9', '#5dade2'] },
    { id: 'volcanic', name: 'Volcanic Shore', colors: ['#2e4053', '#cb4335', '#5499c7'] },
  ];

  return (
    <div className="absolute top-2 right-2 md:top-4 md:right-4 z-50">
      <div className="bg-beach-foam p-2 md:p-3 rounded-lg pixel-border">
        <h3 className="pixel-font text-xs text-beach-dark-rock mb-2">THEMES</h3>
        <div className="grid grid-cols-2 gap-1 md:gap-2">
          {themes.map((theme) => (
            <Button
              key={theme.id}
              onClick={() => unlockedThemes.includes(theme.id) && onThemeChange(theme.id)}
              className={`w-8 h-8 md:w-12 md:h-12 p-1 border-2 transition-all ${
                currentTheme === theme.id 
                  ? 'border-beach-dark-rock scale-110' 
                  : 'border-beach-rock hover:border-beach-dark-rock'
              } ${
                !unlockedThemes.includes(theme.id) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:scale-105'
              }`}
              style={{
                background: `linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 50%, ${theme.colors[2]} 100%)`
              }}
              disabled={!unlockedThemes.includes(theme.id)}
            >
              {!unlockedThemes.includes(theme.id) && (
                <div className="w-2 h-2 md:w-3 md:h-3 bg-beach-dark-rock rounded-full"></div>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
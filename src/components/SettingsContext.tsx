import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';

export interface SettingsState {
  masterVolume: number; // 0-100
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
}

interface SettingsContextValue extends SettingsState {
  setMasterVolume: (v: number) => void;
  setMusicEnabled: (v: boolean) => void;
  setSoundEffectsEnabled: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

const STORAGE_KEY = 'shorestack_settings_v1';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [masterVolume, setMasterVolume] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return 75;
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      return typeof parsed.masterVolume === 'number' ? parsed.masterVolume : 75;
    } catch {
      return 75;
    }
  });
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return true;
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      return typeof parsed.musicEnabled === 'boolean' ? parsed.musicEnabled : true;
    } catch {
      return true;
    }
  });
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return true;
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      return typeof parsed.soundEffectsEnabled === 'boolean' ? parsed.soundEffectsEnabled : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const toStore: SettingsState = { masterVolume, musicEnabled, soundEffectsEnabled };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore)); } catch {}
  }, [masterVolume, musicEnabled, soundEffectsEnabled]);

  const value: SettingsContextValue = useMemo(() => ({
    masterVolume,
    musicEnabled,
    soundEffectsEnabled,
    setMasterVolume,
    setMusicEnabled,
    setSoundEffectsEnabled,
  }), [masterVolume, musicEnabled, soundEffectsEnabled]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}




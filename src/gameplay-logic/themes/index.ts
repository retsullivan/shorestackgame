// Theme loader: provides colors and resolved island asset URLs per theme

// Load all theme JSONs dynamically so adding/removing files doesn't break imports
const themeJsonModules = (import.meta as any).glob('./*.json', { eager: true }) as Record<string, any>;

export type ThemeName = 'daytime' | 'sunset' | 'mixed';

export interface ThemeConfig {
  name: string;
  colors: {
    sky: string;
    water: string;
  };
  islands: string[]; // resolved asset URLs
  // Resolved music track URL for this theme, if provided by theme JSON
  musicUrl?: string;
}

// Resolve scenery image filenames to import URLs via Vite glob
const sceneryUrlMap = (import.meta as any).glob('../../assets/scenery/**.png', { eager: true, as: 'url' }) as Record<string, string>;
// Resolve music filenames to import URLs via Vite glob
const musicUrlMap = (import.meta as any).glob('../../assets/music/**.{mp3,ogg,wav}', { eager: true, as: 'url' }) as Record<string, string>;

function getJsonByFilename(filename: string): any | null {
  const entry = Object.entries(themeJsonModules).find(([path]) => path.endsWith(`/${filename}`));
  if (!entry) return null;
  const mod = entry[1];
  return (mod && (mod.default ?? mod)) || null;
}

function resolveIslandFilenames(filenames: string[]): string[] {
  // Files live under src/assets/scenery/
  return filenames
    .map((fn) => {
      // Try both with and without subfolders
      const rel1 = `../../assets/scenery/${fn}`;
      const url1 = sceneryUrlMap[rel1];
      if (url1) return url1;
      // Fallback scan: find any matching basename
      const entry = Object.entries(sceneryUrlMap).find(([path]) => path.endsWith(`/${fn}`));
      return entry ? entry[1] : '';
    })
    .filter((u) => !!u);
}

function resolveMusicFilename(filename?: string): string | undefined {
  if (!filename) return undefined;
  const rel1 = `../../assets/music/${filename}`;
  if (musicUrlMap[rel1]) return musicUrlMap[rel1];
  const entry = Object.entries(musicUrlMap).find(([path]) => path.endsWith(`/${filename}`));
  return entry ? entry[1] : undefined;
}

function resolveThemeBase(themeRef: string): any {
  const key = themeRef.trim();
  // If a specific file reference is provided
  if (key.endsWith('.json')) {
    const found = getJsonByFilename(key);
    if (found) return found;
  }
  // Fallback by family name
  if (key === 'sunset') {
    const sunsetEntry = Object.entries(themeJsonModules).find(([path]) => path.includes('sunset_'));
    const mod = sunsetEntry ? sunsetEntry[1] : null;
    if (mod) return (mod.default ?? mod) as any;
  }
  // Treat mixed as daytime visuals for overlay by default
  const daytimeEntry = Object.entries(themeJsonModules).find(([path]) => path.includes('daytime_'));
  const mod = daytimeEntry ? daytimeEntry[1] : null;
  return (mod ? (mod.default ?? mod) : {}) as any;
}

export function getTheme(themeRef: string): ThemeConfig {
  const base = resolveThemeBase(themeRef);
  const islands = resolveIslandFilenames(Object.values(base.islands ?? {}));
  const musicUrl = resolveMusicFilename(base.music);
  return {
    name: (base.name as string) ?? themeRef,
    colors: {
      sky: base.colors?.sky ?? '#4cb8c8',
      water: base.colors?.water ?? '#2f8585',
    },
    islands,
    musicUrl,
  };
}



import { useEffect, useMemo, useRef, useState } from "react";
import { ScreenBorder } from "./ScreenBorder";
import { Header } from "./Header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { RotateCcw } from "lucide-react";
import { getTheme } from "../gameplay-logic/themes";
import { useSettings } from "./SettingsContext";

import happySnail from "../assets/character_art/happy_snail_cropped_large.gif";
import sadSnail from "../assets/character_art/sad_snail_large.gif";
import scaredSnail from "../assets/character_art/scared_snail_large.gif";
import pinkSnail from "../assets/character_art/pink_snail_large.gif";

type Emotion = "happy" | "sad" | "scared";

// Default scale applied to assets when first placed from the tray
const DEFAULT_PLACE_SCALE: Record<"sand" | "island" | "tree" | "mountain" | "rock" | "snail", number> = {
  sand: 1,
  island: 0.8,
  tree: 0.8,
  mountain: 0.8,
  rock: 1,
  snail: 1,
};

interface SnailDanceScreenProps {
  onNavigate: (screen: string) => void;
}

export function SnailDanceScreen({ onNavigate }: SnailDanceScreenProps) {
  const [emotion, setEmotion] = useState<Emotion>("happy");
  const [themeKey, setThemeKey] = useState<"daytime" | "sunset">("daytime");
  const { masterVolume, musicEnabled } = useSettings();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Theme colors and music come from the chosen theme
  const themeConfig = useMemo(() => getTheme(themeKey), [themeKey]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [placedItems, setPlacedItems] = useState<Array<{
    id: string;
    url: string;
    kind: "sand" | "island" | "tree" | "mountain" | "rock" | "snail";
    x: number;
    y: number;
    z: number;
    width?: number;
    height?: number;
  }>>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const trayRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const resizeStartRef = useRef<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
  // Incrementing z-order index: earlier items are behind later items
  const spawnIndexRef = useRef<number>(0);
  const defaultSnailIdRef = useRef<string | null>(null);

  // Utility: remove item by id
  const removeItemById = (id: string) => setPlacedItems((prev) => prev.filter((p) => p.id !== id));

  // Layer controls removed

  // Keyboard: Delete or Backspace removes the selected item
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        setPlacedItems((prev) => prev.filter((p) => p.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  // Use the theme's music track, if available
  const musicUrl = useMemo(() => themeConfig.musicUrl, [themeConfig.musicUrl]);

  useEffect(() => {
    if (!musicEnabled) {
      if (audioRef.current) { try { audioRef.current.pause(); } catch {} }
      return;
    }
    if (!musicUrl) {
      if (audioRef.current) { try { audioRef.current.pause(); } catch {} audioRef.current = null; }
      return;
    }
    const vol = Math.max(0, Math.min(1, masterVolume / 100));
    if (!audioRef.current) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = vol;
      audioRef.current.play().catch(() => {});
    } else {
      try { audioRef.current.pause(); } catch {}
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = vol;
      audioRef.current.play().catch(() => {});
    }
    return () => {
      // no-op per change; full cleanup on unmount below
    };
  }, [musicUrl, musicEnabled, masterVolume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
        audioRef.current = null;
      }
    };
  }, []);

  const imageSrc = emotion === "happy" ? happySnail : emotion === "sad" ? sadSnail : scaredSnail;

  // Palette asset resolution
  const sceneryMap = useMemo(() => (
    (import.meta as any).glob('../assets/scenery/**.png', { eager: true, as: 'url' }) as Record<string, string>
  ), []);
  const rockSmallMap = useMemo(() => (
    (import.meta as any).glob('../assets/rock_art/small/**.png', { eager: true, as: 'url' }) as Record<string, string>
  ), []);
  const rockLargeMap = useMemo(() => (
    (import.meta as any).glob('../assets/rock_art/large/**.png', { eager: true, as: 'url' }) as Record<string, string>
  ), []);

  const sandUrls = useMemo(() => {
    return Object.entries(sceneryMap)
      .filter(([p]) => p.includes('sand_daytime') || p.includes('sand_sunset'))
      .map(([, url]) => url);
  }, [sceneryMap]);

  const mountainUrls = useMemo(() => {
    return Object.entries(sceneryMap)
      .filter(([p]) => p.includes('mountains_daytime') || p.includes('mountains_sunset'))
      .map(([, url]) => url);
  }, [sceneryMap]);

  const treeUrls = useMemo(() => {
    // Tree asset is daytime-specific; use it for both themes if needed
    const entries = Object.entries(sceneryMap).filter(([p]) => p.includes('tree_daytime'));
    return entries.map(([, url]) => url);
  }, [sceneryMap]);

  // Islands excluded from tray

  function computeLargeFromSmallKey(smallKey: string): string | undefined {
    // Example small key: ../assets/rock_art/small/daytime_rock.png
    // Desired large key: ../assets/rock_art/large/daytime_rock_large.png
    const replacedFolder = smallKey.replace('/small/', '/large/');
    const largeKey = replacedFolder.replace(/\.png$/i, '_large.png');
    return rockLargeMap[largeKey];
  }

  const rockPreview = useMemo(() => {
    return Object.entries(rockSmallMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([smallKey, smallUrl]) => ({ smallKey, smallUrl, largeUrl: computeLargeFromSmallKey(smallKey) || smallUrl }));
  }, [rockSmallMap, rockLargeMap]);

  // z-order is now determined by spawn order via spawnIndexRef

  function handlePaletteDragStart(e: React.DragEvent, url: string, kind: "sand" | "island" | "tree" | "mountain" | "rock" | "snail", largeUrl?: string) {
    const payload = JSON.stringify({ url, kind, largeUrl });
    e.dataTransfer.setData('application/x-snail-asset', payload);
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.effectAllowed = 'copy';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!containerRef.current) return;
    const data = e.dataTransfer.getData('application/x-snail-asset') || e.dataTransfer.getData('text/plain');
    if (!data) return;
    let parsed: { url: string; kind: "sand" | "island" | "tree" | "mountain" | "rock" | "snail"; largeUrl?: string } | null = null;
    try { parsed = JSON.parse(data); } catch { parsed = null; }
    if (!parsed) return;
    // If dropping over the tray, snap back (do not place)
    if (trayRef.current) {
      const t = trayRef.current.getBoundingClientRect();
      if (e.clientX >= t.left && e.clientX <= t.right && e.clientY >= t.top && e.clientY <= t.bottom) {
        return;
      }
    }
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 24;
    const y = e.clientY - rect.top - 24;
    const id = `${parsed.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const finalUrl = parsed.kind === 'rock' ? (parsed.largeUrl || parsed.url) : parsed.url;
    const z = spawnIndexRef.current;
    spawnIndexRef.current = spawnIndexRef.current + 1;
    setPlacedItems((prev) => prev.concat({ id, url: finalUrl, kind: parsed.kind, x, y, z }));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function beginItemDrag(e: React.MouseEvent, id: string) {
    if (!containerRef.current) return;
    const item = placedItems.find((p) => p.id === id);
    if (!item) return;
    setSelectedId(id);
    setDraggingId(id);
    const rect = containerRef.current.getBoundingClientRect();
    dragOffsetRef.current = { dx: e.clientX - rect.left - item.x, dy: e.clientY - rect.top - item.y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = e.clientX - rect.left - dragOffsetRef.current.dx;
    const ny = e.clientY - rect.top - dragOffsetRef.current.dy;
    setPlacedItems((prev) => prev.map((p) => p.id === draggingId ? { ...p, x: nx, y: ny } : p));
  }

  function endItemDrag(e?: React.MouseEvent) {
    if (!draggingId) return;
    const cx = e?.clientX ?? lastMouseRef.current.x;
    const cy = e?.clientY ?? lastMouseRef.current.y;
    if (trayRef.current) {
      const t = trayRef.current.getBoundingClientRect();
      if (cx >= t.left && cx <= t.right && cy >= t.top && cy <= t.bottom) {
        // Remove to snap back into tray
        setPlacedItems((prev) => prev.filter((p) => p.id !== draggingId));
        setDraggingId(null);
        return;
      }
    }
    // If pointer released outside container, remove item (mobile-friendly cleanup)
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      const outside = cx < r.left || cx > r.right || cy < r.top || cy > r.bottom;
      if (outside) {
        removeItemById(draggingId);
        setDraggingId(null);
        return;
      }
    }
    setDraggingId(null);
  }

  // Touch-based dragging support (mobile)
  function beginItemTouch(e: React.TouchEvent, id: string) {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const item = placedItems.find((p) => p.id === id);
    if (!item) return;
    setSelectedId(id);
    setDraggingId(id);
    const rect = containerRef.current.getBoundingClientRect();
    dragOffsetRef.current = { dx: touch.clientX - rect.left - item.x, dy: touch.clientY - rect.top - item.y };
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    lastMouseRef.current = { x: touch.clientX, y: touch.clientY };
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = touch.clientX - rect.left - dragOffsetRef.current.dx;
    const ny = touch.clientY - rect.top - dragOffsetRef.current.dy;
    setPlacedItems((prev) => prev.map((p) => p.id === draggingId ? { ...p, x: nx, y: ny } : p));
  }

  function endItemTouch(e: React.TouchEvent) {
    if (!draggingId) return;
    const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
    const cx = touch ? touch.clientX : lastMouseRef.current.x;
    const cy = touch ? touch.clientY : lastMouseRef.current.y;
    // Snap back if ended over tray
    if (trayRef.current) {
      const t = trayRef.current.getBoundingClientRect();
      if (cx >= t.left && cx <= t.right && cy >= t.top && cy <= t.bottom) {
        removeItemById(draggingId);
        setDraggingId(null);
        return;
      }
    }
    // Remove if ended off-screen (outside container)
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      const outside = cx < r.left || cx > r.right || cy < r.top || cy > r.bottom;
      if (outside) {
        removeItemById(draggingId);
        setDraggingId(null);
        return;
      }
    }
    setDraggingId(null);
  }

  function beginResize(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const item = placedItems.find((p) => p.id === id);
    if (!item) return;
    setSelectedId(id);
    const startW = item.width ?? 0;
    const startH = item.height ?? 0;
    // If dimensions unknown yet, skip until onLoad sets them
    if (!startW || !startH) return;
    resizeStartRef.current = { id, startX: e.clientX, startY: e.clientY, startW, startH };
  }

  function handleResizeMove(e: React.MouseEvent) {
    if (!resizeStartRef.current) return;
    const { id, startX, startW, startH } = resizeStartRef.current;
    const dx = e.clientX - startX;
    const newW = Math.max(24, Math.min(2048, startW + dx));
    const ratio = startH / startW;
    const newH = Math.round(newW * ratio);
    setPlacedItems((prev) => prev.map((p) => p.id === id ? { ...p, width: newW, height: newH } : p));
  }

  function endResize() {
    if (!resizeStartRef.current) return;
    resizeStartRef.current = null;
  }

  // Seed a default snail on first mount, and update its emotion image when changed
  useEffect(() => {
    if (!containerRef.current) return;
    if (!defaultSnailIdRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const id = `snail-default-${Date.now()}`;
      defaultSnailIdRef.current = id;
      const x = Math.max(0, Math.round(rect.width * 0.75));
      const y = Math.max(0, Math.round(rect.height * 0.65));
      const z = spawnIndexRef.current;
      spawnIndexRef.current = spawnIndexRef.current + 1;
      setPlacedItems((prev) => prev.concat({ id, url: imageSrc, kind: 'snail', x, y, z }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = defaultSnailIdRef.current;
    if (!id) return;
    setPlacedItems((prev) => prev.map((p) => p.id === id ? { ...p, url: imageSrc } : p));
  }, [imageSrc]);

  return (
    <ScreenBorder>
      <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(180deg, ${themeConfig.colors.sky} 0%, ${themeConfig.colors.sky} 60%, ${themeConfig.colors.water} 100%)` }}>
        <div className="flex flex-col px-3 py-2 md:p-4 gap-2 sm:gap-0">
          <div className="flex items-center space-x-2 md:space-x-8">
            <Header title="SNAIL DANCE" subtitle="Pick a vibe and enjoy" onBack={() => onNavigate('welcome')} />
          </div>
        </div>

        {/* Content Area (no rocks) */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {/* Top Tray + Dropdowns */}
          <div className="absolute left-0 right-0 top-16 z-20 px-2 md:px-3">
            <div className="w-full flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
              <div ref={trayRef} className="retro-button rounded-md md:rounded-lg flex-1 whitespace-nowrap py-1 md:py-2 px-2 min-h-[44px] " style={{ transform: 'none', boxShadow: '4px 4px 0px #2c1810, inset 0 0 0 2px #f7f3e9', backdropFilter: 'blur(2px)' }}>
                <div className="w-full flex items-center gap-2">
                  <div className="flex-1 overflow-x-auto overflow-y-hidden touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="inline-flex gap-2 items-center">
                      {mountainUrls.map((u) => (
                        <img key={`mountain-${u}`} src={u} draggable onDragStart={(e) => handlePaletteDragStart(e, u, 'mountain')} className="h-12 w-auto object-contain pixel-border cursor-grab bg-white/60 inline-block" style={{ imageRendering: 'pixelated' }} />
                      ))}
                      {treeUrls.map((u) => (
                        <img key={`tree-${u}`} src={u} draggable onDragStart={(e) => handlePaletteDragStart(e, u, 'tree')} className="h-12 w-auto object-contain pixel-border cursor-grab bg-white/60 inline-block" style={{ imageRendering: 'pixelated' }} />
                      ))}
                      {sandUrls.map((u) => (
                        <img key={`sand-${u}`} src={u} draggable onDragStart={(e) => handlePaletteDragStart(e, u, 'sand')} className="h-12 w-auto object-contain pixel-border cursor-grab bg-white/60 inline-block" style={{ imageRendering: 'pixelated' }} />
                      ))}
                      {rockPreview.map((r) => (
                        <img key={`rock-${r.smallKey}`} src={r.smallUrl} draggable onDragStart={(e) => handlePaletteDragStart(e, r.smallUrl, 'rock', r.largeUrl)} className="h-12 w-auto object-contain pixel-border cursor-grab bg-white/60 inline-block" style={{ imageRendering: 'pixelated' }} />
                      ))}
                      {/* Snail variants */}
                      {[pinkSnail, sadSnail, scaredSnail, happySnail].map((u, idx) => (
                        <img key={`snail-${idx}`} src={u} draggable onDragStart={(e) => handlePaletteDragStart(e, u, 'snail')} className="h-12 w-auto object-contain pixel-border cursor-grab bg-white/60 inline-block" style={{ imageRendering: 'pixelated' }} />
                      ))}
                    </div>
                  </div>
                  <div
                    onClick={() => { setPlacedItems([]); setSelectedId(null); }}
                    className="h-10 w-10 flex-none inline-flex items-center justify-center pixel-border bg-white/40 cursor-pointer"
                    title="Reset"
                    aria-label="Reset decorations"
                  >
                    <RotateCcw className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>
              <div className="flex flex-row flex-wrap items-center gap-2 md:gap-3">
                <div className="flex items-center gap-2">
                  <span className="pixel-font text-xs md:text-sm text-beach-foam">Emotion</span>
                  <Select value={emotion} onValueChange={(v) => setEmotion(v as Emotion)}>
                    <SelectTrigger className="w-28 sm:w-32 md:w-36 h-9 md:h-10 retro-button text-beach-foam pixel-font text-xs">
                      <SelectValue placeholder="Choose emotion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="pixel-font" value="happy">Happy</SelectItem>
                      <SelectItem className="pixel-font" value="sad">Sad</SelectItem>
                      <SelectItem className="pixel-font" value="scared">Scared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pixel-font text-xs md:text-sm text-beach-foam">Theme</span>
                  <Select value={themeKey} onValueChange={(v) => setThemeKey(v as "daytime" | "sunset") }>
                    <SelectTrigger className="w-28 sm:w-32 md:w-36 h-9 md:h-10 retro-button text-beach-foam pixel-font text-xs">
                      <SelectValue placeholder="Choose theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="pixel-font" value="daytime">Daytime</SelectItem>
                      <SelectItem className="pixel-font" value="sunset">Sunset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Snail visual */}
          <div
            ref={containerRef}
            className="absolute inset-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onMouseMove={(e) => { handleMouseMove(e); handleResizeMove(e); }}
            onMouseUp={(e) => { endItemDrag(e); endResize(); }}
            onMouseLeave={(e) => { endItemDrag(e); endResize(); }}
            onTouchMove={(e) => { handleTouchMove(e); }}
            onTouchEnd={(e) => { endItemTouch(e); endResize(); }}
            onTouchCancel={(e) => { endItemTouch(e); endResize(); }}
          >
            {placedItems.sort((a, b) => a.z - b.z).map((item) => (
              <div key={item.id} className="absolute select-none" style={{ left: item.x, top: item.y, zIndex: item.z }} onMouseDown={() => setSelectedId(item.id)}>
                <img
                  src={item.url}
                  alt={item.kind}
                  className="cursor-move block"
                  style={{ imageRendering: 'pixelated', width: item.width ? `${item.width}px` : undefined, height: item.height ? `${item.height}px` : undefined }}
                  onMouseDown={(e) => beginItemDrag(e, item.id)}
                  onTouchStart={(e) => beginItemTouch(e, item.id)}
                  onLoad={(ev) => {
                    const el = ev.currentTarget as HTMLImageElement;
                    if (!item.width || !item.height) {
                      const scale = DEFAULT_PLACE_SCALE[item.kind] ?? 1;
                      const w = Math.round(el.naturalWidth * scale);
                      const h = Math.round(el.naturalHeight * scale);
                      setPlacedItems((prev) => prev.map((p) => p.id === item.id ? { ...p, width: w, height: h } : p));
                    }
                  }}
                  draggable={false}
                />
                {selectedId === item.id && item.width && item.height && (
                  <div
                    className="absolute bg-beach-dark-rock"
                    style={{ width: 12, height: 12, right: -6, bottom: -6, cursor: 'nwse-resize' }}
                    onMouseDown={(e) => beginResize(e, item.id)}
                  />
                )}
              </div>
            ))}
            <div className="pointer-events-none select-none" style={{ position: 'absolute', right: '10%', bottom: 24, zIndex: 50 }}>
              <img src={imageSrc} alt="Snail" className="w-40 md:w-64" style={{ imageRendering: 'pixelated' }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 pixel-border" style={{ backgroundColor: 'var(--muted-foreground)' }}>
          <div className="flex items-center justify-between">
            <div className="pixel-font text-xs md:text-sm text-beach-dark-rock">No puzzles here. Just vibes.</div>
            <Button onClick={() => onNavigate('welcome')} className="retro-button pixel-font text-beach-dark-rock h-10 md:h-12 text-xs">BACK</Button>
          </div>
        </div>
      </div>
    </ScreenBorder>
  );
}

export default SnailDanceScreen;



import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "./ui/use-mobile";
import { ScreenBorder } from "./ScreenBorder";
import { Header } from "./Header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
// import { Button } from "./ui/button";
import { RotateCcw, Info } from "lucide-react";
import { getTheme } from "../gameplay-logic/themes";
import { useSettings } from "./SettingsContext";
import { SnailDanceWelcomeModal } from "./GameModals";

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
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const isMobile = useIsMobile();

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
  const resizeStartRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startLeft: number;
    startTop: number;
    corner: 'nw' | 'ne' | 'se' | 'sw';
  } | null>(null);
  const CORNER_TAP_SLOP_PX = 12;
  const trayTouchRef = useRef<{ sx: number; sy: number; moved: boolean }>({ sx: 0, sy: 0, moved: false });

  function placeFromTray(kind: "sand" | "island" | "tree" | "mountain" | "rock" | "snail", url: string, largeUrl?: string) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const finalUrl = kind === 'rock' ? (largeUrl || url) : url;
    const x = Math.max(0, Math.round(rect.width * 0.5) - 24);
    const y = Math.max(0, Math.round(rect.height * 0.55) - 24);
    const z = spawnIndexRef.current;
    spawnIndexRef.current = spawnIndexRef.current + 1;
    setPlacedItems((prev) => prev.concat({ id, url: finalUrl, kind, x, y, z }));
    setSelectedId(id);
  }

  function handleTrayTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    trayTouchRef.current = { sx: t.clientX, sy: t.clientY, moved: false };
  }

  function handleTrayTouchMove(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    const { sx, sy } = trayTouchRef.current;
    if (Math.abs(t.clientX - sx) > 8 || Math.abs(t.clientY - sy) > 8) {
      trayTouchRef.current.moved = true;
    }
  }

  function handleTrayTouchEndPlace(e: React.TouchEvent, kind: "sand" | "island" | "tree" | "mountain" | "rock" | "snail", url: string, largeUrl?: string) {
    if (trayTouchRef.current.moved) return;
    e.preventDefault();
    placeFromTray(kind, url, largeUrl);
  }
  // Incrementing z-order index: earlier items are behind later items
  const spawnIndexRef = useRef<number>(0);
  const defaultSnailIdRef = useRef<string | null>(null);
  const defaultSnailCenteredRef = useRef<boolean>(false);

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
    e.stopPropagation();
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
    e.stopPropagation();
    e.preventDefault();
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

  function isPointNearSelectedCorner(clientX: number, clientY: number): boolean {
    if (!selectedId || !containerRef.current) return false;
    const item = placedItems.find((p) => p.id === selectedId);
    if (!item || !item.width || !item.height) return false;
    const rect = containerRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const corners = [
      { x: item.x, y: item.y },
      { x: item.x + item.width, y: item.y },
      { x: item.x, y: item.y + item.height },
      { x: item.x + item.width, y: item.y + item.height },
    ];
    for (const c of corners) {
      if (Math.abs(px - c.x) <= CORNER_TAP_SLOP_PX && Math.abs(py - c.y) <= CORNER_TAP_SLOP_PX) {
        return true;
      }
    }
    return false;
  }

  function isPointInsideSelected(clientX: number, clientY: number): boolean {
    if (!selectedId || !containerRef.current) return false;
    const item = placedItems.find((p) => p.id === selectedId);
    if (!item || !item.width || !item.height) return false;
    const rect = containerRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    return px >= item.x && px <= item.x + item.width && py >= item.y && py <= item.y + item.height;
  }

  function handleContainerMouseDown(e: React.MouseEvent) {
    // Ignore if a resize is starting or dragging in progress
    if (resizeStartRef.current || draggingId) return;
    if (!selectedId) return;
    // Keep selection if clicking inside item or near its corners
    if (isPointInsideSelected(e.clientX, e.clientY) || isPointNearSelectedCorner(e.clientX, e.clientY)) return;
    setSelectedId(null);
  }

  function handleContainerTouchStart(e: React.TouchEvent) {
    if (resizeStartRef.current || draggingId) return;
    if (!selectedId) return;
    const touch = e.touches[0];
    if (!touch) return;
    if (isPointInsideSelected(touch.clientX, touch.clientY) || isPointNearSelectedCorner(touch.clientX, touch.clientY)) return;
    setSelectedId(null);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    lastMouseRef.current = { x: touch.clientX, y: touch.clientY };
    // If a resize is in progress, let the resize handler process movement
    if (resizeStartRef.current) {
      e.preventDefault();
      return;
    }
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

  function beginResize(e: React.MouseEvent, id: string, corner: 'nw' | 'ne' | 'se' | 'sw') {
    e.stopPropagation();
    const item = placedItems.find((p) => p.id === id);
    if (!item) return;
    setSelectedId(id);
    const startW = item.width ?? 0;
    const startH = item.height ?? 0;
    // If dimensions unknown yet, skip until onLoad sets them
    if (!startW || !startH) return;
    resizeStartRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      startW,
      startH,
      startLeft: item.x,
      startTop: item.y,
      corner,
    };
  }

  function beginResizeTouch(e: React.TouchEvent, id: string, corner: 'nw' | 'ne' | 'se' | 'sw') {
    e.stopPropagation();
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const item = placedItems.find((p) => p.id === id);
    if (!item) return;
    setSelectedId(id);
    // Ensure dragging does not compete with resizing on touch
    setDraggingId(null);
    const startW = item.width ?? 0;
    const startH = item.height ?? 0;
    if (!startW || !startH) return;
    resizeStartRef.current = {
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      startW,
      startH,
      startLeft: item.x,
      startTop: item.y,
      corner,
    };
  }

  function handleResizeMove(e: React.MouseEvent) {
    if (!resizeStartRef.current) return;
    const { id, startX, startW, startH, startLeft, startTop, corner } = resizeStartRef.current;
    const dx = e.clientX - startX;

    const ratio = startH / startW;
    let newW = startW;
    if (corner === 'se' || corner === 'ne') {
      newW = startW + dx;
    } else if (corner === 'sw' || corner === 'nw') {
      newW = startW - dx;
    }
    newW = Math.max(24, Math.min(2048, Math.round(newW)));
    const newH = Math.round(newW * ratio);

    let newX = startLeft;
    let newY = startTop;
    // Adjust position to keep the opposite corner fixed
    if (corner === 'sw' || corner === 'nw') {
      newX = startLeft + (startW - newW);
    }
    if (corner === 'nw' || corner === 'ne') {
      newY = startTop + (startH - newH);
    }

    setPlacedItems((prev) => prev.map((p) => p.id === id ? { ...p, x: newX, y: newY, width: newW, height: newH } : p));
  }

  function handleResizeMoveTouch(e: React.TouchEvent) {
    if (!resizeStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const { id, startX, startW, startH, startLeft, startTop, corner } = resizeStartRef.current;
    const dx = touch.clientX - startX;

    const ratio = startH / startW;
    let newW = startW;
    if (corner === 'se' || corner === 'ne') {
      newW = startW + dx;
    } else if (corner === 'sw' || corner === 'nw') {
      newW = startW - dx;
    }
    newW = Math.max(24, Math.min(2048, Math.round(newW)));
    const newH = Math.round(newW * ratio);

    let newX = startLeft;
    let newY = startTop;
    if (corner === 'sw' || corner === 'nw') {
      newX = startLeft + (startW - newW);
    }
    if (corner === 'nw' || corner === 'ne') {
      newY = startTop + (startH - newH);
    }

    setPlacedItems((prev) => prev.map((p) => p.id === id ? { ...p, x: newX, y: newY, width: newW, height: newH } : p));
    e.preventDefault();
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
      const x = Math.max(0, Math.round(rect.width * 0.5));
      const y = Math.max(0, Math.round(rect.height * 0.5));
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
      <SnailDanceWelcomeModal
        open={showWelcome}
        onOpenChange={setShowWelcome}
        onClose={() => setShowWelcome(false)}
      />
      <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(180deg, ${themeConfig.colors.sky} 0%, ${themeConfig.colors.sky} 60%, ${themeConfig.colors.water} 100%)`, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex flex-col px-3 py-2 md:p-4 gap-2 sm:gap-0">
          <div className="flex items-center space-x-2 md:space-x-8">
            <Header title="DANCY PARTY" subtitle="Decorate the dance shore and enjoy" onBack={() => onNavigate('welcome')} />
          </div>
        </div>

        {/* Content Area (no rocks) */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {/* Top Tray + Dropdowns */}
          <div className="absolute left-0 right-0 top-8 md:top-6 z-20 px-2 md:px-3">
            <div className="w-full flex flex-col gap-2 md:grid md:grid-cols-1 md:items-center md:gap-3 lg:gap-4">
              <div ref={trayRef} className="retro-button rounded-md md:rounded-lg whitespace-nowrap py-1 md:py-2 px-2 min-h-[44px] md:col-start-1 " style={{ transform: 'none', boxShadow: '4px 4px 0px #2c1810, inset 0 0 0 2px #f7f3e9', backdropFilter: 'blur(2px)', marginTop: 'env(safe-area-inset-top, 0px)' }}>
                <div className="w-full flex items-center gap-2">
                  <div
                    onClick={() => setShowWelcome(true)}
                    className="h-10 w-10 flex-none inline-flex items-center justify-center pixel-border bg-white/40 cursor-pointer"
                    title="How to use"
                    aria-label="How to use"
                  >
                    <Info className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                  <div className="flex-1 overflow-x-auto overflow-y-hidden touch-pan-x" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', overscrollBehaviorX: 'contain' }}>
                    <div className="inline-flex gap-2 items-center">
                      {mountainUrls.map((u) => (
                        <img
                          key={`mountain-${u}`}
                          src={u}
                          draggable={!isMobile}
                          onDragStart={(e) => { if (!isMobile) handlePaletteDragStart(e, u, 'mountain'); }}
                          onTouchStart={isMobile ? handleTrayTouchStart : undefined}
                          onTouchMove={isMobile ? handleTrayTouchMove : undefined}
                          onTouchEnd={isMobile ? (e) => handleTrayTouchEndPlace(e, 'mountain', u) : undefined}
                          className="h-12 w-auto object-contain pixel-border cursor-grab bg-white/60 inline-block"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ))}
                      {treeUrls.map((u) => (
                        <img
                          key={`tree-${u}`}
                          src={u}
                          draggable={!isMobile}
                          onDragStart={(e) => { if (!isMobile) handlePaletteDragStart(e, u, 'tree'); }}
                          onTouchStart={isMobile ? handleTrayTouchStart : undefined}
                          onTouchMove={isMobile ? handleTrayTouchMove : undefined}
                          onTouchEnd={isMobile ? (e) => handleTrayTouchEndPlace(e, 'tree', u) : undefined}
                          className="h-12 w-auto object-contain pixel-border cursor-grab bg-white/60 inline-block"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ))}
                      {sandUrls.map((u) => (
                        <img
                          key={`sand-${u}`}
                          src={u}
                          draggable={!isMobile}
                          onDragStart={(e) => { if (!isMobile) handlePaletteDragStart(e, u, 'sand'); }}
                          onTouchStart={isMobile ? handleTrayTouchStart : undefined}
                          onTouchMove={isMobile ? handleTrayTouchMove : undefined}
                          onTouchEnd={isMobile ? (e) => handleTrayTouchEndPlace(e, 'sand', u) : undefined}
                          className="h-12 w-auto object-contain pixel-border cursor-grab bg-white/60 inline-block"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ))}
                      {rockPreview.map((r) => (
                        <img
                          key={`rock-${r.smallKey}`}
                          src={r.smallUrl}
                          draggable={!isMobile}
                          onDragStart={(e) => { if (!isMobile) handlePaletteDragStart(e, r.smallUrl, 'rock', r.largeUrl); }}
                          onTouchStart={isMobile ? handleTrayTouchStart : undefined}
                          onTouchMove={isMobile ? handleTrayTouchMove : undefined}
                          onTouchEnd={isMobile ? (e) => handleTrayTouchEndPlace(e, 'rock', r.smallUrl, r.largeUrl) : undefined}
                          className="h-12 w-auto object-contain pixel-border cursor-grab bg-white/60 inline-block"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ))}
                      {/* Snail variants */}
                      {[pinkSnail, sadSnail, scaredSnail, happySnail].map((u, idx) => (
                        <img
                          key={`snail-${idx}`}
                          src={u}
                          draggable={!isMobile}
                          onDragStart={(e) => { if (!isMobile) handlePaletteDragStart(e, u, 'snail'); }}
                          onTouchStart={isMobile ? handleTrayTouchStart : undefined}
                          onTouchMove={isMobile ? handleTrayTouchMove : undefined}
                          onTouchEnd={isMobile ? (e) => handleTrayTouchEndPlace(e, 'snail', u) : undefined}
                          className="h-12 w-auto object-contain pixel-border cursor-grab bg-white/60 inline-block"
                          style={{ imageRendering: 'pixelated' }}
                        />
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
              {/* Dropdowns moved to footer on large screens */}
            </div>
          </div>

          {/* Snail visual */}
          <div
            ref={containerRef}
            className="absolute inset-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={(e) => { handleMouseMove(e); handleResizeMove(e); }}
            onMouseUp={(e) => { endItemDrag(e); endResize(); }}
            onMouseLeave={(e) => { endItemDrag(e); endResize(); }}
            onTouchStart={handleContainerTouchStart}
            onTouchMove={(e) => { handleResizeMoveTouch(e); handleTouchMove(e); }}
            onTouchEnd={(e) => { endItemTouch(e); endResize(); }}
            onTouchCancel={(e) => { endItemTouch(e); endResize(); }}
            style={{ touchAction: 'none' }}
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
                      // If this is the default seeded snail, recentre using measured size
                      if (defaultSnailIdRef.current === item.id && !defaultSnailCenteredRef.current && containerRef.current) {
                        const r = containerRef.current.getBoundingClientRect();
                        const cx = Math.max(0, Math.round((r.width - w) / 2));
                        const cy = Math.max(0, Math.round((r.height - h) / 2));
                        defaultSnailCenteredRef.current = true;
                        setPlacedItems((prev) => prev.map((p) => p.id === item.id ? { ...p, width: w, height: h, x: cx, y: cy } : p));
                      } else {
                        setPlacedItems((prev) => prev.map((p) => p.id === item.id ? { ...p, width: w, height: h } : p));
                      }
                    }
                  }}
                  draggable={false}
                />
                {selectedId === item.id && item.width && item.height && (
                  <>
                    {/* Thin selection box */}
                    <div
                      className="absolute pointer-events-none"
                      style={{ left: 0, top: 0, width: item.width, height: item.height, boxShadow: '0 0 0 3px #ffffff' }}
                    />
                    {/* Corner handles */}
                    <div
                      className="absolute"
                      style={{ width: 5, height: 5, left: -3, top: -3, background: '#000', cursor: 'nwse-resize', touchAction: 'none' }}
                      onMouseDown={(e) => beginResize(e, item.id, 'nw')}
                      onTouchStart={(e) => beginResizeTouch(e, item.id, 'nw')}
                      title="Resize"
                      aria-label="Resize top-left"
                    />
                    <div
                      className="absolute"
                      style={{ width: 5, height: 5, right: -3, top: -3, background: '#000', cursor: 'nesw-resize', touchAction: 'none' }}
                      onMouseDown={(e) => beginResize(e, item.id, 'ne')}
                      onTouchStart={(e) => beginResizeTouch(e, item.id, 'ne')}
                      title="Resize"
                      aria-label="Resize top-right"
                    />
                    <div
                      className="absolute"
                      style={{ width: 5, height: 5, left: -3, bottom: -3, background: '#000', cursor: 'nesw-resize', touchAction: 'none' }}
                      onMouseDown={(e) => beginResize(e, item.id, 'sw')}
                      onTouchStart={(e) => beginResizeTouch(e, item.id, 'sw')}
                      title="Resize"
                      aria-label="Resize bottom-left"
                    />
                    <div
                      className="absolute"
                      style={{ width: 5, height: 5, right: -3, bottom: -3, background: '#000', cursor: 'nwse-resize', touchAction: 'none' }}
                      onMouseDown={(e) => beginResize(e, item.id, 'se')}
                      onTouchStart={(e) => beginResizeTouch(e, item.id, 'se')}
                      title="Resize"
                      aria-label="Resize bottom-right"
                    />
                  </>
                )}
                {selectedId === item.id && (
                  <div
                    className="absolute pixel-border bg-white/90 text-beach-dark-rock flex items-center justify-center"
                    style={{ width: 16, height: 16, right: -8, top: -28, cursor: 'pointer' }}
                    onMouseDown={(e) => { e.stopPropagation(); }}
                    onClick={(e) => { e.stopPropagation(); removeItemById(item.id); setSelectedId(null); }}
                    title="Delete"
                    aria-label="Delete"
                  >
                    <span className="pixel-font" style={{ fontSize: 10, lineHeight: '10px' }}>X</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 pixel-border" style={{ backgroundColor: 'var(--muted-foreground)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="pixel-font text-xs md:text-sm text-beach-dark-rock">No puzzles here. Just vibes.</div>
            <div className="flex items-center gap-2 md:gap-3 order-2 md:order-none">
              <div className="flex items-center gap-2">
                <span className="pixel-font text-xs md:text-sm text-beach-dark-rock">Emotion</span>
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
                <span className="pixel-font text-xs md:text-sm text-beach-dark-rock">Theme</span>
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
      </div>
    </ScreenBorder>
  );
}

export default SnailDanceScreen;



import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Pause, RotateCw, Target, Timer } from "lucide-react";
import { ScreenBorder } from "./ScreenBorder";
import { Header } from "./Header";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { getLevelData } from "../levels";
import { LevelRock } from "../levels/types";
import { Rotation } from "../physics/rockPhysics";

interface GameScreenProps {
  onNavigate: (screen: string) => void;
  levelNumber?: number;
}

export function GameScreen({ onNavigate, levelNumber = 1 }: GameScreenProps) {
  const [score] = useState(0);
  const [timeLeft] = useState(90);
  const [selectedRockId, setSelectedRockId] = useState<string | null>(null);
  const [rocks, setRocks] = useState<(LevelRock & { rotationDeg: Rotation; position: { x: number; y: number } })[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pileRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const pileLabelRef = useRef<HTMLDivElement | null>(null);

  const pileCardPadding = 16;
  const SLOT_WIDTH = 84; // base horizontal slot spacing (responsive adjustments can be layered later)

  const rockColorClass = (shape: string) => {
    switch (shape) {
      case "triangle":
        return "bg-beach-coral";
      case "quad":
      default:
        return "bg-beach-rock";
    }
  };

  const rockSizePx = (size: string) => {
    switch (size) {
      case "large":
        return 72;
      case "medium":
        return 60;
      case "small":
      default:
        return 48;
    }
  };

  useLayoutEffect(() => {
    const init = () => {
      const pileRect = pileRef.current?.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!pileRect || !containerRect) return;
      const levelData = getLevelData(levelNumber);
      const left = pileRect.left - containerRect.left;
      const top = pileRect.top - containerRect.top;
      const labelHeight = pileLabelRef.current?.getBoundingClientRect().height ?? 0;
      const trayInnerHeight = Math.max(0, pileRect.height - pileCardPadding * 2 - labelHeight);
      const rightEdge = left + pileRect.width;
      const initialized = levelData.rocks.map((r, i) => {
        const sizePx = rockSizePx(r.size);
        // Align slots from the right edge inward
        const x = rightEdge - pileCardPadding - (i + 1) * SLOT_WIDTH + (SLOT_WIDTH - sizePx) / 2;
        const y = top + pileCardPadding + labelHeight + (trayInnerHeight - sizePx) / 2;
        return {
          ...r,
          rotationDeg: 0 as Rotation,
          position: { x, y },
          zIndex: i + 1,
        };
      });
      setRocks(initialized);
    };
    requestAnimationFrame(init);
  }, [levelNumber]);

  const bringToFront = (id: string) => {
    setRocks((prev) => {
      const maxZ = prev.reduce((m, r) => Math.max(m, r.zIndex), 0);
      return prev.map((r) => (r.id === id ? { ...r, zIndex: maxZ + 1 } : r));
    });
  };

  const onMouseDownRock = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setSelectedRockId(id);
    bringToFront(id);
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const rock = rocks.find((r) => r.id === id);
    if (!rock) return;
    const cursorX = e.clientX - containerRect.left;
    const cursorY = e.clientY - containerRect.top;
    setDragOffset({ x: rock.position.x - cursorX, y: rock.position.y - cursorY });
    setDraggingId(id);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const cursorX = e.clientX - containerRect.left;
    const cursorY = e.clientY - containerRect.top;
    const nextX = cursorX + dragOffset.x;
    const nextY = cursorY + dragOffset.y;
    setRocks((prev) => prev.map((r) => (r.id === draggingId ? { ...r, position: { x: nextX, y: nextY } } : r)));
  };

  // placeholder removed; real endDrag with snap is defined later

  const rotateSelected = () => {
    if (!selectedRockId) return;
    setRocks((prev) =>
      prev.map((r) =>
        r.id === selectedRockId
          ? { ...r, rotationDeg: (((r.rotationDeg + 90) % 360) as Rotation) }
          : r
      )
    );
  };

  // Slot index mapping by rock id (stable order per level)
  const indexById = useMemo(() => {
    const mapping = new Map<string, number>();
    const { rocks: defined } = getLevelData(levelNumber);
    defined.forEach((r, i) => mapping.set(r.id, i));
    return mapping;
  }, [levelNumber]);

  const computeTraySlotPosition = (slotIndex: number, sizePx: number) => {
    const pileRect = pileRef.current?.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!pileRect || !containerRect) return { x: 0, y: 0 };
    const left = pileRect.left - containerRect.left;
    const top = pileRect.top - containerRect.top;
    const rightEdge = left + pileRect.width;
    const labelHeight = pileLabelRef.current?.getBoundingClientRect().height ?? 0;
    const trayInnerHeight = Math.max(0, pileRect.height - pileCardPadding * 2 - labelHeight);
    const x = rightEdge - pileCardPadding - (slotIndex + 1) * SLOT_WIDTH + (SLOT_WIDTH - sizePx) / 2;
    const y = top + pileCardPadding + labelHeight + (trayInnerHeight - sizePx) / 2;
    return { x, y };
  };

  const endDrag = () => {
    if (draggingId) {
      const rock = rocks.find((r) => r.id === draggingId);
      const pileRect = pileRef.current?.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (rock && pileRect && containerRect) {
        const sizePx = rockSizePx(rock.size);
        const tray = {
          left: pileRect.left - containerRect.left,
          top: pileRect.top - containerRect.top,
          right: pileRect.left - containerRect.left + pileRect.width,
          bottom: pileRect.top - containerRect.top + pileRect.height,
        };
        const rr = {
          left: rock.position.x,
          top: rock.position.y,
          right: rock.position.x + sizePx,
          bottom: rock.position.y + sizePx,
        };
        const overlaps = !(rr.left > tray.right || rr.right < tray.left || rr.top > tray.bottom || rr.bottom < tray.top);
        if (overlaps) {
          const slotIndex = indexById.get(rock.id) ?? 0;
          const snapPos = computeTraySlotPosition(slotIndex, sizePx);
          setRocks((prev) => prev.map((r) => (r.id === rock.id ? { ...r, position: snapPos } : r)));
        }
      }
    }
    setDraggingId(null);
  };

  const isSelected = (id: string) => selectedRockId === id;

  const levelData = getLevelData(levelNumber);

  return (
    <ScreenBorder>
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #8e44ad 0%, #4fb3d9 80%, #e8d5b7 100%)' }}>
      {/* Game Header */}
      <div className="flex flex-col px-3 py-2 md:p-4 gap-2 sm:gap-0">
        <div className="flex items-center space-x-2 md:space-x-8">
          <Header 
            title={`LEVEL ${String(levelNumber).padStart(2, '0')}`} 
            subtitle={levelData.goal}
            onBack={() => onNavigate('levels')}
          />
        </div>
      </div>
      
        {/* Game Stats */}
      <div className="w-full flex flex-row justify-end items-center space-x-2 p-2">
  
          <div className="flex items-center space-x-1 md:space-x-2">
            <Target className="w-3 h-3 md:w-4 md:h-4 text-beach-dark-rock" strokeWidth={3} />
            <span className="pixel-font text-xs md:text-sm text-beach-dark-rock">SCORE: {score}</span>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-2">
            <Timer className="w-3 h-3 md:w-4 md:h-4 text-beach-dark-rock" strokeWidth={3} />
            <span className="pixel-font text-xs md:text-sm text-beach-dark-rock">{timeLeft}s</span>
          </div>

          <Button className="retro-button pixel-font text-beach-dark-rock w-8 h-8 md:w-10 md:h-10 p-0 text-xs">
            <Pause className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
          </Button>
       
      </div>
     

      {/* Game Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden justify-between items-center"
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        {/* Pile Row (dark) - top of gameplay area, full width, taller */}
        <div
          ref={pileRef}
          className="absolute top-0 left-0 right-0 h-32 bg-beach-dark-rock pixel-border"
        >
          <div ref={pileLabelRef} className="pixel-font text-[10px] text-beach-foam px-4 py-2">ROCK PILE</div>
        </div>

       
        {/* Render Level 1 Rocks */}
        {rocks.map((r) => {
          const sizePx = rockSizePx(r.size);
          const transform = `translate(${r.position.x}px, ${r.position.y}px) rotate(${r.rotationDeg}deg)`;
          const base = (
            <div
              key={r.id}
              className={`absolute ${rockColorClass(r.shape)} pixel-border cursor-pointer`}
              style={{
                width: `${sizePx}px`,
                height: `${sizePx}px`,
                transform,
                transformOrigin: "center",
                zIndex: r.zIndex,
                boxShadow: isSelected(r.id) ? "0 0 0 2px #c0f4ff" : undefined,
              }}
              onMouseDown={(e) => onMouseDownRock(e, r.id)}
              onClick={() => setSelectedRockId(isSelected(r.id) ? null : r.id)}
            />
          );

          // Simple visual distinction: triangles rendered as diamond via clip-path
          if (r.shape === "triangle") {
            return (
              <div
                key={r.id}
                className="absolute cursor-pointer"
                style={{ transform, transformOrigin: "center", zIndex: r.zIndex }}
                onMouseDown={(e) => onMouseDownRock(e, r.id)}
                onClick={() => setSelectedRockId(isSelected(r.id) ? null : r.id)}
              >
                <div
                  className={`${rockColorClass(r.shape)} pixel-border`}
                  style={{
                    width: `${sizePx}px`,
                    height: `${sizePx}px`,
                    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                    boxShadow: isSelected(r.id) ? "0 0 0 2px #c0f4ff" : undefined,
                  }}
                />
              </div>
            );
          }
          return base;
        })}

        {/* Stack Area (white) - fill below tray, full width */}
        <div
          ref={stackRef}
          className="absolute left-0 right-0 bottom-0 top-32 bg-white pixel-border"
        >
          <div className="pixel-font text-[10px] text-beach-dark-rock px-2 py-1">STACK HERE</div>
        </div>
      </div>

      {/* Game Controls Panel */}
      <div className="bg-beach-foam p-3 md:p-4 pixel-border">
        <div className="flex items-center justify-between">
     
          <div className="flex space-x-2">
            <Button
              disabled={!selectedRockId}
              onClick={rotateSelected}
              className="retro-button pixel-font text-beach-dark-rock text-xs px-3 md:px-4 h-7 md:h-8 disabled:opacity-50"
            >
              <RotateCw className="w-3 h-3 mr-1" strokeWidth={3} />
              ROTATE
            </Button>
            
          </div>
        </div>
        <div className="mt-3 md:mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="pixel-font text-xs text-beach-dark-rock">LEVEL 1: MOVE ROCKS TO WHITE AREA</span>
            <span className="pixel-font text-xs text-beach-dark-rock">5 ROCKS</span>
          </div>
          <Progress value={(rocks.length ? (rocks.filter(r => r.position.x > 320).length / 5) : 0) * 100} className="h-2" />
        </div>
      </div>

      {/* Subtle water bar */}
      <div className="absolute left-0 right-0 bottom-0 h-6 bg-beach-water opacity-70"></div>
      </div>
    </ScreenBorder>
  );
}
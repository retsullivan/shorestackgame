import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Pause, RotateCcw, Target, Timer } from "lucide-react";
import { ScreenBorder } from "./ScreenBorder";
import { Header } from "./Header";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { getLevelData } from "../levels";
import { LevelRock } from "../levels/types";
import { Rotation, updateRockFall, RockMotion } from "../physics/rockPhysics";

interface GameScreenProps {
  onNavigate: (screen: string) => void;
  levelNumber?: number;
}

type UIRock = LevelRock & {
  rotationDeg: Rotation; // logical snapped angle for UI state
  position: { x: number; y: number };
  // Spring-animated rotation for snappy + springy feel
  rotationDisplayDeg: number;
  rotationTargetDeg: number;
  rotationVel: number;
} & RockMotion;

export function GameScreen({ onNavigate, levelNumber = 1 }: GameScreenProps) {
  // Rotation spring tuning (lower stiffness/velocity => slower, more time to rotate)
  const ROT_STIFFNESS = 5.6;  // slowed 50% from 11.2
  const ROT_DAMPING = 0.34;   // slight damping tweak for smooth settle
  const ROT_MAX_VEL = 160;    // slowed 50% from 320
  const [score] = useState(0);
  const [timeLeft] = useState(90);
  const [selectedRockId, setSelectedRockId] = useState<string | null>(null);
  const [rocks, setRocks] = useState<UIRock[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pileRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const pileLabelRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const pileCardPadding = 16;
  const SLOT_WIDTH = 84; // base horizontal slot spacing (responsive adjustments can be layered later)

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

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
      // keep calculation comment for future responsive rows (no variable to avoid lint warnings)
      const rightEdge = left + pileRect.width;
      const initialized: UIRock[] = levelData.rocks.map((r, i) => {
        const sizePx = rockSizePx(r.size);
        // Align slots from the right edge inward
        const rawX = rightEdge - pileCardPadding - (i + 1) * SLOT_WIDTH + (SLOT_WIDTH - sizePx) / 2;
        const rawY = top + pileCardPadding + labelHeight + 4; // keep safely within tray top area
        const minX = left + pileCardPadding;
        const maxX = rightEdge - pileCardPadding - sizePx;
        const minY = top + pileCardPadding + labelHeight;
        const maxY = top + pileRect.height - pileCardPadding - sizePx;
        const x = clamp(rawX, minX, Math.max(minX, maxX));
        const y = clamp(rawY, minY, Math.max(minY, maxY));
        return {
          ...r,
          rotationDeg: 0 as Rotation,
          rotationDisplayDeg: 0,
          rotationTargetDeg: 0,
          rotationVel: 0,
          position: { x, y },
          zIndex: i + 1,
          vy: 0,
          isFalling: false,
        };
      });
      setRocks(initialized);
    };
    requestAnimationFrame(init);
    const onResize = () => requestAnimationFrame(init);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
    // Pause gravity while dragging
    setRocks((prev) => prev.map((r) => (r.id === id ? { ...r, isFalling: false, vy: 0 } : r)));
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

  const computeGroundY = () => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const stackRect = stackRef.current?.getBoundingClientRect();
    if (!containerRect || !stackRect) return 0;
    // Ground line inside stack area, a few pixels above bottom border
    return stackRect.bottom - containerRect.top - 8;
  };

  const runAnimationLoop = () => {
    if (rafRef.current != null) return; // already running
    const step = () => {
      const groundY = computeGroundY();
      let anyFalling = false;
      let anyRotating = false;
      setRocks((prev) => {
        // physics
        let nextState = prev.map((rock, i) => {
          if (!rock.isFalling) return rock;
          anyFalling = true;
          const others = prev.filter((_, j) => j !== i);
          const next = updateRockFall(rock, others, groundY);
          return next as UIRock;
        });
        // spring rotation with wrap-around and damping clamp
        nextState = nextState.map((r) => {
          const stiffness = ROT_STIFFNESS;
          const damping = ROT_DAMPING;
          const wrap = (v: number) => ((v % 360) + 360) % 360;
          const norm = (d: number) => {
            let x = ((d + 180) % 360 + 360) % 360 - 180;
            return x;
          };
          const current = wrap(r.rotationDisplayDeg);
          const target = wrap(r.rotationTargetDeg);
          const delta = norm(target - current);
          const accel = stiffness * delta - damping * r.rotationVel;
          const newVel = Math.max(-ROT_MAX_VEL, Math.min(ROT_MAX_VEL, r.rotationVel + accel * 16));
          const proposed = wrap(current + newVel);
          const newDelta = norm(target - proposed);
          if (Math.abs(delta) > 0.1 || Math.abs(newVel) > 0.1) anyRotating = true;
          // If we crossed past the target this frame, snap exactly to target and stop
          if (Math.sign(delta) !== Math.sign(newDelta)) {
            return { ...r, rotationDisplayDeg: target, rotationVel: 0 };
          }
          // If close enough and slow, snap to target
          if (Math.abs(newDelta) < 0.1 && Math.abs(newVel) < 0.1) {
            return { ...r, rotationDisplayDeg: target, rotationVel: 0 };
          }
          return { ...r, rotationDisplayDeg: proposed, rotationVel: newVel };
        });
        return nextState;
      });
      if (anyFalling || anyRotating || draggingId) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const resetToTray = () => {
    // Reposition all rocks back into their tray slots and stop motion
    setDraggingId(null);
    setSelectedRockId(null);
    setRocks((prev) =>
      prev.map((r) => {
        const sizePx = rockSizePx(r.size);
        const slotIndex = indexById.get(r.id) ?? 0;
        const snapPos = computeTraySlotPosition(slotIndex, sizePx);
        return { ...r, position: snapPos, isFalling: false, vy: 0, rotationDeg: 0 as Rotation };
      })
    );
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const rotateBy90 = (id: string | null) => {
    if (!id) return;
    setRocks((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              rotationDeg: (((r.rotationDeg + 90) % 360) as Rotation),
              rotation: (((r.rotation + 90) % 360) as Rotation),
              rotationTargetDeg: (((r.rotationTargetDeg + 90) % 360) as number),
              rotationVel: 0,
            }
          : r
      )
    );
    runAnimationLoop();
  };

  // Rotate currently selected rock helper (reserved for future bindings)
  // const rotateSelected = () => rotateBy90(selectedRockId);

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
    // keep calculation comment for future responsive rows (no variable to avoid lint warnings)
    const rawX = rightEdge - pileCardPadding - (slotIndex + 1) * SLOT_WIDTH + (SLOT_WIDTH - sizePx) / 2;
    const rawY = top + pileCardPadding + labelHeight + 4; // align near top inside tray
    const minX = left + pileCardPadding;
    const maxX = rightEdge - pileCardPadding - sizePx;
    const minY = top + pileCardPadding + labelHeight;
    const maxY = top + pileRect.height - pileCardPadding - sizePx;
    const x = clamp(rawX, minX, Math.max(minX, maxX));
    const y = clamp(rawY, minY, Math.max(minY, maxY));
    return { x, y };
  };

  const endDrag = () => {
    if (draggingId) {
      const rock = rocks.find((r) => r.id === draggingId);
      const pileRect = pileRef.current?.getBoundingClientRect();
      const stackRect = stackRef.current?.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (rock && pileRect && containerRect) {
        const sizePx = rockSizePx(rock.size);
        const tray = {
          left: pileRect.left - containerRect.left,
          top: pileRect.top - containerRect.top,
          right: pileRect.left - containerRect.left + pileRect.width,
          bottom: pileRect.top - containerRect.top + pileRect.height,
        };
        const stack = stackRect
          ? {
              left: stackRect.left - containerRect.left,
              top: stackRect.top - containerRect.top,
              right: stackRect.left - containerRect.left + stackRect.width,
              bottom: stackRect.top - containerRect.top + stackRect.height,
            }
          : null;
        const rr = {
          left: rock.position.x,
          top: rock.position.y,
          right: rock.position.x + sizePx,
          bottom: rock.position.y + sizePx,
        };
        const overlaps = !(rr.left > tray.right || rr.right < tray.left || rr.top > tray.bottom || rr.bottom < tray.top);
        const overlapsStack = stack
          ? !(rr.left > stack.right || rr.right < stack.left || rr.top > stack.bottom || rr.bottom < stack.top)
          : false;
        if (overlaps) {
          const slotIndex = indexById.get(rock.id) ?? 0;
          const snapPos = computeTraySlotPosition(slotIndex, sizePx);
          setRocks((prev) => prev.map((r) => (r.id === rock.id ? { ...r, position: snapPos, isFalling: false, vy: 0 } : r)));
        } else if (overlapsStack) {
          setRocks((prev) => prev.map((r) => (r.id === draggingId ? { ...r, isFalling: true, vy: 0 } : r)));
          runAnimationLoop();
        } else {
          // Not over tray or stack: revert to tray slot
          const slotIndex = indexById.get(rock.id) ?? 0;
          const snapPos = computeTraySlotPosition(slotIndex, sizePx);
          setRocks((prev) => prev.map((r) => (r.id === rock.id ? { ...r, position: snapPos, isFalling: false, vy: 0 } : r)));
        }
      }
    }
    setDraggingId(null);
  };

  const isSelected = (id: string) => selectedRockId === id;

  const levelData = getLevelData(levelNumber);

  // Keyboard: rotate while dragging (Space)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        if (draggingId) {
          e.preventDefault();
          rotateBy90(draggingId);
          runAnimationLoop();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draggingId]);

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
          className="absolute top-0 left-0 right-0 h-32 bg-beach-dark-rock pixel-border relative w-full"
        >
          <div ref={pileLabelRef} className="pixel-font text-[10px] text-beach-foam px-4 py-2">ROCK PILE</div>
          <Button
            onClick={resetToTray}
            className="absolute top-2 right-2 retro-button pixel-font text-beach-foam text-sm m-1 p-2"
          >
            <RotateCcw className="w-3 h-3" strokeWidth={3} />
            RESET
          </Button>
        </div>

       
        {/* Render Level 1 Rocks */}
        {rocks.map((r) => {
          const sizePx = rockSizePx(r.size);
          const transform = `translate(${r.position.x}px, ${r.position.y}px) rotate(${r.rotationDisplayDeg}deg)`;
          const isDragGhost = draggingId === r.id;
          const base = (
            <div
              key={r.id}
              className={`absolute ${rockColorClass(r.shape)} pixel-border cursor-pointer transition-transform duration-50`}
              style={{
                width: `${sizePx}px`,
                height: `${sizePx}px`,
                transform,
                transformOrigin: "center",
                zIndex: r.zIndex,
                opacity: isDragGhost ? 0.8 : 1,
                boxShadow: isSelected(r.id) ? "0 0 0 2px #c0f4ff" : undefined,
              }}
              onMouseDown={(e) => onMouseDownRock(e, r.id)}
              onClick={() => setSelectedRockId(isSelected(r.id) ? null : r.id)}
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  rotateBy90(r.id);
                }
              }}
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
                  className={`${rockColorClass(r.shape)} pixel-border transition-transform duration-50`}
                  style={{
                    width: `${sizePx}px`,
                    height: `${sizePx}px`,
                    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                    opacity: isDragGhost ? 0.8 : 1,
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
          style={{ outline: '3px solid #39ff14', outlineOffset: '-2px' }}
        >
          <div className="pixel-font text-[10px] text-beach-dark-rock px-2 py-1">STACK HERE</div>
        </div>
      </div>

      {/* Game Controls Panel */}
      <div className="bg-beach-foam p-3 md:p-4 pixel-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="pixel-font text-xs md:text-sm text-beach-dark-rock">
            Rotate while dragging: <span className="font-bold">Space</span> (PC) / <span className="font-bold">two-finger tap</span> (mobile)
          </div>
          <div className="w-full sm:w-auto">
            <Progress value={(rocks.length ? (rocks.filter(r => r.position.x > 320).length / 5) : 0) * 100} className="h-2" />
          </div>
        </div>
      </div>

      {/* Subtle water bar */}
      <div className="absolute left-0 right-0 bottom-0 h-6 bg-beach-water opacity-70"></div>
      </div>
    </ScreenBorder>
  );
}
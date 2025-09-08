import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
// gsap no longer used for discrete landings; physics loop animates via position updates
import {
  Rotation,
  RockPoly,
  updatePhysics,
  toWorldPoly,
  stableOnMultiple,
} from "./physics/physics2d";
import { RockType } from "./levels/types";

interface RockInstance extends RockPoly {
  typeId: string; // base rock type id for tray counts
  drawW: number;
  drawH: number;
  dragging: boolean;
  targetRotation: Rotation;
  displayRotation: number;
  variantTheme?: "daytime" | "sunset";
}

const TRAY_H = 100; // canvas tray inside gameplay area (keep for MVP)
// (deprecated) post-landing tuning constants no longer used with physics loop

export interface RockStackingGameProps {
  types: RockType[];
  theme?: "daytime" | "sunset" | "mixed";
  paused?: boolean;
  onStateChange?: (state: {
    totalPlaced: number;
    staticCount: number;
    remainingTray: number;
    touchingGroundStatic: number;
    stackHeightPx: number;
  }) => void;
  themeColors?: { sky: string; water: string };
  onHorizonChange?: (pageY: number) => void;
  onStackTopChange?: (pageX: number, pageY: number) => void;
  onStackRightBaseChange?: (pageX: number, pageY: number) => void;
  onStackRightStepsChange?: (steps: { x: number; y: number }[]) => void;
}

export interface RockStackingGameHandle {
  reset: () => void;
  flushLeft: () => void;
}

const RockStackingGame = forwardRef<RockStackingGameHandle, RockStackingGameProps>(function RockStackingGame(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimsRef = useRef<{ cssWidth: number; cssHeight: number; dpr: number }>({ cssWidth: 0, cssHeight: 0, dpr: 1 });
  const [types, setTypes] = useState<RockType[]>([]);
  const [rocks, setRocks] = useState<RockInstance[]>([]);
  const imagesRef = useRef<Record<string, { img: HTMLImageElement; crop: { x: number; y: number; w: number; h: number } }>>({});
  const pausedRef = useRef<boolean>(false);
  useEffect(() => { pausedRef.current = !!props.paused; }, [props.paused]);
  const flushLeftRef = useRef<boolean>(false);
  // Eagerly import all sprite URLs at build time
  const spriteUrlMap = (import.meta as any).glob("../assets/rock_art/**/**.png", { eager: true, as: "url" }) as Record<string, string>;
  // Slight visual overscan so bitmaps appear to touch despite transparent borders
  // Increase and add a tiny render-only downward nudge for tighter stacks
  const SPRITE_OVERSCAN = 1.3; // world draw
  const TRAY_OVERSCAN = 1.04;   // tray preview
  const VISUAL_STACK_NUDGE_Y = 1.5; // px, render-only shift downward
  const dragRef = useRef<{ rock: RockInstance | null; offX: number; offY: number; secondFingerDown: boolean }>(
    { rock: null, offX: 0, offY: 0, secondFingerDown: false }
  );

  useEffect(() => {
    // initialize tray types from props; deep copy counts so we can mutate locally
    setTypes(props.types.map(t => ({ ...t, anchors: t.anchors.map(a => ({ ...a })) })));
  }, [props.types]);

  // Load sprite images for needed shapes/sizes based on theme
  useEffect(() => {
    const theme = props.theme ?? "daytime";
    const need = new Set<string>();
    for (const t of props.types) {
      const sprite = t.sprite ?? "rock";
      const size = t.size ?? "small";
      need.add(`${theme}_${sprite}_${size}`);
      if (theme === "mixed") {
        // preload both to avoid hitching
        need.add(`daytime_${sprite}_${size}`);
        need.add(`sunset_${sprite}_${size}`);
      }
    }
    const resolveUrl = (th: string, sp: string, sz: string): string | null => {
      const folder = sz === "large" ? "large" : "small";
      // small files omit _small in filename
      const file = sz === "large" ? `${th}_${sp}_large.png` : `${th}_${sp}.png`;
      const rel = `../assets/rock_art/${folder}/${file}`;
      return spriteUrlMap[rel] ?? null;
    };
    const imgs: Record<string, { img: HTMLImageElement; crop: { x: number; y: number; w: number; h: number } }> = {};
    let remaining = need.size;
    if (remaining === 0) return;
    need.forEach(key => {
      const [th, sp, sz] = key.split("_");
      const url = resolveUrl(th, sp, sz);
      if (!url) { remaining--; return; }
      const img = new Image();
      img.src = url;
      img.onload = () => {
        // compute opaque bounds (auto-crop) to remove transparent margins
        try {
          const w = img.naturalWidth; const h = img.naturalHeight;
          const off = document.createElement('canvas');
          off.width = w; off.height = h;
          const octx = off.getContext('2d');
          if (octx) {
            octx.drawImage(img, 0, 0);
            const data = octx.getImageData(0, 0, w, h).data;
            let minX = w, minY = h, maxX = -1, maxY = -1;
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const a = data[(y * w + x) * 4 + 3];
                if (a > 8) { // alpha threshold
                  if (x < minX) minX = x;
                  if (y < minY) minY = y;
                  if (x > maxX) maxX = x;
                  if (y > maxY) maxY = y;
                }
              }
            }
            const crop = (maxX >= minX && maxY >= minY)
              ? { x: minX, y: minY, w: (maxX - minX + 1), h: (maxY - minY + 1) }
              : { x: 0, y: 0, w, h };
            imgs[key] = { img, crop };
          } else {
            imgs[key] = { img, crop: { x: 0, y: 0, w, h } } as any;
          }
        } catch {
          imgs[key] = { img, crop: { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight } } as any;
        }
        remaining--;
        if (remaining === 0) imagesRef.current = imgs;
      };
      img.onerror = () => {
        remaining--;
        if (remaining === 0) imagesRef.current = imgs;
      };
    });
  }, [props.types, props.theme]);

  // Expose reset API to parent
  useImperativeHandle(ref, () => ({
    reset() {
      setRocks([]);
      setTypes(props.types.map(t => ({ ...t, anchors: t.anchors.map(a => ({ ...a })) })));
      flushLeftRef.current = false;
    },
    flushLeft() {
      flushLeftRef.current = true;
    }
  }), [props.types]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const skyColor = props.themeColors?.sky ?? (
      getComputedStyle(document.documentElement)
        .getPropertyValue('--beach-water')
        .trim() || '#4cb8c8'
    );
    const waterColor = props.themeColors?.water ?? (
      getComputedStyle(document.documentElement)
        .getPropertyValue('--beach-deep-water')
        .trim() || '#2f8585'
    );
    const muted =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--muted-foreground')
        .trim() || '#717182';
    const lastHorizonRef = { current: -1 } as { current: number };

    function ensureCanvasSize() {
      const cssWidth = canvas.clientWidth || 0;
      const cssHeight = canvas.clientHeight || 0;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      if (
        cssWidth !== dimsRef.current.cssWidth ||
        cssHeight !== dimsRef.current.cssHeight ||
        dpr !== dimsRef.current.dpr
      ) {
        dimsRef.current = { cssWidth, cssHeight, dpr };
        canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
        canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    function drawTray() {
      ctx.fillStyle = "#2b2b2b";
      ctx.fillRect(0, 0, dimsRef.current.cssWidth, TRAY_H);
      ctx.fillStyle = "#fff";
      ctx.font = "12px monospace";

      const slotW = 64, pad = 16, baseX = 16, y = 14;
      types.forEach((t, i) => {
        const x = baseX + i * (slotW + pad);
        ctx.fillStyle = "#3d3d3d";
        ctx.fillRect(x - 6, 6, slotW + 12, TRAY_H - 12);
        // Draw sprite preview proportional to target draw dims
        ctx.save();
        ctx.translate(x + slotW / 2, y + 26);
        const sprite = t.sprite ?? "rock";
        const size = t.size ?? "small";
        const theme = (props.theme && props.theme !== "mixed") ? props.theme : "daytime";
        const key = `${theme}_${sprite}_${size}`;
        const entry = imagesRef.current[key];
        if (entry) {
          const img = entry.img;
          const aw = Math.max(...t.anchors.map(a => a.x)) - Math.min(...t.anchors.map(a => a.x));
          const ah = Math.max(...t.anchors.map(a => a.y)) - Math.min(...t.anchors.map(a => a.y));
          const srcW = t.crop?.w ?? entry.crop.w;
          const srcH = t.crop?.h ?? entry.crop.h;
          // Base scale to fit within anchor bounds in the tray
          let scale = Math.min(aw / srcW, ah / srcH) * TRAY_OVERSCAN;
          // Apply the same tray scaling to wide large shapes so they fit comfortably
          if (size === "large" && (sprite === "rock" || sprite === "trapezoid" || sprite === "triangle")) {
            scale *= 0.75;
          }
          // Make all small-sized rocks appear smaller in the tray
          if (size === "small") {
            scale *= 0.8;
          }
          const w = srcW * scale;
          const h = srcH * scale;
          const sx = t.crop?.x ?? entry.crop.x;
          const sy = t.crop?.y ?? entry.crop.y;
          ctx.drawImage(img, sx, sy, srcW, srcH, -w / 2, -h / 2, w, h);
        } else {
        ctx.fillStyle = "#cfe8ff";
        ctx.beginPath();
        t.anchors.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = "#fff";
        // Removed rock name label
        ctx.fillText(`x${t.count}`, x + 4, TRAY_H - 16);
      });

      ctx.strokeStyle = "#444";
      ctx.beginPath();
      ctx.moveTo(0, TRAY_H + 0.5);
      ctx.lineTo(dimsRef.current.cssWidth, TRAY_H + 0.5);
      ctx.stroke();
    }

    function drawStackArea() {
      // Top band: sky
      const fy = floorY();
      const horizonY = Math.max(TRAY_H, fy - 100);
      ctx.fillStyle = skyColor;
      ctx.fillRect(0, TRAY_H, dimsRef.current.cssWidth, Math.max(0, horizonY - TRAY_H));
      // Middle strip: water
      ctx.fillStyle = waterColor;
      ctx.fillRect(0, horizonY, dimsRef.current.cssWidth, Math.max(0, fy - horizonY));
      // Bottom band: sand (muted-foreground, unchanged)
      ctx.fillStyle = muted;
      ctx.fillRect(0, fy + 1, dimsRef.current.cssWidth, Math.max(0, dimsRef.current.cssHeight - (fy + 1)));
    }

    function drawRocks() {
      for (const r of rocks) {
        ctx.save();
        // Apply full nudge for settled rocks; halve it while dragging for clarity
        const nudge = r.isStatic ? VISUAL_STACK_NUDGE_Y : VISUAL_STACK_NUDGE_Y * 0.5;
        ctx.translate(r.position.x, r.position.y + nudge);
        ctx.rotate((r.displayRotation * Math.PI) / 180);
        const type = types.find(t => t.id === r.typeId);
        const sprite = type?.sprite ?? "rock";
        const size = type?.size ?? "small";
        const effectiveTheme = r.variantTheme ?? (props.theme === "mixed" ? "daytime" : (props.theme ?? "daytime"));
        const key = `${effectiveTheme}_${sprite}_${size}`;
        const entry = imagesRef.current[key];
        if (entry) {
          const img = entry.img;
          const aw = Math.max(...r.anchors.map(a => a.x)) - Math.min(...r.anchors.map(a => a.x));
          const ah = Math.max(...r.anchors.map(a => a.y)) - Math.min(...r.anchors.map(a => a.y));
          const srcW = type?.crop?.w ?? entry.crop.w;
          const srcH = type?.crop?.h ?? entry.crop.h;
          const scale = Math.min(aw / srcW, ah / srcH) * SPRITE_OVERSCAN;
          const w = srcW * scale;
          const h = srcH * scale;
          const sx = type?.crop?.x ?? entry.crop.x;
          const sy = type?.crop?.y ?? entry.crop.y;
          ctx.drawImage(img, sx, sy, srcW, srcH, -w / 2, -h / 2, w, h);
        } else {
          // fallback to polygon fill
        ctx.fillStyle = "#ffd27f";
        ctx.beginPath();
        r.anchors.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        }
        ctx.restore();
      }

      if (dragRef.current.rock) {
        const r = dragRef.current.rock;
        ctx.save();
        ctx.translate(r.position.x, r.position.y + VISUAL_STACK_NUDGE_Y * 0.5);
        ctx.rotate((r.displayRotation * Math.PI) / 180);
        ctx.globalAlpha = 0.95;
        const type = types.find(t => t.id === r.typeId) as any;
        const sprite = type?.sprite ?? "rock";
        const size = type?.size ?? "small";
        const effectiveTheme = r.variantTheme ?? (props.theme === "mixed" ? "daytime" : (props.theme ?? "daytime"));
        const key = `${effectiveTheme}_${sprite}_${size}`;
        const entry = imagesRef.current[key];
        if (entry) {
          const img = entry.img;
          const aw = Math.max(...r.anchors.map(a => a.x)) - Math.min(...r.anchors.map(a => a.x));
          const ah = Math.max(...r.anchors.map(a => a.y)) - Math.min(...r.anchors.map(a => a.y));
          const srcW = type?.crop?.w ?? entry.crop.w;
          const srcH = type?.crop?.h ?? entry.crop.h;
          const scale = Math.min(aw / srcW, ah / srcH) * SPRITE_OVERSCAN;
          const w = srcW * scale;
          const h = srcH * scale;
          const sx = type?.crop?.x ?? entry.crop.x;
          const sy = type?.crop?.y ?? entry.crop.y;
          ctx.drawImage(img, sx, sy, srcW, srcH, -w / 2, -h / 2, w, h);
        } else {
        ctx.fillStyle = "#ffe5a3";
        ctx.beginPath();
        r.anchors.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    function render() {
      ensureCanvasSize();
      ctx.clearRect(0, 0, dimsRef.current.cssWidth, dimsRef.current.cssHeight);
      drawTray();
      drawStackArea();

      // Lightweight physics step per frame
      const ground = floorY();
      // Report horizon to parent in viewport coordinates
      if (props.onHorizonChange) {
        const canvasTop = canvas.getBoundingClientRect().top;
        const horizonLocal = Math.max(TRAY_H, ground - 100);
        const horizonPage = canvasTop + horizonLocal;
        if (Math.abs(horizonPage - lastHorizonRef.current) >= 1) {
          lastHorizonRef.current = horizonPage;
          props.onHorizonChange(horizonPage);
        }
      }
      if (!pausedRef.current) {
        const settledList = rocks.filter(r => r.isStatic && !r.dragging);
        rocks.forEach(r => {
          if (!r.dragging && !r.isStatic) {
            updatePhysics(r, settledList, ground);
          }
        });
      }

      // If flush-left is active, force all rocks to become dynamic and surge left
      if (flushLeftRef.current) {
        rocks.forEach(r => {
          r.isStatic = false;
          r.velocity = r.velocity || { x: 0, y: 0 };
          // strong left push and slight downward pull to ensure ground contact
          r.velocity.x = Math.min(r.velocity.x, -8);
          r.velocity.y += 0.8;
        });
      }

      rocks.forEach((r) => {
        r.displayRotation += (r.targetRotation - r.displayRotation) * 0.25;
      });
      if (dragRef.current.rock) {
        const r = dragRef.current.rock;
        r.displayRotation += (r.targetRotation - r.displayRotation) * 0.25;
      }

      drawRocks();

      // Report game state upward each frame if requested
      if (props.onStateChange) {
        const settledStatics = rocks.filter(r => r.isStatic && !r.dragging);
        const touchingGroundStatic = settledStatics.filter(r => {
          const pts = toWorldPoly(r);
          const lowestY = Math.max(...pts.map(p => p.y));
          return Math.abs(lowestY - ground) <= 1.0;
        }).length;
        const staticCount = settledStatics.length;
        const totalPlaced = rocks.length;
        const remainingTray = types.reduce((acc, t) => acc + (t.count || 0), 0);
        // Compute stack height as distance from floor to highest top of any settled static rock
        let stackHeightPx = 0;
        let topPageX: number | null = null;
        let topPageY: number | null = null;
        let rightBasePageX: number | null = null;
        let rightBasePageY: number | null = null;
        let rightSteps: { x: number; y: number }[] = [];
        if (settledStatics.length > 0) {
          let bestMinY = Infinity;
          let bestRock: typeof settledStatics[number] | null = null;
          let rightMostX = -Infinity;
          for (const r of settledStatics) {
            const pts = toWorldPoly(r);
            const minY = Math.min(...pts.map(p => p.y));
            if (minY < bestMinY) { bestMinY = minY; bestRock = r; }
            const maxX = Math.max(...pts.map(p => p.x));
            if (maxX > rightMostX) rightMostX = maxX;
          }
          const minTopY = bestMinY;
          stackHeightPx = Math.max(0, ground - minTopY);
          if (bestRock) {
            const pts = toWorldPoly(bestRock);
            const topY = Math.min(...pts.map(p => p.y));
            const nearTop = pts.filter(p => Math.abs(p.y - topY) <= 0.5);
            const avgX = nearTop.length > 0
              ? nearTop.reduce((a, b) => a + b.x, 0) / nearTop.length
              : (Math.min(...pts.map(p => p.x)) + Math.max(...pts.map(p => p.x))) / 2;
            const rect = canvas.getBoundingClientRect();
            topPageX = rect.left + avgX;
            topPageY = rect.top + topY;
            if (isFinite(rightMostX)) {
              rightBasePageX = rect.left + rightMostX;
              rightBasePageY = rect.top + ground;
            }
            // build right-edge hop steps along rocks whose right edge is near global rightMostX
            const TOL_X = 6; // px
            const candidates = settledStatics.map(rock => ({ pts: toWorldPoly(rock) }));
            const nearRight = candidates
              .map(({ pts }) => ({
                topY: Math.min(...pts.map(p => p.y)),
                rightX: Math.max(...pts.map(p => p.x)),
              }))
              .filter(v => Math.abs(v.rightX - rightMostX) <= TOL_X)
              .sort((a, b) => b.topY - a.topY); // bottom to top (larger y means lower on screen)
            rightSteps = nearRight.map(v => ({ x: rect.left + v.rightX, y: rect.top + v.topY }));
          }
        }
        props.onStateChange({ totalPlaced, staticCount, remainingTray, touchingGroundStatic, stackHeightPx });
        if (props.onStackTopChange && topPageX !== null && topPageY !== null) {
          props.onStackTopChange(topPageX, topPageY);
        }
        if (props.onStackRightBaseChange && rightBasePageX !== null && rightBasePageY !== null) {
          props.onStackRightBaseChange(rightBasePageX, rightBasePageY);
        }
        if (props.onStackRightStepsChange && rightSteps.length > 0) {
          props.onStackRightStepsChange(rightSteps);
        }
      }
      requestAnimationFrame(render);
    }
    render();
    const onResize = () => ensureCanvasSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [types, rocks]);

  // worldPolyOf helper no longer needed; use toWorldPoly directly when necessary

  // intersectsAny unused with continuous physics; broad-phase handled implicitly in updatePhysics

  function floorY() {
    return Math.max(0, dimsRef.current.cssHeight - 20);
  }

  // computeRestingY no longer used; physics loop decides resting dynamically

  // computeDiagonalLanding not used with continuous physics

  // Chain-reaction recheck is now handled implicitly by updatePhysics interacting each frame.

  // supportBandWidth not used with continuous physics

  function pickTrayIndex(x: number): number {
    const slotW = 64, pad = 16, baseX = 16;
    for (let i = 0; i < types.length; i++) {
      const x0 = baseX + i * (slotW + pad) - 6;
      const x1 = x0 + slotW + 12;
      if (x >= x0 && x <= x1) return i;
    }
    return -1;
  }

  function spawnFromType(rt: RockType, x: number, y: number): RockInstance {
    return {
      id: rt.id + "_" + Math.random().toString(36).slice(2),
      typeId: rt.id,
      anchors: rt.anchors,
      rotation: 0,
      position: { x, y },
      drawW: rt.drawW,
      drawH: rt.drawH,
      dragging: true,
      targetRotation: 0,
      displayRotation: 0,
      variantTheme: props.theme === "mixed" ? (Math.random() < 0.5 ? "daytime" : "sunset") : undefined,
    };
  }

  function screenToCanvasPos(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
    }

  // Find supports directly under a rock among the given candidates using
  // vertical adjacency and horizontal overlap (aligned with physics heuristics)
  function findDirectSupports(top: RockInstance, candidates: RockInstance[]): RockInstance[] {
    const topPts = toWorldPoly(top);
    const rBottom = Math.max(...topPts.map(p => p.y));
    const rMinX = Math.min(...topPts.map(p => p.x));
    const rMaxX = Math.max(...topPts.map(p => p.x));
    const CONTACT_Y_EPS = 2.0;
    const supports: RockInstance[] = [];
    for (const s of candidates) {
      if (s === top) continue;
      const sPts = toWorldPoly(s);
      const sTop = Math.min(...sPts.map(p => p.y));
      const sMinX = Math.min(...sPts.map(p => p.x));
      const sMaxX = Math.max(...sPts.map(p => p.x));
      const horizOverlap = !(rMinX > sMaxX || rMaxX < sMinX);
      const verticalAdj = Math.abs(sTop - rBottom) <= CONTACT_Y_EPS;
      if (horizOverlap && verticalAdj) supports.push(s);
    }
    return supports;
  }

  // When a settled rock is picked up, re-evaluate rocks above it and unsettle
  // any that are no longer stable given remaining supports. Propagate upward.
  function cascadeUnsettle(dragged: RockInstance) {
    const settled = rocks.filter(r => r.isStatic && r !== dragged && !r.dragging);
    const queue: RockInstance[] = [];
    // Seed with rocks that directly relied on the dragged rock
    for (const r of settled) {
      const supports = findDirectSupports(r, settled.concat(dragged));
      if (supports.includes(dragged)) queue.push(r);
    }

    const visited = new Set<string>();
    while (queue.length > 0) {
      const r = queue.shift()!;
      if (visited.has(r.id)) continue;
      visited.add(r.id);

      const currentSettled = rocks.filter(x => x.isStatic && x !== dragged && x !== r && !x.dragging);
      const supports = findDirectSupports(r, currentSettled);
      const stillStable = supports.length > 0 && stableOnMultiple(r, supports, { tolerancePx: 0 });
      if (!stillStable) {
        r.isStatic = false;
        r.velocity = r.velocity || { x: 0, y: 0 };
        // Any rocks that directly rely on r should be reconsidered
        for (const up of currentSettled) {
          const sup = findDirectSupports(up, currentSettled.concat(r));
          if (sup.includes(r)) queue.push(up);
        }
      }
    }
    }

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas || types.length === 0) return;

    const onDown = (clientX: number, clientY: number, touchCount = 1) => {
      if (pausedRef.current) return;
      const pos = screenToCanvasPos(canvas, clientX, clientY);
      if (pos.y < TRAY_H) {
        const idx = pickTrayIndex(pos.x);
        if (idx >= 0) {
          const rt = types[idx];
          if (rt.count > 0) {
            const inst = spawnFromType(rt, pos.x, pos.y);
            setRocks((r) => [...r, inst]);
            setTypes((ts) => ts.map((t, i) => (i === idx ? { ...t, count: t.count - 1 } : t)));
            dragRef.current.rock = inst;
            dragRef.current.offX = 0; dragRef.current.offY = 0;
            dragRef.current.secondFingerDown = touchCount >= 2;
            return;
          }
        }
      }

      const pick = [...rocks].reverse().find((r) => {
        return (
          Math.abs(pos.x - r.position.x) <= r.drawW * 0.6 &&
          Math.abs(pos.y - r.position.y) <= r.drawH * 0.6
        );
      });
      if (pick) {
        const wasStatic = !!pick.isStatic;
        pick.dragging = true;
        dragRef.current.rock = pick;
        dragRef.current.offX = pos.x - pick.position.x;
        dragRef.current.offY = pos.y - pick.position.y;
        dragRef.current.secondFingerDown = touchCount >= 2;
        if (wasStatic) {
          // Remove as support and trigger cascade re-evaluation
          pick.isStatic = false;
          cascadeUnsettle(pick);
        }
      }
    };

    const onMove = (clientX: number, clientY: number) => {
      if (pausedRef.current) return;
      const dr = dragRef.current.rock;
      if (!dr) return;
      const pos = screenToCanvasPos(canvas, clientX, clientY);
      dr.position.x = pos.x - dragRef.current.offX;
      dr.position.y = pos.y - dragRef.current.offY;
    };

    const onUp = (clientX: number, clientY: number) => {
      if (pausedRef.current) return;
      const dr = dragRef.current.rock;
      if (!dr) return;
      dr.dragging = false;
      const pos = screenToCanvasPos(canvas, clientX, clientY);

      if (pos.y < TRAY_H) {
        setRocks((rs) => rs.filter((r) => r !== dr));
        setTypes((ts) => ts.map((t) => (t.id === dr.typeId ? { ...t, count: t.count + 1 } : t)));
      } else {
        // Start physics-based fall
        dr.isStatic = false;
        dr.velocity = dr.velocity || { x: 0, y: 0 };
      }

      dragRef.current.rock = null;
      dragRef.current.secondFingerDown = false;
    };

    const mousedown = (e: MouseEvent) => onDown(e.clientX, e.clientY, 1);
    const mousemove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const mouseup = (e: MouseEvent) => onUp(e.clientX, e.clientY);

    const touchstart = (e: TouchEvent) => {
      onDown(e.touches[0].clientX, e.touches[0].clientY, e.touches.length);
      if (dragRef.current.rock && e.touches.length === 2 && !dragRef.current.secondFingerDown) {
        rotateDragging(90);
        dragRef.current.secondFingerDown = true;
      }
    };
    const touchmove = (e: TouchEvent) => onMove(e.touches[0].clientX, e.touches[0].clientY);
    const touchend = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      onUp(t.clientX, t.clientY);
    };

    const keydown = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      if (e.code === "Space" && dragRef.current.rock) {
        e.preventDefault();
        rotateDragging(90);
      }
    };

    function rotateDragging(delta: 90 | -90) {
      const dr = dragRef.current.rock!;
      const next = (((dr.rotation + delta + 360) % 360) as Rotation);
      dr.rotation = next;
      dr.targetRotation = next;
    }

    canvas.addEventListener("mousedown", mousedown);
    canvas.addEventListener("mousemove", mousemove);
    canvas.addEventListener("mouseup", mouseup);

    canvas.addEventListener("touchstart", touchstart, { passive: true } as any);
    canvas.addEventListener("touchmove", touchmove, { passive: true } as any);
    canvas.addEventListener("touchend", touchend);

    window.addEventListener("keydown", keydown);

    return () => {
      canvas.removeEventListener("mousedown", mousedown);
      canvas.removeEventListener("mousemove", mousemove);
      canvas.removeEventListener("mouseup", mouseup);

      canvas.removeEventListener("touchstart", touchstart);
      canvas.removeEventListener("touchmove", touchmove);
      canvas.removeEventListener("touchend", touchend);

      window.removeEventListener("keydown", keydown);
    };
  }, [types, rocks]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
});

export default RockStackingGame;



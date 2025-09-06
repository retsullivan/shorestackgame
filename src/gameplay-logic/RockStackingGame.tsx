import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  Rotation,
  Point,
  AnchorPoint,
  RockPoly,
  toWorldPoly,
  polygonsIntersectSAT,
  aabb,
  stableOn,
} from "./physics/physics2d";

interface RockType {
  id: string;
  anchors: AnchorPoint[];
  count: number;
  drawW: number;
  drawH: number;
}

interface RockInstance extends RockPoly {
  typeId: string; // base rock type id for tray counts
  drawW: number;
  drawH: number;
  dragging: boolean;
  targetRotation: Rotation;
  displayRotation: number;
}

const TRAY_H = 110; // canvas tray inside gameplay area (keep for MVP)

function makeTypes(): RockType[] {
  return [
    {
      id: "quad_square_small",
      anchors: [
        { x: -16, y: -16 },
        { x: 16, y: -16 },
        { x: 16, y: 16 },
        { x: -16, y: 16 },
      ],
      count: 6,
      drawW: 32,
      drawH: 32,
    },
    {
      id: "quad_rect_large",
      anchors: [
        { x: -28, y: -16 },
        { x: 28, y: -16 },
        { x: 28, y: 16 },
        { x: -28, y: 16 },
      ],
      count: 4,
      drawW: 56,
      drawH: 32,
    },
    {
      id: "tri_iso_medium",
      anchors: [
        { x: -22, y: 16 },
        { x: 22, y: 16 },
        { x: 0, y: -18 },
      ],
      count: 5,
      drawW: 44,
      drawH: 34,
    },
  ];
}

export default function RockStackingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimsRef = useRef<{ cssWidth: number; cssHeight: number; dpr: number }>({ cssWidth: 0, cssHeight: 0, dpr: 1 });
  const [types, setTypes] = useState<RockType[]>([]);
  const [rocks, setRocks] = useState<RockInstance[]>([]);
  const dragRef = useRef<{ rock: RockInstance | null; offX: number; offY: number; secondFingerDown: boolean }>(
    { rock: null, offX: 0, offY: 0, secondFingerDown: false }
  );

  useEffect(() => {
    const t = makeTypes();
    setTypes(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const deepWater =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--beach-deep-water')
        .trim() || '#2f8585';
    const water =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--beach-water')
        .trim() || '#4cb8c8';
    const muted =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--muted-foreground')
        .trim() || '#717182';

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
        // Draw polygon preview
        ctx.save();
        ctx.translate(x + slotW / 2, y + 26);
        ctx.fillStyle = "#cfe8ff";
        ctx.beginPath();
        t.anchors.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
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
      // Top band: beach-water
      const fy = floorY();
      ctx.fillStyle = water;
      ctx.fillRect(0, TRAY_H, dimsRef.current.cssWidth, Math.max(0, fy - 20 - TRAY_H));
      // Middle strip: deep-water
      ctx.fillStyle = deepWater;
      ctx.fillRect(0, Math.max(TRAY_H, fy - 20), dimsRef.current.cssWidth, 20);
      // Bottom band: muted-foreground
      ctx.fillStyle = muted;
      ctx.fillRect(0, fy + 1, dimsRef.current.cssWidth, Math.max(0, dimsRef.current.cssHeight - (fy + 1)));
    }

    function drawRocks() {
      for (const r of rocks) {
        ctx.save();
        ctx.translate(r.position.x, r.position.y);
        ctx.rotate((r.displayRotation * Math.PI) / 180);
        ctx.fillStyle = "#ffd27f";
        ctx.beginPath();
        r.anchors.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (dragRef.current.rock) {
        const r = dragRef.current.rock;
        ctx.save();
        ctx.translate(r.position.x, r.position.y);
        ctx.rotate((r.displayRotation * Math.PI) / 180);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#ffe5a3";
        ctx.beginPath();
        r.anchors.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    function render() {
      ensureCanvasSize();
      ctx.clearRect(0, 0, dimsRef.current.cssWidth, dimsRef.current.cssHeight);
      drawTray();
      drawStackArea();

      rocks.forEach((r) => {
        r.displayRotation += (r.targetRotation - r.displayRotation) * 0.25;
      });
      if (dragRef.current.rock) {
        const r = dragRef.current.rock;
        r.displayRotation += (r.targetRotation - r.displayRotation) * 0.25;
      }

      drawRocks();
      requestAnimationFrame(render);
    }
    render();
    const onResize = () => ensureCanvasSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [types, rocks]);

  function worldPolyOf(r: RockInstance): Point[] {
    return toWorldPoly(r);
  }

  function intersectsAny(r: RockInstance, ignore?: RockInstance): RockInstance | null {
    const pw = worldPolyOf(r);
    const box = aabb(pw);
    for (const o of rocks) {
      if (o === r || o === ignore) continue;
      const ow = worldPolyOf(o);
      const bb = aabb(ow);
      if (box.maxX < bb.minX || box.minX > bb.maxX || box.maxY < bb.minY || box.minY > bb.maxY) {
        continue;
      }
      if (polygonsIntersectSAT(pw, ow)) return o;
    }
    return null;
  }

  function floorY() {
    return Math.max(0, dimsRef.current.cssHeight - 20);
  }

  function computeRestingY(r: RockInstance): { y: number; support: RockInstance | null } {
    const startY = r.position.y;
    const maxY = floorY();
    const tmp: RockInstance = { ...r };
    for (let y = startY; y <= maxY; y += 1) {
      tmp.position = { x: r.position.x, y };
      // Ignore self by passing the original reference
      const hit = intersectsAny(tmp, r);
      if (hit) {
        return { y: y - 1, support: hit };
      }
    }
    return { y: maxY, support: null };
  }

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
    };
  }

  function screenToCanvasPos(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
    }

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas || types.length === 0) return;

    const onDown = (clientX: number, clientY: number, touchCount = 1) => {
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
        pick.dragging = true;
        dragRef.current.rock = pick;
        dragRef.current.offX = pos.x - pick.position.x;
        dragRef.current.offY = pos.y - pick.position.y;
        dragRef.current.secondFingerDown = touchCount >= 2;
      }
    };

    const onMove = (clientX: number, clientY: number) => {
      const dr = dragRef.current.rock;
      if (!dr) return;
      const pos = screenToCanvasPos(canvas, clientX, clientY);
      dr.position.x = pos.x - dragRef.current.offX;
      dr.position.y = pos.y - dragRef.current.offY;
    };

    const onUp = (clientX: number, clientY: number) => {
      const dr = dragRef.current.rock;
      if (!dr) return;
      dr.dragging = false;
      const pos = screenToCanvasPos(canvas, clientX, clientY);

      if (pos.y < TRAY_H) {
        setRocks((rs) => rs.filter((r) => r !== dr));
        setTypes((ts) => ts.map((t) => (t.id === dr.typeId ? { ...t, count: t.count + 1 } : t)));
      } else {
        const { y: restY, support } = computeRestingY(dr);
        gsap.to(dr.position, { y: restY, duration: 0.35, ease: "power2.in" });
        gsap.to(dr.position, {
          y: restY + 4,
          duration: 0.12,
          ease: "power1.out",
          yoyo: true,
          repeat: 1,
          delay: 0.35,
        });

        const checkAfter = () => {
          if (!support) return;
          const tolerance = 2;
          const isStable = stableOn(dr, support, tolerance);
          if (!isStable) {
            const topC = toWorldPoly(dr).reduce(
              (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
              { x: 0, y: 0 }
            );
            topC.x /= dr.anchors.length; topC.y /= dr.anchors.length;

            const supPoly = toWorldPoly(support);
            const supC = supPoly.reduce(
              (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
              { x: 0, y: 0 }
            );
            supC.x /= supPoly.length; supC.y /= supPoly.length;

            const dir = Math.sign(topC.x - supC.x) || 1;
            const slideX = dir * 60;
            const newTarget: Rotation = (((((dr.rotation + (dir > 0 ? 90 : 270)) % 360) + 360) % 360) as Rotation);
            dr.rotation = newTarget;
            dr.targetRotation = newTarget;

            gsap.to(dr.position, { x: dr.position.x + slideX, duration: 0.4, ease: "power2.in" });
            gsap.to(dr.position, { y: floorY(), duration: 0.6, ease: "power2.in" });
          }
        };
        setTimeout(checkAfter, 520);
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
}



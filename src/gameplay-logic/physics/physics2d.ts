// Lightweight 2D geometry helpers and SAT collision utilities

import { getConfig } from "./stabilityConfig";
import gsap from "gsap";

export type Rotation = 0 | 90 | 180 | 270;

export interface Point { x: number; y: number; }

export interface AnchorPoint extends Point { weight?: number; }

export interface RockPoly {
  id: string;
  anchors: AnchorPoint[]; // local-space convex polygon (CW or CCW)
  rotation: Rotation; // multiples of 90°
  position: { x: number; y: number }; // world translation
  // Lightweight physics state (optional)
  velocity?: { x: number; y: number };
  isStatic?: boolean;
  isTipping?: boolean;
  tipCooldown?: number; // frames to wait before allowing another tip
}

export function rotatePoint90(p: Point, rot: Rotation): Point {
  const { x, y } = p;
  switch (rot) {
    case 90:  return { x: -y, y: x };
    case 180: return { x: -x, y: -y };
    case 270: return { x: y,  y: -x };
    default:  return p;
  }
}

export function toWorldPoly(rock: RockPoly): Point[] {
  return rock.anchors.map(a => {
    const r = rotatePoint90(a, rock.rotation);
    return { x: r.x + rock.position.x, y: r.y + rock.position.y };
  });
}

// ---------- SAT utilities ----------
function edges(poly: Point[]): Point[] {
  const e: Point[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    e.push({ x: b.x - a.x, y: b.y - a.y });
  }
  return e;
}

function perp(v: Point): Point { return { x: -v.y, y: v.x }; }

function dot(a: Point, b: Point): number { return a.x * b.x + a.y * b.y; }

function project(poly: Point[], axis: Point): { min: number; max: number } {
  let min = dot(poly[0], axis);
  let max = min;
  for (let i = 1; i < poly.length; i++) {
    const d = dot(poly[i], axis);
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { min, max };
}

export function polygonsIntersectSAT(a: Point[], b: Point[]): boolean {
  const axes: Point[] = [...edges(a), ...edges(b)].map(perp);
  for (const axis of axes) {
    const len = Math.hypot(axis.x, axis.y) || 1;
    const n = { x: axis.x / len, y: axis.y / len };
    const pa = project(a, n);
    const pb = project(b, n);
    if (pa.max < pb.min || pb.max < pa.min) return false;
  }
  return true;
}

export function aabb(poly: Point[]) {
  let minX = poly[0].x, maxX = poly[0].x, minY = poly[0].y, maxY = poly[0].y;
  for (let i = 1; i < poly.length; i++) {
    const p = poly[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

// ---------- Centroid / stability ----------
export function getWeightedCentroid(points: AnchorPoint[]): Point {
  let wsum = 0, sx = 0, sy = 0;
  for (const p of points) {
    const w = p.weight ?? 1;
    wsum += w; sx += p.x * w; sy += p.y * w;
  }
  if (wsum === 0) return { x: 0, y: 0 };
  return { x: sx / wsum, y: sy / wsum };
}

export function pointInsidePolygon(point: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = (yi > point.y) !== (yj > point.y) &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function stableOn(top: RockPoly, support: RockPoly, tolerancePx = 0): boolean {
  const cfg = getConfig();
  // Compute centroid of the top rock in world coordinates
  const topWorld = toWorldPoly(top).map((p, i) => {
    const w = top.anchors[i]?.weight ?? 1;
    return { ...p, weight: w } as AnchorPoint;
  });
  const centroid = getWeightedCentroid(topWorld);

  // Determine the bottom contact span of the top rock (its lowest edge/points)
  const eps = 2; // px tolerance when finding bottom edge
  const topPoints = toWorldPoly(top);
  const topBottomY = Math.max(...topPoints.map((p) => p.y));
  const bottomEdgePoints = topPoints.filter((p) => p.y >= topBottomY - eps);
  // If shape ends in a single point (e.g., triangle tip), width ~ 0
  const topMinX = Math.min(...bottomEdgePoints.map((p) => p.x));
  const topMaxX = Math.max(...bottomEdgePoints.map((p) => p.x));
  const topBaseWidth = Math.max(0, topMaxX - topMinX);

  // Approximate the support surface as its upper band
  const supportWorld = toWorldPoly(support);
  const supMinY = Math.min(...supportWorld.map((p) => p.y));
  const bandHeight = 4; // stricter: thinner top surface band
  const supportBandPoints = supportWorld.filter((p) => p.y <= supMinY + bandHeight);
  if (supportBandPoints.length === 0) return false;
  const supMinX = Math.min(...supportBandPoints.map((p) => p.x));
  const supMaxX = Math.max(...supportBandPoints.map((p) => p.x));
  const supBandWidth = Math.max(0, supMaxX - supMinX);

  // Overlap span in X between top bottom edge and support surface band
  const overlapMinX = Math.max(topMinX, supMinX);
  const overlapMaxX = Math.min(topMaxX, supMaxX);
  const overlapWidth = Math.max(0, overlapMaxX - overlapMinX);

  // Minimum required overlap to consider balanced (prevents tip-on-point balancing)
  // Disallow balancing on sharp points: require a meaningful support width
  if (supBandWidth < 12) return false; // disallow very narrow supports

  // Require overlap relative to the top base width, tunable by difficulty
  const minRequired = Math.max(12, topBaseWidth * cfg.minOverlapRatio);

  // Centroid projection must fall within the overlap span (with tolerance)
  const centroidOverlaps = centroid.x >= (overlapMinX - tolerancePx) && centroid.x <= (overlapMaxX + tolerancePx);

  // Also require the bottom edge midpoint to lie over the overlap (prevents tip balancing)
  const midX = (topMinX + topMaxX) * 0.5;
  const midpointOverlaps = midX >= (overlapMinX - tolerancePx) && midX <= (overlapMaxX + tolerancePx);
  const aboveSurface = centroid.y <= (supMinY + bandHeight);
  // Extra guard: if the centroid is substantially above the contact line but overlap is tiny, treat as unstable to avoid vertical sticking
  if (overlapWidth < 12 && centroid.y < supMinY - 8) return false;

  // Stricter: rectangle (quad) on triangle tip — forbid when support band is too narrow
  const isTopQuad = top.anchors.length === 4;
  const isSupportTri = support.anchors.length === 3;
  if (isTopQuad && isSupportTri) {
    if (!cfg.allowRectOnTriangle) return false;
    if (topBaseWidth > 20 && supBandWidth < topBaseWidth * 0.33) return false;
  }

  // Special-case triangle point-down: require strong base support and optionally flat support
  const isTopTri = top.anchors.length === 3;
  if (isTopTri) {
    const topYs = topWorld.map(p => p.y);
    const baseY = Math.max(...topYs);
    const tipY = Math.min(...topYs);
    const isPointDown = tipY > baseY - 6; // crude heuristic
    if (isPointDown) {
      if (cfg.requireFlatSupportForTip && support.anchors.length !== 4) return false;
      const tipTolerance = Math.max(0.9, cfg.triangleTipTolerance);
      if (overlapWidth < topBaseWidth * tipTolerance) return false;
    }
  }

  return overlapWidth >= minRequired && centroidOverlaps && midpointOverlaps && aboveSurface;
}

// Multi-support stability: allow a top rock to be supported by several neighbors
export function stableOnMultiple(top: RockPoly, supports: RockPoly[], options?: { tolerancePx?: number }): boolean {
  const tolerancePx = options?.tolerancePx ?? 0;
  const cfg = getConfig();

  // Top rock bottom edge span
  const eps = 2;
  const topPts = toWorldPoly(top);
  const topBottomY = Math.max(...topPts.map((p) => p.y));
  const bottomEdgePts = topPts.filter((p) => p.y >= topBottomY - eps);
  const topMinX = Math.min(...bottomEdgePts.map((p) => p.x));
  const topMaxX = Math.max(...bottomEdgePts.map((p) => p.x));
  const topBaseWidth = Math.max(0, topMaxX - topMinX);

  // Build union of support top-band intervals
  const bandHeight = 4;
  const intervals: Array<{ l: number; r: number; w: number }> = [];
  for (const s of supports) {
    const pts = toWorldPoly(s);
    const minY = Math.min(...pts.map((p) => p.y));
    const band = pts.filter((p) => p.y <= minY + bandHeight);
    if (band.length === 0) continue;
    const l = Math.min(...band.map((p) => p.x));
    const r = Math.max(...band.map((p) => p.x));
    const w = Math.max(0, r - l);
    if (w < 12) continue; // discard very narrow supports
    intervals.push({ l, r, w });
  }
  if (intervals.length === 0) return false;
  intervals.sort((a, b) => a.l - b.l);
  const merged: Array<{ l: number; r: number }> = [];
  for (const iv of intervals) {
    if (merged.length === 0 || iv.l > merged[merged.length - 1].r) {
      merged.push({ l: iv.l, r: iv.r });
    } else {
      merged[merged.length - 1].r = Math.max(merged[merged.length - 1].r, iv.r);
    }
  }

  // Required overlap threshold per difficulty
  const minRequired = Math.max(12, topBaseWidth * cfg.minOverlapRatio);
  const centroid = getWeightedCentroid(
    toWorldPoly(top).map((p, i) => ({ ...p, weight: top.anchors[i]?.weight ?? 1 }))
  );
  const midX = (topMinX + topMaxX) * 0.5;

  // Check against any merged support interval
  for (const m of merged) {
    const overlapMin = Math.max(topMinX, m.l);
    const overlapMax = Math.min(topMaxX, m.r);
    const overlapW = Math.max(0, overlapMax - overlapMin);
    const centroidOk = centroid.x >= (overlapMin - tolerancePx) && centroid.x <= (overlapMax + tolerancePx);
    const midpointOk = midX >= (overlapMin - tolerancePx) && midX <= (overlapMax + tolerancePx);
    if (overlapW >= minRequired && centroidOk && midpointOk) {
      return true;
    }
  }
  return false;
}


/**
 * Animate a tipping rock around the given pivot point (world coords).
 * After tipping, slide it off to the floor.
 */
function tipAndFall(rock: RockPoly, pivot: Point, groundY?: number) {
  // current logical rotation in degrees
  const startRot = rock.rotation;
  // choose tip direction away from pivot, biased by centroid
  const centroid = getWeightedCentroid(
    toWorldPoly(rock).map((p, i) => ({ ...p, weight: rock.anchors[i]?.weight ?? 1 }))
  );
  const dir = Math.sign(centroid.x - pivot.x) || 1; // tip direction away from pivot
  const spinDeg = dir > 0 ? TIP_ROT_DEG : -TIP_ROT_DEG;

  // compute rock-local pivot (vector from rock.position to pivot)
  const localPivot = { x: pivot.x - rock.position.x, y: pivot.y - rock.position.y };

  // animation timeline: rotate by spinDeg while moving position so pivot remains fixed
  const duration = 0.6;

  // Freeze physics during animation
  rock.isStatic = true;
  rock.isTipping = true;

  // animate displayRotation (for rendering) and update position each tick to keep pivot fixed
  const anim = { t: 0 }; // 0 -> 1 tween parameter
  gsap.to(anim, {
    t: 1,
    duration,
    ease: "power2.in",
    onUpdate: () => {
      // compute current angle in radians
      const angle = (spinDeg * anim.t) * (Math.PI / 180);
      // rotate localPivot by angle
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rx = localPivot.x * cos - localPivot.y * sin;
      const ry = localPivot.x * sin + localPivot.y * cos;
      // new world position so pivot stays stationary: pivot = newPos + rotatedLocalPivot => newPos = pivot - rotatedLocalPivot
      rock.position.x = pivot.x - rx;
      rock.position.y = pivot.y - ry;
      // also update display/visual rotation for renderers that use it
      if ((rock as any).displayRotation !== undefined) {
        (rock as any).displayRotation = (startRot + spinDeg * anim.t);
      }
    },
    onComplete: () => {
      // Snap logical rotation and finalize placement
      const snapped = (((startRot + spinDeg) % 360 + 360) % 360) as Rotation;
      rock.rotation = snapped;
      if ((rock as any).targetRotation !== undefined) (rock as any).targetRotation = snapped;
      if ((rock as any).displayRotation !== undefined) (rock as any).displayRotation = snapped;
      // If tipping onto ground, snap to ground with two-vertex contact and settle
      if (groundY !== undefined) {
        const pts = toWorldPoly(rock);
        const maxY = Math.max(...pts.map(p => p.y));
        const dy = groundY - maxY;
        rock.position.y += dy;
        rock.velocity = { x: 0, y: 0 };
        rock.isStatic = true;
        rock.isTipping = false;
        wobbleSettle(rock);
        return;
      }
      // Otherwise resume dynamics so updatePhysics can handle rolling/falling
      rock.isStatic = false;
      rock.isTipping = false;
      rock.velocity = { x: dir * 1.2, y: 1.0 };
    }
  });
}



// ---------- Lightweight physics update ----------
export const GRAVITY_PX = 0.5; // px/frame^2
export const FRICTION = 0.9;   // simple sliding slowdown
export const TIME_STEP = 1;    // assume ~60fps; keep as integer for simplicity
const MAX_BACKTRACK_PIXELS = 64; // how far we'll step back to resolve penetration
const BACKTRACK_STEP = 1;        // pixel step size when resolving overlap
const CONTACT_Y_EPS = 1.5;       // tolerance when deciding top/bottom contact alignment
const TIP_ROT_DEG = 90;         // degrees to rotate when tipping
const WOBBLE_DEG = 4;           // small settle wobble rotation in degrees
const WOBBLE_PIX = 3;           // small settle bounce in px
const CONTACT_DIST_EPS = 2.0;   // distance tolerance for vertex-to-edge contacts

function wobbleSettle(rock: RockPoly) {
  const hasDisplay = (rock as any).displayRotation !== undefined;
  const baseRot = rock.rotation;
  if (hasDisplay) {
    if ((rock as any).displayRotation === undefined) (rock as any).displayRotation = baseRot;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const target1 = baseRot + dir * WOBBLE_DEG;
    const target2 = baseRot - dir * (WOBBLE_DEG * 0.6);
    const tl = gsap.timeline();
    tl.to(rock as any, { displayRotation: target1, duration: 0.12, ease: "power2.out" }, 0);
    tl.to(rock as any, { displayRotation: target2, duration: 0.1, ease: "power2.inOut" }, ">");
    tl.to(rock as any, { displayRotation: baseRot, duration: 0.12, ease: "power2.out" }, ">");
  }
  gsap.to(rock.position, { y: rock.position.y + WOBBLE_PIX, duration: 0.1, ease: "power1.out", yoyo: true, repeat: 1 });
}

// Distance from point to segment
function distPointToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) return Math.hypot(apx, apy);
  let t = (apx * abx + apy * aby) / abLenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

// reserved helper for future: bottom band segment extraction (unused for now)

// Count how many vertices of the rock are in contact with the ground line
function countGroundContacts(rock: RockPoly, groundY: number): number {
  const pts = toWorldPoly(rock);
  let count = 0;
  for (const p of pts) {
    if (Math.abs(p.y - groundY) <= CONTACT_Y_EPS) count++;
  }
  return count;
}

// Count distinct rock vertices contacting the top bands of any supports
function countSupportContacts(rock: RockPoly, supports: RockPoly[]): number {
  const rockPts = toWorldPoly(rock);
  const seen = new Set<number>();
  let count = 0;
  for (let i = 0; i < rockPts.length; i++) {
    const rp = rockPts[i];
    for (const s of supports) {
      const sPts = toWorldPoly(s);
      // vertex-on-top-band
      const supTop = Math.min(...sPts.map(p => p.y));
      const band = sPts.filter(p => Math.abs(p.y - supTop) <= 4);
      if (band.length > 0) {
        const minX = Math.min(...band.map(p => p.x));
        const maxX = Math.max(...band.map(p => p.x));
        const onTop = Math.abs(rp.y - supTop) <= CONTACT_Y_EPS && rp.x >= minX && rp.x <= maxX;
        if (onTop && !seen.has(i)) { seen.add(i); count++; continue; }
      }
      // vertex-to-edge within distance tolerance (edge can be anywhere on support)
      for (let e = 0; e < sPts.length; e++) {
        const a = sPts[e];
        const b = sPts[(e + 1) % sPts.length];
        const d = distPointToSeg(rp.x, rp.y, a.x, a.y, b.x, b.y);
        if (d <= CONTACT_DIST_EPS && !seen.has(i)) { seen.add(i); count++; break; }
      }
    }
  }
  return count;
}

export function updatePhysics(
  rock: RockPoly,
  settled: RockPoly[],
  groundY: number
): void {
  if (rock.isStatic) return;
  if (!rock.velocity) rock.velocity = { x: 0, y: 0 };
  if (rock.tipCooldown && rock.tipCooldown > 0) rock.tipCooldown--;

  // apply gravity
  rock.velocity.y += GRAVITY_PX * TIME_STEP;

  // integrate tentative position
  rock.position.x += rock.velocity.x * TIME_STEP;
  rock.position.y += rock.velocity.y * TIME_STEP;

  // check ground intersection quickly
  const ptsNow = toWorldPoly(rock);
  const lowestY = Math.max(...ptsNow.map(p => p.y));
  if (lowestY >= groundY) {
    // Backtrack to just above the ground
    let backtracked = 0;
    while (backtracked < MAX_BACKTRACK_PIXELS) {
      rock.position.y -= BACKTRACK_STEP;
      backtracked++;
      const pts = toWorldPoly(rock);
      if (Math.max(...pts.map(p => p.y)) < groundY - 0.001) break;
    }
    // Clamp to ground exactly
    const pts = toWorldPoly(rock);
    const low = Math.max(...pts.map(p => p.y));
    const correction = groundY - low;
    rock.position.y += correction;

    // Evaluate contacts against ground and any supports directly under the rock
    const groundContacts = countGroundContacts(rock, groundY);
    const supportsUnder = settled.filter(s => {
      const sTop = Math.min(...toWorldPoly(s).map(p => p.y));
      const rBottom = Math.max(...toWorldPoly(rock).map(p => p.y));
      const sp = toWorldPoly(s);
      const minX = Math.min(...sp.map(p => p.x));
      const maxX = Math.max(...sp.map(p => p.x));
      const rp = toWorldPoly(rock);
      const rminX = Math.min(...rp.map(p => p.x));
      const rmaxX = Math.max(...rp.map(p => p.x));
      const horiz = !(rminX > maxX || rmaxX < minX);
      return horiz && Math.abs(sTop - rBottom) <= CONTACT_Y_EPS;
    });
    const supportContacts = countSupportContacts(rock, supportsUnder);
    const totalContacts = groundContacts + supportContacts;

    // Triangle single-point contact tipping: only if total contacts are exactly 1, not moving fast, and cooldown passed
    const isTriangle = rock.anchors.length === 3;
    const slow = Math.abs(rock.velocity.x) < 0.2 && Math.abs(rock.velocity.y) < 0.2;
    if (isTriangle && totalContacts === 1 && !rock.isTipping && (!rock.tipCooldown || rock.tipCooldown <= 0) && slow) {
      const rpts = toWorldPoly(rock);
      const lowest = rpts.reduce((a, b) => (a.y > b.y ? a : b));
      tipAndFall(rock, lowest, groundY);
      rock.tipCooldown = 30; // ~0.5s at 60fps
      return;
    }

    if (totalContacts >= 2) {
      rock.velocity = { x: 0, y: 0 };
      rock.isStatic = true;
      recheckPile([...settled, rock]);
      wobbleSettle(rock);
      return;
    }

    // Otherwise keep rolling along the ground
    rock.isStatic = false;
    const dir = Math.random() < 0.5 ? -1 : 1;
    rock.velocity.x = (rock.velocity.x ?? 0) * FRICTION + dir * 1.2;
    rock.velocity.y = 0; // stay grounded; next frame will keep clamping
    return;
  }

  // now check collision with settled rocks
  // if any overlap exists, resolve by moving the rock upward step-by-step until no overlap
  const overlapped = settled.some(s => polygonsIntersectSAT(toWorldPoly(rock), toWorldPoly(s)));
  if (overlapped) {
    // backtrack along Y in small steps until no overlap or until we give up
    let backtracked = 0;
    while (backtracked < MAX_BACKTRACK_PIXELS) {
      // move rock up a pixel
      rock.position.y -= BACKTRACK_STEP;
      backtracked++;
      // if no longer overlapping any support, we've found the just-above position
      const stillOverlap = settled.some(s => polygonsIntersectSAT(toWorldPoly(rock), toWorldPoly(s)));
      if (!stillOverlap) break;
    }

    // After backtracking we are just above the supports (or max backtracked). Now find which supports are directly underneath
    const touching = settled.filter(s => {
      // they should be vertically adjacent: support top Y close to rock bottom Y
      const sTop = Math.min(...toWorldPoly(s).map(p => p.y));
      const rBottom = Math.max(...toWorldPoly(rock).map(p => p.y));
      const horizOverlap =
        Math.min(...toWorldPoly(s).map(p => p.x)) <= Math.max(...toWorldPoly(rock).map(p => p.x)) &&
        Math.max(...toWorldPoly(s).map(p => p.x)) >= Math.min(...toWorldPoly(rock).map(p => p.x));
      return horizOverlap && Math.abs(sTop - rBottom) <= CONTACT_Y_EPS;
    });

    // If no touching supports found, it's likely we slid past them horizontally — keep falling.
    if (touching.length === 0) {
      // no support detected; keep going next frame (small nudge down so we don't get stuck exactly)
      rock.position.y += 0.5;
      return;
    }

    // If we have supports directly under the rock, test stability and contact count.
    const contacts = countSupportContacts(rock, touching);
    const stable = stableOnMultiple(rock, touching, { tolerancePx: 0 });
    if (stable || contacts >= 2) {
      // settle here (allow angled rests if two or more contact points)
      rock.velocity = { x: 0, y: 0 };
      rock.isStatic = true;
      recheckPile([...settled, rock]);
      wobbleSettle(rock);
      return;
    } else {
      // Unstable: trigger tip animation around suitable pivot
      // Choose a pivot point: pick nearest support top-edge point to the rock centroid
      const centroid = getWeightedCentroid(
        toWorldPoly(rock).map((p, i) => ({ ...p, weight: rock.anchors[i]?.weight ?? 1 }))
      );
      // find support with closest center to centroid
      let bestSupport = touching[0];
      let bestDist = Infinity;
      for (const s of touching) {
        const sPts = toWorldPoly(s);
        const sCx = sPts.reduce((a, b) => a + b.x, 0) / sPts.length;
        const sCy = sPts.reduce((a, b) => a + b.y, 0) / sPts.length;
        const d = Math.hypot(sCx - centroid.x, sCy - centroid.y);
        if (d < bestDist) { bestSupport = s; bestDist = d; }
      }

      // Determine pivot: find point on support top band nearest to rock centroid
      const supPoly = toWorldPoly(bestSupport);
      const supTopY = Math.min(...supPoly.map(p => p.y));
      const topBand = supPoly.filter(p => Math.abs(p.y - supTopY) <= 4);
      let pivot: Point;
      if (topBand.length > 0) {
        // pick the band vertex whose x is closest to centroid
        pivot = topBand.reduce((best, p) => {
          return Math.abs(p.x - centroid.x) < Math.abs(best.x - centroid.x) ? p : best;
        }, topBand[0]);
      } else {
        // fallback: use support centroid projected up to top
        const sCx = supPoly.reduce((a, b) => a + b.x, 0) / supPoly.length;
        pivot = { x: sCx, y: supTopY };
      }

      // Kick off tipping animation (delegated to helper below)
      tipAndFall(rock, pivot);
      return;
    }
  }

  // if no overlap and not ground, rock continues falling as usual
}

  // (old collision branch removed)

export function recheckPile(settled: RockPoly[]) {
  // iterate top-to-bottom (or repeat until stable)
  let changed = true;
  let safety = 0;
  while (changed && safety++ < 30) {
    changed = false;
    for (const r of settled.slice().reverse()) {
      if (r.isStatic) {
        // gather supports beneath r
        const supports = settled.filter(s => s !== r && polygonsIntersectSAT(toWorldPoly(r), toWorldPoly(s)));
        if (supports.length > 0) {
          const ok = stableOnMultiple(r, supports, { tolerancePx: 0 });
          if (!ok) {
            // make it dynamic again and give it a small initial sideways nudge so it moves
            r.isStatic = false;
            r.velocity = { x: (Math.random() < 0.5 ? -1 : 1) * 0.8, y: 1 };
            changed = true;
          }
        }
      }
    }
  }
}




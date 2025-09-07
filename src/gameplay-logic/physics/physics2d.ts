// Lightweight 2D geometry helpers and SAT collision utilities

export type Rotation = 0 | 90 | 180 | 270;

export interface Point { x: number; y: number; }

export interface AnchorPoint extends Point { weight?: number; }

export interface RockPoly {
  id: string;
  anchors: AnchorPoint[]; // local-space convex polygon (CW or CCW)
  rotation: Rotation; // multiples of 90°
  position: { x: number; y: number }; // world translation
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
  if (supBandWidth < 12) return false; // stricter: disallow very narrow supports

  // Require substantial overlap relative to the narrower of the two bases
  const minRequired = Math.max(18, Math.min(topBaseWidth, supBandWidth) * 0.8);

  // Centroid projection must fall within the overlap span (with tolerance)
  const centroidOverlaps = centroid.x >= overlapMinX && centroid.x <= overlapMaxX;

  // Also require the bottom edge midpoint to lie over the overlap (prevents tip balancing)
  const midX = (topMinX + topMaxX) * 0.5;
  const midpointOverlaps = midX >= overlapMinX && midX <= overlapMaxX;
  const aboveSurface = centroid.y <= (supMinY + bandHeight);
  // Extra guard: if the centroid is substantially above the contact line but overlap is tiny, treat as unstable to avoid vertical sticking
  if (overlapWidth < 12 && centroid.y < supMinY - 8) return false;

  return overlapWidth >= minRequired && centroidOverlaps && midpointOverlaps && aboveSurface;
}

// Multi-support stability: allow a top rock to be supported by several neighbors
export function stableOnMultiple(top: RockPoly, supports: RockPoly[], options?: { tolerancePx?: number }): boolean {
  const tolerancePx = options?.tolerancePx ?? 0;

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

  // Required overlap threshold (stricter)
  const minRequired = Math.max(18, topBaseWidth * 0.8);
  const centroid = getWeightedCentroid(
    toWorldPoly(top).map((p, i) => ({ ...p, weight: top.anchors[i]?.weight ?? 1 }))
  );
  const midX = (topMinX + topMaxX) * 0.5;

  // Check against any merged support interval
  for (const m of merged) {
    const overlapMin = Math.max(topMinX, m.l);
    const overlapMax = Math.min(topMaxX, m.r);
    const overlapW = Math.max(0, overlapMax - overlapMin);
    const centroidOk = centroid.x >= overlapMin && centroid.x <= overlapMax;
    const midpointOk = midX >= overlapMin && midX <= overlapMax;
    if (overlapW >= minRequired && centroidOk && midpointOk) {
      return true;
    }
  }
  return false;
}



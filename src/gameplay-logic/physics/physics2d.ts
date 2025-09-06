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
  const topWorld = toWorldPoly(top).map((p, i) => {
    const w = top.anchors[i]?.weight ?? 1;
    return { ...p, weight: w } as AnchorPoint;
  });
  const centroid = getWeightedCentroid(topWorld);
  const supPoly = toWorldPoly(support);
  if (pointInsidePolygon(centroid, supPoly)) return true;
  if (tolerancePx <= 0) return false;
  for (let i = 0; i < supPoly.length; i++) {
    const a = supPoly[i];
    const b = supPoly[(i + 1) % supPoly.length];
    const abx = b.x - a.x, aby = b.y - a.y;
    const apx = centroid.x - a.x, apy = centroid.y - a.y;
    const abLenSq = abx * abx + aby * aby || 1;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
    const cx = a.x + t * abx, cy = a.y + t * aby;
    const dist = Math.hypot(centroid.x - cx, centroid.y - cy);
    if (dist <= tolerancePx) return true;
  }
  return false;
}



// Geometry-driven lightweight stability utilities for rock stacking

export type Rotation = 0 | 90 | 180 | 270;

export type RockSize = "small" | "medium" | "large";

export interface AnchorPoint {
  x: number;
  y: number;
  weight?: number; // defaults to 1 if omitted
}

export interface RockPosition {
  x: number;
  y: number;
}

export interface Rock {
  id: string;
  shape: "triangle" | "quad"; // for MVP, we limit to triangles and quads
  size: RockSize; // impacts difficulty/support tolerance externally
  anchors: AnchorPoint[]; // local-space polygon vertex anchors (clockwise or counter-clockwise)
  rotation: Rotation; // multiples of 90 degrees
  position: RockPosition; // world-space translation of local polygon
}

export interface StabilityOptions {
  // If > 0, allow centroid to be within this pixel distance from the support polygon boundary
  boundaryTolerancePx?: number;
}

export interface Point2D {
  x: number;
  y: number;
}

function rotatePoint90(point: Point2D, rotation: Rotation): Point2D {
  const { x, y } = point;
  switch (rotation) {
    case 90:
      return { x: -y, y: x };
    case 180:
      return { x: -x, y: -y };
    case 270:
      return { x: y, y: -x };
    default:
      return point;
  }
}

export function toWorldAnchors(
  anchors: AnchorPoint[],
  position: RockPosition,
  rotation: Rotation
): AnchorPoint[] {
  return anchors.map((a) => {
    const rotated = rotatePoint90(a, rotation);
    return {
      x: rotated.x + position.x,
      y: rotated.y + position.y,
      weight: a.weight ?? 1,
    };
  });
}

export function getWeightedCentroid(points: AnchorPoint[]): Point2D {
  let sumWeights = 0;
  let sumX = 0;
  let sumY = 0;

  for (const p of points) {
    const w = (p.weight ?? 1);
    sumWeights += w;
    sumX += p.x * w;
    sumY += p.y * w;
  }

  if (sumWeights === 0) {
    // Fallback to unweighted average
    const n = points.length || 1;
    const avgX = points.reduce((acc, p) => acc + p.x, 0) / n;
    const avgY = points.reduce((acc, p) => acc + p.y, 0) / n;
    return { x: avgX, y: avgY };
  }

  return {
    x: sumX / sumWeights,
    y: sumY / sumWeights,
  };
}

export function pointInsidePolygon(point: Point2D, polygon: Point2D[]): boolean {
  // Ray casting algorithm
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects = yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }
  return inside;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distancePointToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;

  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) return Math.hypot(apx, apy);

  const t = clamp((apx * abx + apy * aby) / abLenSq, 0, 1);
  const cx = a.x + t * abx;
  const cy = a.y + t * aby;
  return Math.hypot(p.x - cx, p.y - cy);
}

export function pointInOrNearPolygon(
  point: Point2D,
  polygon: Point2D[],
  tolerancePx: number
): boolean {
  if (pointInsidePolygon(point, polygon)) return true;
  if (tolerancePx <= 0) return false;
  // Check distance to each edge
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    if (distancePointToSegment(point, a, b) <= tolerancePx) return true;
  }
  return false;
}

export function getSupportPolygon(bottomRock: Rock): Point2D[] {
  // MVP: treat the entire bottom rock polygon as a support surface
  const world = toWorldAnchors(bottomRock.anchors, bottomRock.position, bottomRock.rotation);
  return world.map(({ x, y }) => ({ x, y }));
}

export function checkStability(
  topRock: Rock,
  bottomRock: Rock,
  options: StabilityOptions = {}
): boolean {
  const { boundaryTolerancePx = 0 } = options;

  // 1) World-space anchors for top and bottom rocks
  const worldTop = toWorldAnchors(topRock.anchors, topRock.position, topRock.rotation);
  const worldBottom = toWorldAnchors(
    bottomRock.anchors,
    bottomRock.position,
    bottomRock.rotation
  );

  // 2) Compute weighted centroid of the top rock in world coordinates
  const centroid = getWeightedCentroid(worldTop);

  // 3) Determine support polygon for bottom rock
  const supportPolygon = worldBottom.map(({ x, y }) => ({ x, y }));

  // 4) Stability test: centroid must lie inside or near the support polygon
  return pointInOrNearPolygon(centroid, supportPolygon, boundaryTolerancePx);
}

// Convenience helpers for rotation-only adjustments
export function rotateRockClockwise(rock: Rock): Rock {
  const nextRotation = (((rock.rotation + 90) % 360) as Rotation);
  return { ...rock, rotation: nextRotation };
}

export function rotateRockCounterClockwise(rock: Rock): Rock {
  const nextRotation = (((rock.rotation + 270) % 360) as Rotation);
  return { ...rock, rotation: nextRotation };
}



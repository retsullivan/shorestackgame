import { Rock, RockSize } from "../physics/rockPhysics";

// Level 1: 5 rocks total (3 quads, 2 triangles)
// Anchors are defined in local space centered around (0,0)

const QUAD_SQUARE_SMALL: Rock = {
  id: "quad_square_small",
  shape: "quad",
  size: "small",
  anchors: [
    { x: -16, y: -16 },
    { x: 16, y: -16 },
    { x: 16, y: 16 },
    { x: -16, y: 16 },
  ],
  rotation: 0,
  position: { x: 0, y: 0 },
};

const QUAD_RECT_LARGE: Rock = {
  id: "quad_rect_large",
  shape: "quad",
  size: "large",
  anchors: [
    { x: -28, y: -16 },
    { x: 28, y: -16 },
    { x: 28, y: 16 },
    { x: -28, y: 16 },
  ],
  rotation: 0,
  position: { x: 0, y: 0 },
};

const QUAD_TRAPEZOID_SMALL: Rock = {
  id: "quad_trapezoid_small",
  shape: "quad",
  size: "small",
  anchors: [
    { x: -24, y: -12 },
    { x: 24, y: -12 },
    { x: 16, y: 12 },
    { x: -16, y: 12 },
  ],
  rotation: 0,
  position: { x: 0, y: 0 },
};

const TRI_RIGHT_SMALL: Rock = {
  id: "tri_right_small",
  shape: "triangle",
  size: "small",
  anchors: [
    { x: -20, y: 16 },
    { x: 20, y: 16 },
    { x: 20, y: -16 },
  ],
  rotation: 0,
  position: { x: 0, y: 0 },
};

const TRI_ISO_MEDIUM: Rock = {
  id: "tri_iso_medium",
  shape: "triangle",
  size: "medium",
  anchors: [
    { x: -22, y: 16 },
    { x: 22, y: 16 },
    { x: 0, y: -18 },
  ],
  rotation: 0,
  position: { x: 0, y: 0 },
};

export type LevelRock = Rock & {
  // Initial visual placement offsets for the pile
  initialPosition: { x: number; y: number };
  zIndex: number;
};

export const level1Rocks: LevelRock[] = [
  { ...QUAD_RECT_LARGE, initialPosition: { x: 24, y: -8 }, zIndex: 1 },
  { ...QUAD_SQUARE_SMALL, initialPosition: { x: 8, y: 24 }, zIndex: 2 },
  { ...QUAD_TRAPEZOID_SMALL, initialPosition: { x: 40, y: 20 }, zIndex: 3 },
  { ...TRI_RIGHT_SMALL, initialPosition: { x: 64, y: -2 }, zIndex: 4 },
  { ...TRI_ISO_MEDIUM, initialPosition: { x: 12, y: -20 }, zIndex: 5 },
];



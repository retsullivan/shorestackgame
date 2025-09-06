import { Rock } from "../physics/rockPhysics";
import { LevelRock } from "./types";

// Level 2: change the mix and sizes
const QUAD_WIDE_MEDIUM: Rock = {
  id: "l2_quad_wide_medium",
  shape: "quad",
  size: "medium",
  anchors: [
    { x: -32, y: -14 },
    { x: 32, y: -14 },
    { x: 32, y: 14 },
    { x: -32, y: 14 },
  ],
  rotation: 0,
  position: { x: 0, y: 0 },
};

const QUAD_SQUARE_LARGE: Rock = {
  id: "l2_quad_square_large",
  shape: "quad",
  size: "large",
  anchors: [
    { x: -24, y: -24 },
    { x: 24, y: -24 },
    { x: 24, y: 24 },
    { x: -24, y: 24 },
  ],
  rotation: 0,
  position: { x: 0, y: 0 },
};

const QUAD_PARALLELOGRAM_SMALL: Rock = {
  id: "l2_quad_para_small",
  shape: "quad",
  size: "small",
  anchors: [
    { x: -20, y: -14 },
    { x: 22, y: -14 },
    { x: 20, y: 14 },
    { x: -22, y: 14 },
  ],
  rotation: 0,
  position: { x: 0, y: 0 },
};

const TRI_ACUTE_SMALL: Rock = {
  id: "l2_tri_acute_small",
  shape: "triangle",
  size: "small",
  anchors: [
    { x: -18, y: 16 },
    { x: 18, y: 16 },
    { x: -4, y: -16 },
  ],
  rotation: 0,
  position: { x: 0, y: 0 },
};

const TRI_RIGHT_MEDIUM: Rock = {
  id: "l2_tri_right_medium",
  shape: "triangle",
  size: "medium",
  anchors: [
    { x: -24, y: 20 },
    { x: 24, y: 20 },
    { x: 24, y: -20 },
  ],
  rotation: 0,
  position: { x: 0, y: 0 },
};

export const level2Rocks: LevelRock[] = [
  { ...QUAD_SQUARE_LARGE, initialPosition: { x: 10, y: 4 }, zIndex: 1 },
  { ...QUAD_WIDE_MEDIUM, initialPosition: { x: 44, y: -6 }, zIndex: 2 },
  { ...QUAD_PARALLELOGRAM_SMALL, initialPosition: { x: 80, y: 6 }, zIndex: 3 },
  { ...TRI_RIGHT_MEDIUM, initialPosition: { x: 116, y: -8 }, zIndex: 4 },
  { ...TRI_ACUTE_SMALL, initialPosition: { x: 150, y: 8 }, zIndex: 5 },
];



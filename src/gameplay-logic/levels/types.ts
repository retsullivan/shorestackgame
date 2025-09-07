import { AnchorPoint } from "../physics/physics2d";

// RockType used by the tray/UI and physics loop in RockStackingGame
export interface RockType {
  id: string;
  anchors: AnchorPoint[];
  count: number;
  drawW: number;
  drawH: number;
  sprite?: string; // sprite key/name (e.g., triangle, trapezoid, rock, isoceles)
  size?: "small" | "large"; // for selecting folder/asset scale
  crop?: { x: number; y: number; w: number; h: number }; // source crop within sprite (pixels)
}

// Shape of per-level JSON input (quantities for each rock id)
export interface LevelJson {
  id: number;
  name: string;
  goal?: string;
  rocks: Array<{ id: string; count: number }>;
  theme?: "daytime" | "sunset" | "mixed";
}

// Rock catalog JSON entry with geometry/draw dimensions
export interface RockCatalogEntry {
  anchors: AnchorPoint[];
  drawW: number;
  drawH: number;
  sprite: string;
  size: "small" | "large";
  crop?: { x: number; y: number; w: number; h: number };
}

export type RockCatalog = Record<string, RockCatalogEntry>;

export interface LevelData {
  id: number;
  name: string;
  goal?: string;
  types: RockType[];
  theme: "daytime" | "sunset" | "mixed";
}



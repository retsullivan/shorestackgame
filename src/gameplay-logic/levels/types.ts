import { AnchorPoint } from "../physics/physics2d";

// RockType used by the tray/UI and physics loop in RockStackingGame
export interface RockType {
  id: string;
  anchors: AnchorPoint[];
  count: number;
  drawW: number;
  drawH: number;
}

// Shape of per-level JSON input (quantities for each rock id)
export interface LevelJson {
  id: number;
  name: string;
  goal?: string;
  rocks: Array<{ id: string; count: number }>;
}

// Rock catalog JSON entry with geometry/draw dimensions
export interface RockCatalogEntry {
  anchors: AnchorPoint[];
  drawW: number;
  drawH: number;
}

export type RockCatalog = Record<string, RockCatalogEntry>;

export interface LevelData {
  id: number;
  name: string;
  goal?: string;
  types: RockType[];
}



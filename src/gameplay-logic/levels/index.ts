import { LevelData } from "./types";
import { level1Rocks } from "./level1";
import { level2Rocks } from "./level2";

export function getLevelData(id: number): LevelData {
  switch (id) {
    case 1:
      return { id: 1, name: "TIDE POOLS", rocks: level1Rocks, goal: "Build a stable stack with all 5 rocks" };
    case 2:
      return { id: 2, name: "CORAL COVE", rocks: level2Rocks, goal: "Reach medium height using at least one triangle" };
    default:
      return { id, name: `LEVEL ${id}`, rocks: level1Rocks, goal: "Build a stable stack" };
  }
}



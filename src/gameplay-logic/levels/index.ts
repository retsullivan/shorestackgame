import { LevelData, LevelJson, RockCatalog, RockType } from "./types";
import level1 from "./level1.json";
import level2 from "./level2.json";
import catalog from "../rocks/catalog.json";

function buildTypes(level: LevelJson, cat: RockCatalog): RockType[] {
  return level.rocks
    .map(({ id, count }) => {
      const entry = cat[id];
      if (!entry) return null;
      return { id, anchors: entry.anchors, drawW: entry.drawW, drawH: entry.drawH, count } as RockType;
    })
    .filter((x): x is RockType => !!x);
}

export function getLevelData(id: number): LevelData {
  const lvls: Record<number, LevelJson> = {
    1: level1 as LevelJson,
    2: level2 as LevelJson,
  };
  const lvl = lvls[id] ?? (level1 as LevelJson);
  const types = buildTypes(lvl, catalog as RockCatalog);
  return {
    id: lvl.id,
    name: lvl.name,
    goal: lvl.goal,
    types,
  };
}



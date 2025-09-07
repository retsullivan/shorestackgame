import { LevelData, LevelJson, RockCatalog, RockType } from "./types";
import level1 from "./level1.json";
import level2 from "./level2.json";
import level3 from "./level3.json";
import level4 from "./level4.json";
import catalog from "../rock_catalog.json";

function buildTypes(level: LevelJson, cat: RockCatalog): RockType[] {
  return level.rocks
    .map(({ id, count }) => {
      const entry = cat[id];
      if (!entry) return null;
      return { id, anchors: entry.anchors, drawW: entry.drawW, drawH: entry.drawH, count, sprite: entry.sprite, size: entry.size, crop: entry.crop } as RockType;
    })
    .filter((x): x is RockType => !!x);
}

export function getLevelData(id: number): LevelData {
  const lvls: Record<number, LevelJson> = {
    1: level1 as LevelJson,
    2: level2 as LevelJson,
    3: level3 as LevelJson,
    4: level4 as LevelJson,
  };
  const lvl = lvls[id] ?? (level1 as LevelJson);
  const types = buildTypes(lvl, catalog as RockCatalog);
  return {
    id: lvl.id,
    name: lvl.name,
    goal: lvl.goal,
    tip: lvl.tip,
    types,
    theme: lvl.theme ?? "daytime",
    challenge: lvl.challenge,
  };
}



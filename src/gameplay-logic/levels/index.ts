import { LevelData, LevelJson, RockCatalog, RockType } from "./types";
import level1 from "./level1.json";
import level2 from "./level2.json";
import level3 from "./level3.json";
import level4 from "./level4.json";
import level5 from "./level5.json";
import level6 from "./level6.json";
import level7 from "./level7.json";
import level8 from "./level8.json";
import level9 from "./level9.json";
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
    5: level5 as LevelJson,
    6: level6 as LevelJson,
    7: level7 as LevelJson,
    8: level8 as LevelJson,
    9: level9 as LevelJson,
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
    overlayTheme: (lvl as any).overlay_theme ?? lvl.overlayTheme ?? lvl.theme ?? "daytime",
    challenge: lvl.challenge,
  };
}

// Return raw LevelJson objects for listing/metadata purposes (e.g., levels screen)
export function listLevels(): LevelJson[] {
  return [level1 as LevelJson, level2 as LevelJson, level3 as LevelJson, level4 as LevelJson, level5 as LevelJson, level6 as LevelJson, level7 as LevelJson, level8 as LevelJson, level9 as LevelJson];
}



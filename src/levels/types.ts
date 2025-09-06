import { Rock } from "../physics/rockPhysics";

export type LevelRock = Rock & {
  initialPosition: { x: number; y: number };
  zIndex: number;
};

export interface LevelData {
  id: number;
  name: string;
  rocks: LevelRock[];
  goal?: string;
}



import rules from "./stabilityRules.json";

export type Difficulty = keyof typeof rules;

let currentDifficulty: Difficulty = "easy";

export function setDifficulty(level: Difficulty) {
  currentDifficulty = level;
}

export function getConfig() {
  return rules[currentDifficulty];
}



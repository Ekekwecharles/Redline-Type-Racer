import { DifficultyConfig, DifficultyKey, RaceSettings } from "@/types";

export const DIFFICULTIES: Record<Exclude<DifficultyKey, "custom">, DifficultyConfig> = {
  rookie: { bots: [30, 42], penalty: 2, label: "Rookie" },
  pro: { bots: [45, 65], penalty: 5, label: "Pro" },
  legend: { bots: [60, 85], penalty: 9, label: "Legend" },
};

export function currentDifficultyConfig(settings: RaceSettings): DifficultyConfig {
  if (settings.difficulty === "custom") {
    return {
      bots: [settings.customBot1, settings.customBot2],
      penalty: settings.customPenalty,
      label: "Custom",
    };
  }
  return DIFFICULTIES[settings.difficulty];
}

export function defaultSettings(): RaceSettings {
  return {
    raceMode: "words",
    wordCount: 55,
    timeSeconds: 60,
    difficulty: "pro",
    customPenalty: 5,
    customBot1: 45,
    customBot2: 65,
  };
}

// XP required to go from level L to L+1
export function xpForLevel(level: number): number {
  return level * 750;
}

export function recalcLevel(xp: number): number {
  let lvl = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(lvl)) {
    remaining -= xpForLevel(lvl);
    lvl++;
  }
  return lvl;
}

export const ACHIEVEMENTS = [
  { id: "first_race", label: "First Lap" },
  { id: "first_win", label: "First Win" },
  { id: "speed_60", label: "60+ WPM" },
  { id: "speed_90", label: "90+ WPM" },
  { id: "perfect", label: "Perfectionist" },
  { id: "combo_20", label: "Combo x20" },
  { id: "ten_races", label: "Road Warrior" },
  { id: "level5", label: "Level 5" },
] as const;

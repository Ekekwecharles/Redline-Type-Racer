import { DifficultyConfig, DifficultyKey, RaceSettings } from "@/types";

// Preset difficulty tiers. "custom" is excluded here since its values come
// from user-editable settings instead of a fixed config — see
// currentDifficultyConfig below.
export const DIFFICULTIES: Record<
  Exclude<DifficultyKey, "custom">,
  DifficultyConfig
> = {
  rookie: { bots: [30, 42], penalty: 2, label: "Rookie" },
  pro: { bots: [45, 65], penalty: 5, label: "Pro" },
  legend: { bots: [60, 85], penalty: 9, label: "Legend" },
};

// Resolves the active settings into a concrete DifficultyConfig, whether
// that's one of the fixed presets above or the user's custom bot/penalty values.
export function currentDifficultyConfig(
  settings: RaceSettings,
): DifficultyConfig {
  if (settings.difficulty === "custom") {
    return {
      bots: [settings.customBot1, settings.customBot2],
      penalty: settings.customPenalty,
      label: "Custom",
    };
  }
  return DIFFICULTIES[settings.difficulty];
}

// Initial settings for a fresh session. customBot1/customBot2/customPenalty
// mirror the "pro" preset so switching to "custom" starts from sane values.
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

// Converts total accumulated XP into a level, by repeatedly subtracting
// the cost of each level until there's not enough XP left for the next one.
export function recalcLevel(xp: number): number {
  let lvl = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(lvl)) {
    remaining -= xpForLevel(lvl);
    lvl++;
  }
  return lvl;
}

// Static catalog of unlockable achievements. `id` is the stable key used to
// persist unlocked state; `label` is the display name shown in the UI.
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

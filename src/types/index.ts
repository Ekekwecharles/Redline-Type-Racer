export type CarUnlock =
  | { type: "default" }
  | { type: "level"; value: number }
  | { type: "coins"; value: number }
  | { type: "pro" };

export interface Car {
  id: string;
  name: string;
  emoji: string;
  speed: number;
  accel: number;
  handling: number;
  unlock: CarUnlock;
  desc: string;
}

export type DifficultyKey = "rookie" | "pro" | "legend" | "custom";

export interface DifficultyConfig {
  bots: [number, number];
  penalty: number;
  label: string;
}

export type RaceMode = "words" | "time";

export interface RaceSettings {
  raceMode: RaceMode;
  wordCount: number;
  timeSeconds: number;
  difficulty: DifficultyKey;
  customPenalty: number;
  customBot1: number;
  customBot2: number;
}

export interface Profile {
  name: string;
  xp: number;
  level: number;
  coins: number;
  isPro: boolean;
  selectedCar: string;
  unlockedCars: string[];
  bestWpm: number;
  racesPlayed: number;
  racesWon: number;
  accSum: number;
  achievements: string[];
  history: RaceHistoryEntry[];
}

export interface RaceHistoryEntry {
  date: string;
  wpm: number;
  acc: number;
  maxCombo: number;
  won: boolean;
  mode: string;
}

export interface RaceResultInput {
  wpm: number;
  acc: number;
  maxCombo: number;
  won: boolean;
  mode: string;
}

export interface MultiplayerMember {
  id: string;
  name: string;
  pct: number;
  isHost: boolean;
  finishedAt: number | null;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Profile, RaceResultInput } from "@/types";
import { recalcLevel } from "@/lib/difficulty";

const GUEST_KEY = "redline_guest_profile_v1";

function defaultProfile(): Profile {
  return {
    name: "Racer",
    xp: 0,
    level: 1,
    coins: 0,
    isPro: false,
    selectedCar: "bike",
    unlockedCars: ["bike"],
    bestWpm: 0,
    racesPlayed: 0,
    racesWon: 0,
    accSum: 0,
    achievements: [],
    history: [],
  };
}

function loadGuestProfile(): Profile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? { ...defaultProfile(), ...JSON.parse(raw) } : defaultProfile();
  } catch {
    return defaultProfile();
  }
}
function saveGuestProfile(p: Profile) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(p));
}

interface DbRaceResult {
  wpm: number;
  accuracy: number;
  maxCombo: number;
  won: boolean;
  mode: string;
  createdAt: string;
}
interface DbUser {
  name: string | null;
  xp: number;
  level: number;
  coins: number;
  isPro: boolean;
  selectedCar: string;
  unlockedCars: string[];
  raceResults: DbRaceResult[];
}

function dbUserToProfile(u: DbUser): Profile {
  const racesPlayed = u.raceResults.length;
  const racesWon = u.raceResults.filter((r) => r.won).length;
  const bestWpm = u.raceResults.reduce((m, r) => Math.max(m, r.wpm), 0);
  const accSum = u.raceResults.reduce((s, r) => s + r.accuracy, 0);
  return {
    name: u.name || "Racer",
    xp: u.xp,
    level: u.level,
    coins: u.coins,
    isPro: u.isPro,
    selectedCar: u.selectedCar,
    unlockedCars: u.unlockedCars,
    bestWpm,
    racesPlayed,
    racesWon,
    accSum,
    achievements: computeAchievements({ racesPlayed, racesWon, bestWpm, level: u.level }),
    history: u.raceResults.map((r) => ({
      date: new Date(r.createdAt).toLocaleDateString(),
      wpm: r.wpm,
      acc: r.accuracy,
      maxCombo: r.maxCombo,
      won: r.won,
      mode: r.mode,
    })),
  };
}

export function computeAchievements(stats: {
  racesPlayed: number;
  racesWon: number;
  bestWpm: number;
  level: number;
  lastAcc?: number;
  lastMaxCombo?: number;
}): string[] {
  const earned: string[] = [];
  if (stats.racesPlayed >= 1) earned.push("first_race");
  if (stats.racesWon >= 1) earned.push("first_win");
  if (stats.bestWpm >= 60) earned.push("speed_60");
  if (stats.bestWpm >= 90) earned.push("speed_90");
  if (stats.lastAcc === 100) earned.push("perfect");
  if ((stats.lastMaxCombo ?? 0) >= 20) earned.push("combo_20");
  if (stats.racesPlayed >= 10) earned.push("ten_races");
  if (stats.level >= 5) earned.push("level5");
  return earned;
}

export function useProfile() {
  const { data: session, status } = useSession();
  const isGuest = status !== "authenticated";
  const [profile, setProfile] = useState<Profile>(defaultProfile());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (isGuest) {
        if (!cancelled) setProfile(loadGuestProfile());
      } else {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setProfile(dbUserToProfile(data));
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isGuest, status]);

  const recordRace = useCallback(
    async (input: RaceResultInput) => {
      if (isGuest) {
        setProfile((prev) => {
          const coinsEarned = Math.round(input.wpm / 2) + (input.won ? 50 : 10);
          const xpEarned = Math.round(input.wpm * 3 + input.acc);
          const newXp = prev.xp + xpEarned;
          const next: Profile = {
            ...prev,
            xp: newXp,
            level: recalcLevel(newXp),
            coins: prev.coins + coinsEarned,
            bestWpm: Math.max(prev.bestWpm, input.wpm),
            racesPlayed: prev.racesPlayed + 1,
            racesWon: prev.racesWon + (input.won ? 1 : 0),
            accSum: prev.accSum + input.acc,
            history: [
              { date: new Date().toLocaleDateString(), wpm: input.wpm, acc: input.acc, maxCombo: input.maxCombo, won: input.won, mode: input.mode },
              ...prev.history,
            ].slice(0, 12),
          };
          next.achievements = computeAchievements({
            racesPlayed: next.racesPlayed,
            racesWon: next.racesWon,
            bestWpm: next.bestWpm,
            level: next.level,
            lastAcc: input.acc,
            lastMaxCombo: input.maxCombo,
          });
          saveGuestProfile(next);
          return next;
        });
        return { coinsEarned: Math.round(input.wpm / 2) + (input.won ? 50 : 10) };
      } else {
        const res = await fetch("/api/race-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (data.saved) {
          const refreshed = await fetch("/api/profile");
          if (refreshed.ok) setProfile(dbUserToProfile(await refreshed.json()));
        }
        return { coinsEarned: data.coinsEarned ?? 0 };
      }
    },
    [isGuest]
  );

  const selectCar = useCallback(
    async (carId: string) => {
      if (isGuest) {
        setProfile((prev) => {
          const next = { ...prev, selectedCar: carId };
          saveGuestProfile(next);
          return next;
        });
      } else {
        setProfile((prev) => ({ ...prev, selectedCar: carId }));
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedCar: carId }),
        });
      }
    },
    [isGuest]
  );

  const buyCar = useCallback(
    async (carId: string, cost: number) => {
      setProfile((prev) => {
        if (prev.coins < cost || prev.unlockedCars.includes(carId)) return prev;
        const next = { ...prev, coins: prev.coins - cost, unlockedCars: [...prev.unlockedCars, carId] };
        if (isGuest) saveGuestProfile(next);
        else
          fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coins: next.coins, unlockedCars: next.unlockedCars }),
          });
        return next;
      });
    },
    [isGuest]
  );

  const setName = useCallback(
    async (name: string) => {
      setProfile((prev) => {
        const next = { ...prev, name };
        if (isGuest) saveGuestProfile(next);
        else
          fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
        return next;
      });
    },
    [isGuest]
  );

  const upgradeToPro = useCallback(async () => {
    setProfile((prev) => {
      const next = { ...prev, isPro: true };
      if (isGuest) saveGuestProfile(next);
      else
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPro: true }),
        });
      return next;
    });
  }, [isGuest]);

  return { profile, loading, isGuest, recordRace, selectCar, buyCar, setName, upgradeToPro, session };
}

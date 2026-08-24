"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Profile, RaceResultInput } from "@/types";
import { recalcLevel } from "@/lib/difficulty";

// localStorage key used to persist a guest (unauthenticated) player's profile
const GUEST_KEY = "redline_guest_profile_v1";

// Fresh profile for a brand-new player
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

// Read the guest profile from localStorage, merging over defaults in case
// of missing fields (e.g. after a schema change), and falling back safely
// on the server (no window) or on parse errors.
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

// Shape of a single race result as stored in the database
interface DbRaceResult {
  wpm: number;
  accuracy: number;
  maxCombo: number;
  won: boolean;
  mode: string;
  createdAt: string;
}
// Shape of an authenticated user record as returned by the API
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

// Convert a raw DB user + race history into the app's Profile shape,
// deriving aggregate stats (best WPM, win count, accuracy sum) and
// achievements from the race history on the fly.
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
    achievements: computeAchievements({
      racesPlayed,
      racesWon,
      bestWpm,
      level: u.level,
    }),
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

// Determine which achievement badges a player has earned based on their
// cumulative stats plus the most recent race's accuracy/combo (if given).
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

// Central hook for reading and mutating the player's profile, whether
// they're a guest (persisted to localStorage) or a signed-in user
// (persisted to the DB via API routes). Every mutator branches on
// `isGuest` to pick the right persistence path.
export function useProfile() {
  const { data: session, status } = useSession();
  const isGuest = status !== "authenticated";
  const [profile, setProfile] = useState<Profile>(defaultProfile());
  const [loading, setLoading] = useState(true);

  // Load the profile whenever auth status changes (guest <-> signed in)
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
    // Avoid setting state after unmount if auth status changes mid-fetch
    return () => {
      cancelled = true;
    };
  }, [isGuest, status]);

  // Record the outcome of a finished race. For guests this computes
  // rewards locally and updates everything client-side; for signed-in
  // users the server computes rewards and we just refetch the profile.
  const recordRace = useCallback(
    async (input: RaceResultInput) => {
      if (isGuest) {
        setProfile((prev) => {
          // Coins/XP formulas mirrored below for the return value
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
            // Keep only the most recent 12 races in history
            history: [
              {
                date: new Date().toLocaleDateString(),
                wpm: input.wpm,
                acc: input.acc,
                maxCombo: input.maxCombo,
                won: input.won,
                mode: input.mode,
              },
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
        // Recomputed here since state updates above are async
        return {
          coinsEarned: Math.round(input.wpm / 2) + (input.won ? 50 : 10),
        };
      } else {
        // Server persists the result and computes rewards; refetch to sync
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
    [isGuest],
  );

  // Equip a car the player already owns
  const selectCar = useCallback(
    async (carId: string) => {
      if (isGuest) {
        setProfile((prev) => {
          const next = { ...prev, selectedCar: carId };
          saveGuestProfile(next);
          return next;
        });
      } else {
        // Optimistic local update, fire-and-forget PATCH to persist
        setProfile((prev) => ({ ...prev, selectedCar: carId }));
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedCar: carId }),
        });
      }
    },
    [isGuest],
  );

  // Purchase a car with coins, guarding against insufficient funds or
  // double-purchase inside the state updater to avoid race conditions
  const buyCar = useCallback(
    async (carId: string, cost: number) => {
      setProfile((prev) => {
        if (prev.coins < cost || prev.unlockedCars.includes(carId)) return prev;
        const next = {
          ...prev,
          coins: prev.coins - cost,
          unlockedCars: [...prev.unlockedCars, carId],
        };
        if (isGuest) saveGuestProfile(next);
        else
          fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              coins: next.coins,
              unlockedCars: next.unlockedCars,
            }),
          });
        return next;
      });
    },
    [isGuest],
  );

  // Update the player's display name
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
    [isGuest],
  );

  // Mark the player as having Pro access (unlocks Pro-only cars/content)
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

  return {
    profile,
    loading,
    isGuest,
    recordRace,
    selectCar,
    buyCar,
    setName,
    upgradeToPro,
    session,
  };
}

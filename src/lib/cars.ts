import { Car } from "@/types";

export const CARS: Car[] = [
  {
    id: "bike",
    name: "Kestrel 250",
    emoji: "🏍️",
    speed: 60,
    accel: 90,
    handling: 80,
    unlock: { type: "default" },
    desc: "Balanced starter bike. Nimble, no drama.",
  },
  {
    id: "hatch",
    name: "Volt Hatch",
    emoji: "🚗",
    speed: 68,
    accel: 75,
    handling: 70,
    unlock: { type: "level", value: 2 },
    desc: "Peppy city runner with a quick first gear.",
  },
  {
    id: "muscle",
    name: "Ember GT",
    emoji: "🚙",
    speed: 74,
    accel: 60,
    handling: 65,
    unlock: { type: "coins", value: 400 },
    desc: "Heavy hitter that rewards long combo streaks.",
  },
  {
    id: "super",
    name: "Vantablack SV",
    emoji: "🏎️",
    speed: 85,
    accel: 82,
    handling: 88,
    unlock: { type: "level", value: 6 },
    desc: "Track-tuned supercar for serious racers.",
  },
  {
    id: "hyper",
    name: "Nullpoint X1",
    emoji: "🚀",
    speed: 98,
    accel: 95,
    handling: 90,
    unlock: { type: "pro" },
    desc: "Pro-only hypercar. Absurd top speed.",
  },
];

export function isCarUnlocked(car: Car, profile: { level: number; isPro: boolean; unlockedCars: string[] }) {
  if (profile.unlockedCars.includes(car.id)) return true;
  if (car.unlock.type === "default") return true;
  if (car.unlock.type === "pro") return profile.isPro;
  if (car.unlock.type === "level") return profile.level >= car.unlock.value;
  return false;
}

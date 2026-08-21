import { Bike, Car, Truck, Bus, Rocket, type LucideIcon } from "lucide-react";

// Maps each car id from cars.ts to a distinct icon. Falls back to Car if a
// new car is ever added without an entry here.
export const CAR_ICONS: Record<string, LucideIcon> = {
  bike: Bike,
  hatch: Car,
  muscle: Truck,
  super: Bus,
  hyper: Rocket,
};

// Bots don't have a real car id, so i will give them two visually distinct icons so
// Rival and Ghost don't look identical to each other or to the player.
export const BOT_ICONS: LucideIcon[] = [Truck, Bus];

// Real human peers in multiplayer don't broadcast their selected car over
// Pusher, so cycle through this list by lane order to give each racer a
// visually distinct icon instead of everyone looking identical.
export const PEER_ICONS: LucideIcon[] = [Car, Truck, Bus, Bike, Rocket];

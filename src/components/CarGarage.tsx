"use client";

import { CARS, isCarUnlocked } from "@/lib/cars";
import { useProfile } from "@/hooks/useProfile";
import { CAR_ICONS } from "@/lib/car-icons";
import { Car as CarIcon } from "lucide-react";

export default function CarGarage() {
  // profile holds the player's progress (level, coins, owned cars, selected car)
  // selectCar equips an already-owned/unlocked car, buyCar purchases a coin-locked one
  const { profile, selectCar, buyCar } = useProfile();

  return (
    <div className="bg-asphalt-2 border border-line rounded-2xl p-5">
      <h2 className="font-display text-sm tracking-widest uppercase text-fog mb-3.5">
        Your Garage
      </h2>

      {/* Responsive grid: cards auto-wrap, each at least 220px wide */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {CARS.map((car) => {
          // Whether the player currently meets this car's unlock requirement
          const unlocked = isCarUnlocked(car, profile);
          // Whether this car is the one currently equipped
          const selected = profile.selectedCar === car.id;
          // Fall back to a generic car icon if this car has no mapped icon
          const Icon = CAR_ICONS[car.id] ?? CarIcon;

          return (
            <div
              key={car.id}
              className={`relative bg-asphalt-3 border rounded-xl p-3.5 ${selected ? "border-cyan" : "border-line"}`}
            >
              {/* Badge showing how to unlock this car, only shown while locked */}
              {!unlocked && (
                <div
                  className={`absolute top-2.5 right-2.5 text-[10px] border rounded-full px-2 py-0.5 ${car.unlock.type === "pro" ? "text-amber border-amber" : "text-dim border-line"}`}
                >
                  {car.unlock.type === "pro"
                    ? "Requires Pro"
                    : car.unlock.type === "level"
                      ? `Unlocks at Lv.${(car.unlock as { value: number }).value}`
                      : `${(car.unlock as { value: number }).value} coins`}
                </div>
              )}

              {/* Icon replaces the old emoji div. Dimmed if locked,
                  cyan if currently selected, fog-colored otherwise. */}
              <Icon
                size={36}
                strokeWidth={1.75}
                className={
                  !unlocked ? "text-dim" : selected ? "text-cyan" : "text-fog"
                }
              />

              <h3 className="font-display text-[13px] mt-2 mb-1">{car.name}</h3>
              <p className="text-[11px] text-dim leading-relaxed mb-2.5">
                {car.desc}
              </p>

              {/* Stat bars: width of the fill = stat value as a percentage */}
              {[
                { label: "Speed", value: car.speed, color: "bg-cyan" },
                { label: "Accel", value: car.accel, color: "bg-violet" },
                { label: "Handling", value: car.handling, color: "bg-pink" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-1.5 text-[10px] text-dim mb-0.5"
                >
                  {s.label}
                  <div className="flex-1 h-1 bg-line rounded overflow-hidden">
                    <div
                      className={`h-full ${s.color}`}
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))}

              {/* Action button: state depends on unlocked/selected/unlock type */}
              <div className="mt-2.5">
                {unlocked ? (
                  // Already unlocked: let the player equip it, unless it's already equipped
                  <button
                    disabled={selected}
                    onClick={() => selectCar(car.id)}
                    className={`font-display text-[11px] tracking-wider rounded-lg px-3.5 py-2 ${
                      selected
                        ? "border border-line text-dim"
                        : "bg-gradient-to-r from-violet to-cyan text-asphalt font-bold"
                    }`}
                  >
                    {selected ? "Equipped" : "Select"}
                  </button>
                ) : car.unlock.type === "coins" ? (
                  // Locked but purchasable with coins
                  <button
                    onClick={() =>
                      buyCar(car.id, (car.unlock as { value: number }).value)
                    }
                    className="font-display text-[11px] tracking-wider border border-line text-fog rounded-lg px-3.5 py-2 hover:border-cyan hover:text-white"
                  >
                    Buy · {(car.unlock as { value: number }).value} coins
                  </button>
                ) : (
                  // Locked behind level or Pro requirement, no direct action available
                  <button
                    disabled
                    className="font-display text-[11px] tracking-wider border border-line text-dim rounded-lg px-3.5 py-2 opacity-50"
                  >
                    Locked
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-dim mt-3.5">
        Unlock cars by leveling up or spending coins. The hypercar is
        Pro-exclusive.
      </p>
    </div>
  );
}

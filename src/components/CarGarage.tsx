"use client";

import { CARS, isCarUnlocked } from "@/lib/cars";
import { useProfile } from "@/hooks/useProfile";

export default function CarGarage() {
  const { profile, selectCar, buyCar } = useProfile();

  return (
    <div className="bg-asphalt-2 border border-line rounded-2xl p-5">
      <h2 className="font-display text-sm tracking-widest uppercase text-fog mb-3.5">
        Your Garage
      </h2>

      {/* Responsive card grid: as many columns as fit, each at least 220px wide */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {CARS.map((car) => {
          // Whether the player currently meets this car's unlock requirement
          // (level, coins, or Pro subscription, depending on car.unlock.type).
          const unlocked = isCarUnlocked(car, profile);
          // Whether this is the car currently equipped by the player.
          const selected = profile.selectedCar === car.id;

          return (
            <div
              key={car.id}
              className={`relative bg-asphalt-3 border rounded-xl p-3.5 ${selected ? "border-cyan" : "border-line"}`}
            >
              {/* Locked badge in the corner, only shown for cars not yet
                  unlocked. Styled amber for Pro-gated cars, dim otherwise. */}
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

              <div className="text-4xl">{car.emoji}</div>
              <h3 className="font-display text-[13px] mt-2 mb-1">{car.name}</h3>
              <p className="text-[11px] text-dim leading-relaxed mb-2.5">
                {car.desc}
              </p>

              {/* Stat bars: speed/accel/handling rendered as filled-width
                  bars, driven by each stat's 0-100 value as a percentage. */}
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

              {/* Action button, three possible states depending on the car:
                  1. unlocked → Select / Equipped
                  2. locked but coin-purchasable → Buy button
                  3. locked and not purchasable (level/Pro gated) → disabled Locked button */}
              <div className="mt-2.5">
                {unlocked ? (
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
                  <button
                    onClick={() =>
                      buyCar(car.id, (car.unlock as { value: number }).value)
                    }
                    className="font-display text-[11px] tracking-wider border border-line text-fog rounded-lg px-3.5 py-2 hover:border-cyan hover:text-white"
                  >
                    Buy · {(car.unlock as { value: number }).value} coins
                  </button>
                ) : (
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

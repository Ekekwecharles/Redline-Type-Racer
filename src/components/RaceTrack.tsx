import type { LucideIcon } from "lucide-react";

// One racer's data for a single lane: which car, its display name, and how
// far along the track it currently is (0-100%).
export interface LaneData {
  key: string;
  label: string;
  icon: LucideIcon;
  pct: number;
  isYou: boolean;
}

interface RaceTrackProps {
  lanes: LaneData[];
  // Whether the race is actively in progress, toggles the "moving" CSS
  // class (used for lane-stripe scroll animation, giving a sense of speed).
  moving: boolean;
  // Whether the player's car should get an extra glow effect for going fast.
  boosting: boolean;
}

export default function RaceTrack({ lanes, moving, boosting }: RaceTrackProps) {
  return (
    <div className="bg-asphalt-2 border border-line rounded-2xl p-4 pb-3 mb-3.5">
      {/* One lane per racer: the player first, then each bot, in whatever
          order they were passed in from the parent's `lanes` array. */}
      {lanes.map((lane) => {
        const Icon = lane.icon;
        return (
          <div
            key={lane.key}
            // "moving" class only applied while the race is active. In globals.css,
            // .lane.moving .lane-stripes runs a looping background-position animation
            // (`dash`, 0.6s linear infinite) that shifts the striped background
            // leftward, creating the illusion of road markings scrolling past.
            className={`lane relative h-11 mb-2 rounded-lg bg-asphalt-3 overflow-hidden ${moving ? "moving" : ""}`}
          >
            {/* Decorative center dashed line for the lane */}
            <div className="lane-stripes absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2" />

            {/* The car itself. Horizontal position is driven entirely by
              `left: lane.pct%`, animated smoothly via the CSS transition
              on `left` rather than manual JS animation. */}
            {/* transition-[left] duration-150 ease-linear - removed this from the div below */}
            <div
              className="vehicle absolute top-1/2 -translate-y-1/2 text-2xl "
              style={{
                left: `${lane.pct}%`,
                // Extra glow only for the player's own car: stronger
                // multi-color glow when boosting (high WPM), a subtle cyan
                // glow otherwise, and no glow at all for bot cars.
                filter:
                  lane.isYou && boosting
                    ? "drop-shadow(0 0 12px #22d3ee) drop-shadow(0 0 4px #f43f5e)"
                    : lane.isYou
                      ? "drop-shadow(0 0 5px #22d3ee)"
                      : "none",
              }}
            >
              {/* Racer name floating above the car */}
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 font-display text-[9px] text-dim whitespace-nowrap">
                {lane.label}
              </span>
              <Icon
                size={26}
                className={lane.isYou ? "text-cyan" : "text-red-400"}
              />
            </div>

            {/* Checkered finish-line strip fixed at the right edge of the lane */}
            <div className="absolute right-1.5 top-0 bottom-0 w-1.5 rounded bg-[repeating-linear-gradient(45deg,#fff_0_4px,#111_4px_8px)] opacity-85" />
          </div>
        );
      })}
    </div>
  );
}

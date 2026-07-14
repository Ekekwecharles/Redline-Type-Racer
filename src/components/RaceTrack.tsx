export interface LaneData {
  key: string;
  label: string;
  emoji: string;
  pct: number;
  isYou: boolean;
}

interface RaceTrackProps {
  lanes: LaneData[];
  moving: boolean;
  boosting: boolean;
}

export default function RaceTrack({ lanes, moving, boosting }: RaceTrackProps) {
  return (
    <div className="bg-asphalt-2 border border-line rounded-2xl p-4 pb-3 mb-3.5">
      {lanes.map((lane) => (
        <div
          key={lane.key}
          className={`lane relative h-11 mb-2 rounded-lg bg-asphalt-3 overflow-hidden ${moving ? "moving" : ""}`}
        >
          <div className="lane-stripes absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2" />
          <div
            className="vehicle absolute top-1/2 -translate-y-1/2 text-2xl transition-[left] duration-150 ease-linear"
            style={{
              left: `${lane.pct}%`,
              filter:
                lane.isYou && boosting
                  ? "drop-shadow(0 0 12px #22d3ee) drop-shadow(0 0 4px #f43f5e)"
                  : lane.isYou
                  ? "drop-shadow(0 0 5px #22d3ee)"
                  : "none",
            }}
          >
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 font-display text-[9px] text-dim whitespace-nowrap">
              {lane.label}
            </span>
            {lane.emoji}
          </div>
          <div className="absolute right-1.5 top-0 bottom-0 w-1.5 rounded bg-[repeating-linear-gradient(45deg,#fff_0_4px,#111_4px_8px)] opacity-85" />
        </div>
      ))}
    </div>
  );
}

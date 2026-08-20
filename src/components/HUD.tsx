import React from "react";

interface HUDProps {
  wpm: number;
  acc: number;
  combo: number;
  penalty: number;
}

function HUD({ wpm, acc, combo, penalty }: HUDProps) {
  const items = [
    { label: "WPM", value: wpm, color: "text-cyan" },
    { label: "Accuracy", value: `${acc}%`, color: "text-amber" },
    { label: "Combo", value: combo, color: "text-pink" },
    { label: "Setback", value: penalty, color: "text-fog" },
  ];
  return (
    <div className="flex gap-2.5 flex-wrap mb-3.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex-1 min-w-[100px] bg-asphalt-2 border border-line rounded-xl px-3.5 py-2.5"
        >
          <div className="font-display text-[10px] tracking-widest text-dim uppercase">
            {item.label}
          </div>
          <div className={`font-display text-2xl font-bold ${item.color}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default React.memo(HUD);

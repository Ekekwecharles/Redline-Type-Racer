"use client";

import { DifficultyKey, RaceSettings } from "@/types";

interface SettingsPanelProps {
  settings: RaceSettings;
  onChange: (next: RaceSettings) => void;
}

const DIFF_BUTTONS: { key: DifficultyKey; label: string }[] = [
  { key: "rookie", label: "Rookie" },
  { key: "pro", label: "Pro" },
  { key: "legend", label: "Legend" },
  { key: "custom", label: "Custom" },
];

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const set = (patch: Partial<RaceSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="bg-asphalt-2 border border-line rounded-2xl p-5 mt-4">
      <h2 className="font-display text-sm tracking-widest uppercase text-fog mb-3.5">Race Setup</h2>

      <div className="flex gap-3.5 flex-wrap">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <label className="font-display text-[11px] tracking-wider text-dim uppercase">Race mode</label>
          <select
            value={settings.raceMode}
            onChange={(e) => set({ raceMode: e.target.value as RaceSettings["raceMode"] })}
            className="bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm"
          >
            <option value="words">Word count</option>
            <option value="time">Time attack</option>
          </select>
        </div>

        {settings.raceMode === "words" ? (
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="font-display text-[11px] tracking-wider text-dim uppercase">Distance</label>
            <select
              value={settings.wordCount}
              onChange={(e) => set({ wordCount: parseInt(e.target.value) })}
              className="bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm"
            >
              <option value={25}>Sprint · 25 words</option>
              <option value={55}>Circuit · 55 words</option>
              <option value={90}>Endurance · 90 words</option>
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="font-display text-[11px] tracking-wider text-dim uppercase">Duration</label>
            <select
              value={settings.timeSeconds}
              onChange={(e) => set({ timeSeconds: parseInt(e.target.value) })}
              className="bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm"
            >
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={120}>120 seconds</option>
            </select>
          </div>
        )}
      </div>

      <div className="mt-3.5">
        <label className="font-display text-[11px] tracking-wider text-dim uppercase block mb-1.5">Difficulty</label>
        <div className="flex gap-2 flex-wrap">
          {DIFF_BUTTONS.map((b) => (
            <button
              key={b.key}
              onClick={() => set({ difficulty: b.key })}
              className={`font-display text-[11px] tracking-wider rounded-lg px-3.5 py-2.5 border ${
                settings.difficulty === b.key ? "border-cyan text-cyan bg-cyan/10" : "border-line text-fog bg-asphalt-3"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {settings.difficulty === "custom" && (
        <div className="flex gap-3.5 flex-wrap mt-3.5">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="font-display text-[11px] tracking-wider text-dim uppercase">
              Mistake setback: <span className="text-cyan">{settings.customPenalty}</span> chars
            </label>
            <input
              type="range" min={0} max={15} value={settings.customPenalty}
              onChange={(e) => set({ customPenalty: parseInt(e.target.value) })}
              className="accent-cyan"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="font-display text-[11px] tracking-wider text-dim uppercase">
              Rival 1 speed: <span className="text-cyan">{settings.customBot1}</span> wpm
            </label>
            <input
              type="range" min={20} max={100} value={settings.customBot1}
              onChange={(e) => set({ customBot1: parseInt(e.target.value) })}
              className="accent-cyan"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="font-display text-[11px] tracking-wider text-dim uppercase">
              Rival 2 speed: <span className="text-cyan">{settings.customBot2}</span> wpm
            </label>
            <input
              type="range" min={20} max={100} value={settings.customBot2}
              onChange={(e) => set({ customBot2: parseInt(e.target.value) })}
              className="accent-cyan"
            />
          </div>
        </div>
      )}

      <div className="text-[11px] text-dim bg-asphalt-3 border border-dashed border-line rounded-lg px-3 py-2 mt-3.5 leading-relaxed">
        <b className="text-fog">Difficulty note:</b> every mistake sends your car backward by the setback amount — it costs real track position, not just a typo count.
      </div>
    </div>
  );
}

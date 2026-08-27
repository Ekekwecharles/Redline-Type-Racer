"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { ACHIEVEMENTS, xpForLevel } from "@/lib/difficulty";

export default function ProfilePage() {
  const { profile, isGuest, setName, loading } = useProfile();
  // Local input state so the name field feels responsive while typing;
  // the actual save happens on blur via setName
  const [nameInput, setNameInput] = useState(profile.name);

  if (loading) return <p className="text-dim text-sm">Loading profile…</p>;

  // XP required to complete the current level, and how far into it we are
  const xpNeeded = xpForLevel(profile.level);
  const xpIntoLevel = profile.xp % xpNeeded || 0;
  const avgAcc = profile.racesPlayed
    ? Math.round(profile.accSum / profile.racesPlayed)
    : 100;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Nudge guests to create an account, since guest progress is
          browser-local only and multiplayer requires auth */}
      {isGuest && (
        <div className="text-[11px] text-dim bg-asphalt-3 border border-dashed border-line rounded-lg px-3 py-2">
          You&apos;re racing as a guest — progress is saved to this browser
          only.{" "}
          <a href="/login" className="text-cyan underline">
            Create an account
          </a>{" "}
          to save it for good and unlock online multiplayer.
        </div>
      )}

      <div className="bg-asphalt-2 border border-line rounded-2xl p-5">
        <h2 className="font-display text-sm tracking-widest uppercase text-fog mb-3.5">
          Driver Profile
        </h2>
        <div className="flex items-center gap-3.5 flex-wrap">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={() => setName(nameInput || "Racer")}
            className="max-w-[200px] bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-xs text-dim">
            Level <b className="text-white">{profile.level}</b> ·{" "}
            <b className="text-white">{xpIntoLevel}</b> / {xpNeeded} XP
          </span>
        </div>
        {/* XP progress bar toward the next level */}
        <div className="h-2.5 bg-asphalt-3 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-violet to-cyan"
            style={{
              width: `${Math.min(100, (xpIntoLevel / xpNeeded) * 100)}%`,
            }}
          />
        </div>

        {/* Quick stat tiles */}
        <div
          className="grid gap-2.5 mt-3.5"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          }}
        >
          {[
            { label: "Races", value: profile.racesPlayed },
            { label: "Wins", value: profile.racesWon },
            { label: "Best WPM", value: profile.bestWpm },
            { label: "Avg Accuracy", value: `${avgAcc}%` },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-asphalt-3 border border-line rounded-xl p-3"
            >
              <div className="font-display text-xl">{s.value}</div>
              <div className="text-[10px] text-dim uppercase tracking-wider">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All possible achievements, dimmed unless earned */}
      <div className="bg-asphalt-2 border border-line rounded-2xl p-5">
        <h2 className="font-display text-sm tracking-widest uppercase text-fog mb-3.5">
          Achievements
        </h2>
        <div className="flex flex-wrap gap-2">
          {ACHIEVEMENTS.map((a) => {
            const earned = profile.achievements.includes(a.id);
            return (
              <div
                key={a.id}
                className={`text-[11px] rounded-full px-3 py-1.5 border ${earned ? "text-amber border-amber" : "text-dim border-line"}`}
              >
                {earned ? "★" : "☆"} {a.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Race history, most recent first (already ordered upstream) */}
      <div className="bg-asphalt-2 border border-line rounded-2xl p-5">
        <h2 className="font-display text-sm tracking-widest uppercase text-fog mb-3.5">
          Recent Races
        </h2>
        {profile.history.length === 0 ? (
          <p className="text-[11px] text-dim">
            No races yet. Head to the Race tab.
          </p>
        ) : (
          <div>
            {profile.history.map((h, i) => (
              <div
                key={i}
                className="flex justify-between text-xs text-fog py-1.5 border-b border-line last:border-0"
              >
                <span>
                  {h.date} · {h.mode}
                </span>
                <span>
                  {h.wpm} wpm · {h.acc}% · {h.won ? "🏆 win" : "finish"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

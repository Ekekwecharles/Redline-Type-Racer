"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTypingCore } from "@/hooks/useTypingCore";
import { useProfile } from "@/hooks/useProfile";
import { genText } from "@/lib/words";
import { currentDifficultyConfig, defaultSettings } from "@/lib/difficulty";
import { CARS } from "@/lib/cars";
import HUD from "@/components/HUD";
import RaceTrack, { LaneData } from "@/components/RaceTrack";
import TypingPanel from "@/components/TypingPanel";
import SettingsPanel from "@/components/SettingsPanel";
import { RaceSettings } from "@/types";

interface BotState {
  key: string;
  label: string;
  wpm: number;
  pct: number;
}

export default function RacePage() {
  const { profile, recordRace } = useProfile();
  const [settings, setSettings] = useState<RaceSettings>(defaultSettings());
  const [targetText, setTargetText] = useState("");
  const [bots, setBots] = useState<BotState[]>([]);
  const [raceKey, setRaceKey] = useState(0);
  const [resultOpen, setResultOpen] = useState(false);
  const [result, setResult] = useState<{ wpm: number; acc: number; maxCombo: number; placement: number; won: boolean } | null>(null);
  const raceStartRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);

  const diff = currentDifficultyConfig(settings);
  const myCar = CARS.find((c) => c.id === profile.selectedCar) || CARS[0];

  const finishRace = useCallback(
    (finalCorrect: number, finalPenalty: number, wpm: number, acc: number, maxCombo: number) => {
      const yourPct = Math.min(96, (Math.max(0, finalCorrect - finalPenalty) / targetText.length) * 100);
      let placement = 1;
      bots.forEach((b) => {
        if (b.pct > yourPct) placement++;
      });
      const won = placement === 1;
      setResult({ wpm, acc, maxCombo, placement, won });
      setResultOpen(true);
      recordRace({ wpm, acc, maxCombo, won, mode: settings.raceMode });
      if (animRef.current) cancelAnimationFrame(animRef.current);
    },
    [bots, targetText, recordRace, settings.raceMode]
  );

  const typing = useTypingCore({
    targetText,
    penaltyPerMistake: diff.penalty,
    onComplete: () => {
      if (settings.raceMode === "words") {
        finishRace(typing.correctChars, typing.penaltyChars, typing.wpm, typing.acc, typing.maxCombo);
      }
    },
  });

  const setupRace = useCallback(() => {
    const len = settings.raceMode === "time" ? Math.max(settings.wordCount, 120) : settings.wordCount;
    const text = genText(len);
    setTargetText(text);
    setBots([
      { key: "bot1", label: `Rival · ${diff.bots[0]}wpm`, wpm: diff.bots[0], pct: 0 },
      { key: "bot2", label: `Ghost · ${diff.bots[1]}wpm`, wpm: diff.bots[1], pct: 0 },
    ]);
    setResultOpen(false);
    setResult(null);
    raceStartRef.current = null;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setRaceKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  useEffect(() => {
    setupRace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.difficulty, settings.raceMode, settings.wordCount, settings.customPenalty, settings.customBot1, settings.customBot2]);

  useEffect(() => {
    typing.reset(targetText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetText]);

  // Kick off timers / bot animation on first keystroke
  useEffect(() => {
    if (!typing.active) return;
    raceStartRef.current = typing.startTimeRef.current;

    const tick = () => {
      if (!raceStartRef.current) return;
      const elapsedMs = Date.now() - raceStartRef.current;
      const elapsedMin = elapsedMs / 60000;

      if (settings.raceMode === "time" && elapsedMs / 1000 >= settings.timeSeconds) {
        finishRace(typing.correctChars, typing.penaltyChars, typing.wpm, typing.acc, typing.maxCombo);
        return;
      }

      setBots((prev) =>
        prev.map((b) => ({ ...b, pct: Math.min(100, (b.wpm * 5 * elapsedMin / targetText.length) * 100) }))
      );

      typing.tickGauges();

      const anyBotDone = bots.some((b) => b.pct >= 100);
      if (settings.raceMode === "words" && anyBotDone && !resultOpen) {
        finishRace(typing.correctChars, typing.penaltyChars, typing.wpm, typing.acc, typing.maxCombo);
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing.active]);

  const lanes: LaneData[] = [
    { key: "you", label: `${profile.name} (You)`, emoji: myCar.emoji, pct: typing.progressPct, isYou: true },
    ...bots.map((b) => ({ key: b.key, label: b.label, emoji: "🚙", pct: Math.min(96, b.pct), isYou: false })),
  ];

  return (
    <div>
      <HUD wpm={typing.wpm} acc={typing.acc} combo={typing.combo} penalty={typing.penaltyChars} />
      <RaceTrack lanes={lanes} moving={typing.active} boosting={typing.wpm >= 55} />

      <TypingPanel
        key={raceKey}
        targetText={targetText}
        typedChars={typing.typedChars}
        typedState={typing.typedState}
        statusText={
          resultOpen && result
            ? result.won
              ? `🏁 YOU WIN! ${result.wpm} WPM · ${result.acc}% accuracy · max combo ${result.maxCombo}.`
              : `Race over — you placed #${result.placement}. Pace: ${result.wpm} WPM.`
            : typing.active
            ? "GO! Keep typing — mistakes send you backward."
            : "Click the track, then just start typing. Backspace fixes mistakes."
        }
        statusVariant={resultOpen ? (result?.won ? "win" : "lose") : "neutral"}
        onChange={typing.handleInputValue}
        disabled={typing.finished}
      />

      <div className="flex gap-2.5 items-center mt-4 flex-wrap">
        <button
          onClick={setupRace}
          className="font-display text-[11px] tracking-wider font-bold bg-gradient-to-r from-violet to-cyan text-asphalt rounded-lg px-4 py-2.5"
        >
          New Race
        </button>
        <span className="text-[11px] text-dim">
          Solo vs AI · {settings.raceMode === "words" ? `${settings.wordCount} words` : `${settings.timeSeconds}s time attack`} · {diff.label} difficulty
        </span>
      </div>

      <SettingsPanel settings={settings} onChange={setSettings} />
    </div>
  );
}

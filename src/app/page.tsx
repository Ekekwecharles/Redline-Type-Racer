// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useTypingCore } from "@/hooks/useTypingCore";
// import { useProfile } from "@/hooks/useProfile";
// import { genText } from "@/lib/words";
// import { currentDifficultyConfig, defaultSettings } from "@/lib/difficulty";
// import { CARS } from "@/lib/cars";
// import { CAR_ICONS, BOT_ICONS } from "@/lib/car-icons";
// import { Car as CarIcon } from "lucide-react";
// import HUD from "@/components/HUD";
// import RaceTrack, { LaneData } from "@/components/RaceTrack";
// import TypingPanel from "@/components/TypingPanel";
// import SettingsPanel from "@/components/SettingsPanel";
// import { RaceSettings } from "@/types";

// /**
//  * Snapshot of a single AI opponent's progress in the current race.
//  * `pct` is recalculated every animation frame based on elapsed time and `wpm`.
//  */
// interface BotState {
//   key: string;
//   label: string;
//   wpm: number;
//   pct: number;
// }

// /**
//  * RacePage
//  *
//  * Top level page for a solo-vs-AI typing race. Owns the race lifecycle:
//  * generating target text, spinning up bot opponents, driving the per-frame
//  * progress loop via requestAnimationFrame, and resolving the race into a
//  * result (win/placement/stats) once either the player or a bot finishes.
//  *
//  * Race flow at a glance:
//  * 1. `setupRace` builds a fresh target text + bot roster whenever settings change.
//  * 2. `typing` (useTypingCore) tracks the player's live input, WPM, accuracy, combo.
//  * 3. The animation-frame effect advances bot progress and checks end conditions
//  *    every tick while `typing.active` is true.
//  * 4. `finishRace` freezes the outcome, records it to the profile, and stops the loop.
//  */
// export default function RacePage() {
//   const { profile, recordRace } = useProfile();
//   const [settings, setSettings] = useState<RaceSettings>(defaultSettings());
//   const [targetText, setTargetText] = useState("");
//   const [bots, setBots] = useState<BotState[]>([]);
//   // Bumped on every new race to force TypingPanel to remount (clears its internal state).
//   const [raceKey, setRaceKey] = useState(0);
//   const [resultOpen, setResultOpen] = useState(false);
//   const [result, setResult] = useState<{
//     wpm: number;
//     acc: number;
//     maxCombo: number;
//     placement: number;
//     won: boolean;
//   } | null>(null);
//   // Wall-clock timestamp (ms) of the first keystroke, used to compute elapsed race time.
//   const raceStartRef = useRef<number | null>(null);
//   // Handle for the current requestAnimationFrame loop, so it can be cancelled cleanly.
//   const animRef = useRef<number | null>(null);

//   const diff = currentDifficultyConfig(settings);
//   const myCar = CARS.find((c) => c.id === profile.selectedCar) || CARS[0];

//   /**
//    * Finalizes the race: computes the player's finishing percentage, determines
//    * placement against the bots, builds the result object shown in the UI, and
//    * persists the outcome via `recordRace`. Also cancels the animation loop so
//    * bot/timer updates stop once the race is over.
//    */
//   const finishRace = useCallback(
//     (
//       finalCorrect: number,
//       finalPenalty: number,
//       wpm: number,
//       acc: number,
//       maxCombo: number,
//     ) => {
//       // Cap at 96% so the player's car never visually overlaps the finish line
//       // before the result modal takes over.
//       const yourPct = Math.min(
//         96,
//         (Math.max(0, finalCorrect - finalPenalty) / targetText.length) * 100,
//       );
//       let placement = 1;
//       bots.forEach((b) => {
//         if (b.pct > yourPct) placement++;
//       });
//       const won = placement === 1;
//       setResult({ wpm, acc, maxCombo, placement, won });
//       setResultOpen(true);
//       recordRace({ wpm, acc, maxCombo, won, mode: settings.raceMode });
//       if (animRef.current) cancelAnimationFrame(animRef.current);
//     },
//     [bots, targetText, recordRace, settings.raceMode],
//   );

//   // Player's live typing state (progress, WPM, accuracy, combo, correctness).
//   // onComplete only auto-finishes for "words" mode; "time" mode is finished by the timer tick below.
//   const typing = useTypingCore({
//     targetText,
//     penaltyPerMistake: diff.penalty,
//     onComplete: () => {
//       if (settings.raceMode === "words") {
//         finishRace(
//           typing.correctChars,
//           typing.penaltyChars,
//           typing.wpm,
//           typing.acc,
//           typing.maxCombo,
//         );
//       }
//     },
//   });

//   /**
//    * Resets the board for a new race: generates new target text sized to the
//    * current mode/word count, resets the bot roster to the configured speeds,
//    * clears any previous result, and bumps `raceKey` to remount the typing panel.
//    */
//   const setupRace = useCallback(() => {
//     // "time" mode needs a generous buffer of words so the player never runs out
//     // of text before the clock ends the race.
//     const len =
//       settings.raceMode === "time"
//         ? Math.max(settings.wordCount, 120)
//         : settings.wordCount;
//     const text = genText(len);
//     setTargetText(text);
//     setBots([
//       {
//         key: "bot1",
//         label: `Rival · ${diff.bots[0]}wpm`,
//         wpm: diff.bots[0],
//         pct: 0,
//       },
//       {
//         key: "bot2",
//         label: `Ghost · ${diff.bots[1]}wpm`,
//         wpm: diff.bots[1],
//         pct: 0,
//       },
//     ]);
//     setResultOpen(false);
//     setResult(null);
//     raceStartRef.current = null;
//     if (animRef.current) cancelAnimationFrame(animRef.current);
//     setRaceKey((k) => k + 1);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [settings]);

//   // Rebuild the race whenever any setting that affects text/bots/penalty changes.
//   useEffect(() => {
//     setupRace();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     settings.difficulty,
//     settings.raceMode,
//     settings.wordCount,
//     settings.customPenalty,
//     settings.customBot1,
//     settings.customBot2,
//   ]);

//   // Re-sync the typing core whenever the target text changes (new race or settings change).
//   useEffect(() => {
//     typing.reset(targetText);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [targetText]);

//   // keep latest values in a ref so `tick` always sees current data
//   const botsRef = useRef(bots);
//   useEffect(() => {
//     botsRef.current = bots;
//   }, [bots]);

//   const finishRaceRef = useRef(finishRace);
//   useEffect(() => {
//     finishRaceRef.current = finishRace;
//   }, [finishRace]);

//   const typingRef = useRef(typing);
//   useEffect(() => {
//     typingRef.current = typing;
//   }, [typing]);

//   useEffect(() => {
//     if (!typing.active) return;
//     raceStartRef.current = typing.startTimeRef.current;

//     const tick = () => {
//       if (!raceStartRef.current) return;
//       const elapsedMs = Date.now() - raceStartRef.current;
//       const elapsedMin = elapsedMs / 60000;

//       if (
//         settings.raceMode === "time" &&
//         elapsedMs / 1000 >= settings.timeSeconds
//       ) {
//         const t = typingRef.current;
//         finishRaceRef.current(
//           t.correctChars,
//           t.penaltyChars,
//           t.wpm,
//           t.acc,
//           t.maxCombo,
//         );
//         return;
//       }

//       setBots((prev) =>
//         prev.map((b) => ({
//           ...b,
//           pct: Math.min(
//             100,
//             ((b.wpm * 5 * elapsedMin) / targetText.length) * 100,
//           ),
//         })),
//       );

//       typingRef.current.tickGauges();

//       const anyBotDone = botsRef.current.some((b) => b.pct >= 100);
//       if (settings.raceMode === "words" && anyBotDone && !resultOpen) {
//         const t = typingRef.current;
//         finishRaceRef.current(
//           t.correctChars,
//           t.penaltyChars,
//           t.wpm,
//           t.acc,
//           t.maxCombo,
//         );
//         return;
//       }

//       animRef.current = requestAnimationFrame(tick);
//     };
//     animRef.current = requestAnimationFrame(tick);
//     return () => {
//       if (animRef.current) cancelAnimationFrame(animRef.current);
//     };
//   }, [
//     typing.active,
//     settings.raceMode,
//     settings.timeSeconds,
//     targetText.length,
//     resultOpen,
//   ]);

//   // Lane data passed to RaceTrack: the player's lane first, followed by each bot.
//   // Bots are capped at 96% for the same visual reason as `yourPct` above.
//   const lanes: LaneData[] = [
//     {
//       key: "you",
//       label: `${profile.name} (You)`,
//       icon: CAR_ICONS[myCar.id] ?? CarIcon,
//       pct: typing.progressPct,
//       isYou: true,
//     },
//     ...bots.map((b, i) => ({
//       key: b.key,
//       label: b.label,
//       icon: BOT_ICONS[i % BOT_ICONS.length],
//       pct: Math.min(96, b.pct),
//       isYou: false,
//     })),
//   ];

//   return (
//     <div>
//       <HUD
//         wpm={typing.wpm}
//         acc={typing.acc}
//         combo={typing.combo}
//         penalty={typing.penaltyChars}
//       />
//       <RaceTrack
//         lanes={lanes}
//         moving={typing.active}
//         boosting={typing.wpm >= 55}
//       />

//       <TypingPanel
//         key={raceKey}
//         targetText={targetText}
//         typedChars={typing.typedChars}
//         typedState={typing.typedState}
//         statusText={
//           resultOpen && result
//             ? result.won
//               ? `🏁 YOU WIN! ${result.wpm} WPM · ${result.acc}% accuracy · max combo ${result.maxCombo}.`
//               : `Race over — you placed #${result.placement}. Pace: ${result.wpm} WPM.`
//             : typing.active
//               ? "GO! Keep typing — mistakes send you backward."
//               : "Click the track, then just start typing. Backspace fixes mistakes."
//         }
//         statusVariant={resultOpen ? (result?.won ? "win" : "lose") : "neutral"}
//         onChange={typing.handleInputValue}
//         disabled={typing.finished}
//       />

//       <div className="flex gap-2.5 items-center mt-4 flex-wrap">
//         <button
//           onClick={setupRace}
//           className="font-display text-[11px] tracking-wider font-bold bg-gradient-to-r from-violet to-cyan text-asphalt rounded-lg px-4 py-2.5"
//         >
//           New Race
//         </button>
//         <span className="text-[11px] text-dim">
//           Solo vs AI ·{" "}
//           {settings.raceMode === "words"
//             ? `${settings.wordCount} words`
//             : `${settings.timeSeconds}s time attack`}{" "}
//           · {diff.label} difficulty
//         </span>
//       </div>

//       <SettingsPanel settings={settings} onChange={setSettings} />
//     </div>
//   );
// }
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTypingCore } from "@/hooks/useTypingCore";
import { useProfile } from "@/hooks/useProfile";
import { genText } from "@/lib/words";
import { currentDifficultyConfig, defaultSettings } from "@/lib/difficulty";
import { CARS } from "@/lib/cars";
import { CAR_ICONS, BOT_ICONS } from "@/lib/car-icons";
import { Car as CarIcon } from "lucide-react";
import HUD from "@/components/HUD";
import RaceTrack, { LaneData } from "@/components/RaceTrack";
import TypingPanel from "@/components/TypingPanel";
import SettingsPanel from "@/components/SettingsPanel";
import { RaceSettings } from "@/types";

/**
 * Snapshot of a single AI opponent's progress in the current race.
 * `pct` is recalculated every animation frame based on elapsed time and `wpm`.
 */
interface BotState {
  key: string;
  label: string;
  wpm: number;
  pct: number;
}

/**
 * RacePage
 *
 * Top level page for a solo-vs-AI typing race. Owns the race lifecycle:
 * generating target text, spinning up bot opponents, driving the per-frame
 * progress loop via requestAnimationFrame, and resolving the race into a
 * result (win/placement/stats) once either the player or a bot finishes.
 *
 * Race flow at a glance:
 * 1. `setupRace` builds a fresh target text + bot roster whenever settings change.
 * 2. `typing` (useTypingCore) tracks the player's live input, WPM, accuracy, combo.
 * 3. The animation-frame effect advances bot progress and checks end conditions
 *    every tick while `typing.active` is true.
 * 4. `finishRace` freezes the outcome, records it to the profile, and stops the loop.
 */
export default function RacePage() {
  const { profile, recordRace } = useProfile();
  const [settings, setSettings] = useState<RaceSettings>(defaultSettings());
  const [targetText, setTargetText] = useState("");
  const [bots, setBots] = useState<BotState[]>([]);
  // Bumped on every new race to force TypingPanel to remount (clears its internal state).
  const [raceKey, setRaceKey] = useState(0);
  const [resultOpen, setResultOpen] = useState(false);
  const [result, setResult] = useState<{
    wpm: number;
    acc: number;
    maxCombo: number;
    placement: number;
    won: boolean;
  } | null>(null);
  // Wall-clock timestamp (ms) of the first keystroke, used to compute elapsed race time.
  const raceStartRef = useRef<number | null>(null);
  // Handle for the current requestAnimationFrame loop, so it can be cancelled cleanly.
  const animRef = useRef<number | null>(null);

  const diff = currentDifficultyConfig(settings);
  const myCar = CARS.find((c) => c.id === profile.selectedCar) || CARS[0];

  /**
   * Finalizes the race: computes the player's finishing percentage, determines
   * placement against the bots, builds the result object shown in the UI, and
   * persists the outcome via `recordRace`. Also cancels the animation loop so
   * bot/timer updates stop once the race is over.
   *
   * Wrapped in useCallback because it's passed to useTypingCore's `onComplete`
   * below — keeping its identity stable avoids that hook seeing a "new" callback
   * on every render. Its deps are the actual values it reads from outside its
   * own arguments: `bots`, `targetText`, `recordRace`, `settings.raceMode`.
   */
  const finishRace = useCallback(
    (
      finalCorrect: number,
      finalPenalty: number,
      wpm: number,
      acc: number,
      maxCombo: number,
    ) => {
      // Cap at 96% so the player's car never visually overlaps the finish line
      // before the result modal takes over.
      const yourPct = Math.min(
        96,
        (Math.max(0, finalCorrect - finalPenalty) / targetText.length) * 100,
      );
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
    [bots, targetText, recordRace, settings.raceMode],
  );

  // Player's live typing state (progress, WPM, accuracy, combo, correctness).
  // onComplete only auto-finishes for "words" mode; "time" mode is finished by the timer tick below.
  const typing = useTypingCore({
    targetText,
    penaltyPerMistake: diff.penalty,
    onComplete: () => {
      if (settings.raceMode === "words") {
        finishRace(
          typing.correctChars,
          typing.penaltyChars,
          typing.wpm,
          typing.acc,
          typing.maxCombo,
        );
      }
    },
  });

  /**
   * Resets the board for a new race: generates new target text sized to the
   * current mode/word count, resets the bot roster to the configured speeds,
   * clears any previous result, and bumps `raceKey` to remount the typing panel.
   *
   * Plain function on purpose (no useCallback): it isn't passed as a prop to
   * any child and isn't used as a dependency anywhere, so memoizing it would
   * only add overhead with no benefit. It's called directly from the effect
   * below and from the "New Race" button's onClick.
   */
  function setupRace() {
    // "time" mode needs a generous buffer of words so the player never runs out
    // of text before the clock ends the race.
    const len =
      settings.raceMode === "time"
        ? Math.max(settings.wordCount, 120)
        : settings.wordCount;
    const text = genText(len);
    setTargetText(text);
    setBots([
      {
        key: "bot1",
        label: `Rival · ${diff.bots[0]}wpm`,
        wpm: diff.bots[0],
        pct: 0,
      },
      {
        key: "bot2",
        label: `Ghost · ${diff.bots[1]}wpm`,
        wpm: diff.bots[1],
        pct: 0,
      },
    ]);
    setResultOpen(false);
    setResult(null);
    raceStartRef.current = null;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setRaceKey((k) => k + 1);
  }

  // Rebuild the race whenever any setting that affects text/bots/penalty changes.
  //
  // Deliberately depends on these specific `settings.*` fields rather than on
  // `settings` itself or on `setupRace`: `settings` also holds fields (like
  // `selectedCar`) that shouldn't trigger a race reset, and depending on
  // `setupRace` would tie this effect to whatever that function happens to
  // close over rather than the exact fields we care about. If a new setting
  // is added that should reset the race, add it to this array explicitly.
  useEffect(() => {
    setupRace();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally narrower than "all values used inside setupRace"; see comment above.
  }, [
    settings.difficulty,
    settings.raceMode,
    settings.wordCount,
    settings.customPenalty,
    settings.customBot1,
    settings.customBot2,
  ]);

  // Re-sync the typing core whenever the target text changes (new race or settings change).
  useEffect(() => {
    typing.reset(targetText);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only targetText should trigger a reset; `typing` itself changes every render.
  }, [targetText]);

  // keep latest values in a ref so `tick` always sees current data
  const botsRef = useRef(bots);
  useEffect(() => {
    botsRef.current = bots;
  }, [bots]);

  const finishRaceRef = useRef(finishRace);
  useEffect(() => {
    finishRaceRef.current = finishRace;
  }, [finishRace]);

  const typingRef = useRef(typing);
  useEffect(() => {
    typingRef.current = typing;
  }, [typing]);

  useEffect(() => {
    if (!typing.active) return;
    raceStartRef.current = typing.startTimeRef.current;

    const tick = () => {
      if (!raceStartRef.current) return;
      const elapsedMs = Date.now() - raceStartRef.current;
      const elapsedMin = elapsedMs / 60000;

      if (
        settings.raceMode === "time" &&
        elapsedMs / 1000 >= settings.timeSeconds
      ) {
        const t = typingRef.current;
        finishRaceRef.current(
          t.correctChars,
          t.penaltyChars,
          t.wpm,
          t.acc,
          t.maxCombo,
        );
        return;
      }

      setBots((prev) =>
        prev.map((b) => ({
          ...b,
          pct: Math.min(
            100,
            ((b.wpm * 5 * elapsedMin) / targetText.length) * 100,
          ),
        })),
      );

      typingRef.current.tickGauges();

      const anyBotDone = botsRef.current.some((b) => b.pct >= 100);
      if (settings.raceMode === "words" && anyBotDone && !resultOpen) {
        const t = typingRef.current;
        finishRaceRef.current(
          t.correctChars,
          t.penaltyChars,
          t.wpm,
          t.acc,
          t.maxCombo,
        );
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [
    typing.active,
    settings.raceMode,
    settings.timeSeconds,
    targetText.length,
    resultOpen,
  ]);

  // Lane data passed to RaceTrack: the player's lane first, followed by each bot.
  // Bots are capped at 96% for the same visual reason as `yourPct` above.
  const lanes: LaneData[] = [
    {
      key: "you",
      label: `${profile.name} (You)`,
      icon: CAR_ICONS[myCar.id] ?? CarIcon,
      pct: typing.progressPct,
      isYou: true,
    },
    ...bots.map((b, i) => ({
      key: b.key,
      label: b.label,
      icon: BOT_ICONS[i % BOT_ICONS.length],
      pct: Math.min(96, b.pct),
      isYou: false,
    })),
  ];

  return (
    <div>
      <HUD
        wpm={typing.wpm}
        acc={typing.acc}
        combo={typing.combo}
        penalty={typing.penaltyChars}
      />
      <RaceTrack
        lanes={lanes}
        moving={typing.active}
        boosting={typing.wpm >= 55}
      />

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
          Solo vs AI ·{" "}
          {settings.raceMode === "words"
            ? `${settings.wordCount} words`
            : `${settings.timeSeconds}s time attack`}{" "}
          · {diff.label} difficulty
        </span>
      </div>

      <SettingsPanel settings={settings} onChange={setSettings} />
    </div>
  );
}

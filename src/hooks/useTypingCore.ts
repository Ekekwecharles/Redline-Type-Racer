"use client";

import { useCallback, useRef, useState } from "react";

interface UseTypingCoreArgs {
  targetText: string;
  penaltyPerMistake: number;
  onComplete?: () => void;
}

// Core typing-race logic: tracks what's been typed against a target string,
// scores correctness/combo/penalties, and derives WPM/accuracy over time.
export function useTypingCore({
  targetText,
  penaltyPerMistake,
  onComplete,
}: UseTypingCoreArgs) {
  const [typedChars, setTypedChars] = useState(0);
  // Per-character verdict: "ok" (typed correctly), "bad" (mistyped), or
  // null (not yet reached). Same length as targetText.
  const [typedState, setTypedState] = useState<Array<"ok" | "bad" | null>>(() =>
    new Array(targetText.length).fill(null),
  );
  const [correctChars, setCorrectChars] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  // Extra "penalty" characters accrued from mistakes, used to slow progress
  const [penaltyChars, setPenaltyChars] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [acc, setAcc] = useState(100);
  const [active, setActive] = useState(false); // true once the player starts typing
  const [finished, setFinished] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  // Reset all typing state, optionally for a new target text (e.g. next race)
  const reset = useCallback(
    (newText?: string) => {
      const text = newText ?? targetText;
      setTypedChars(0);
      setTypedState(new Array(text.length).fill(null));
      setCorrectChars(0);
      setMistakes(0);
      setCombo(0);
      setMaxCombo(0);
      setPenaltyChars(0);
      setWpm(0);
      setAcc(100);
      setActive(false);
      setFinished(false);
      startTimeRef.current = null;
    },
    [targetText],
  );

  // Derive WPM (standard formula: correct chars / 5 / minutes elapsed)
  // and accuracy (% of keystrokes that were correct) from current totals.
  const recomputeGauges = useCallback(
    (correct: number, mistakeCount: number) => {
      if (!startTimeRef.current) return;
      const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
      const newWpm = elapsedMin > 0 ? Math.round(correct / 5 / elapsedMin) : 0;
      const total = correct + mistakeCount;
      const newAcc = total > 0 ? Math.round((correct / total) * 100) : 100;
      setWpm(newWpm);
      setAcc(newAcc);
      return { wpm: newWpm, acc: newAcc };
    },
    [],
  );

  // Called on every keystroke/input change with the full current input value.
  // Diffs it against the previous typed length to handle both forward typing
  // and backspacing.
  const handleInputValue = useCallback(
    (value: string) => {
      if (finished) return;

      // Start the timer on the very first keystroke
      if (!active && value.length > 0) {
        setActive(true);
        startTimeRef.current = Date.now();
      }

      // Backspacing: roll back state for the removed characters
      if (value.length < typedChars) {
        setTypedState((prev) => {
          const next = [...prev];
          let correctDelta = 0;
          for (let i = value.length; i < typedChars; i++) {
            if (next[i] === "ok") correctDelta--;
            next[i] = null;
          }
          setCorrectChars((c) => c + correctDelta);
          return next;
        });
        setTypedChars(value.length);
        // Backspacing breaks the combo
        setCombo(0);
        return;
      }

      // Forward typing: score each newly typed character
      setTypedState((prev) => {
        const next = [...prev];
        let correctDelta = 0;
        let mistakeDelta = 0;
        let comboNow = combo;
        let maxComboNow = maxCombo;
        let penaltyDelta = 0;

        for (let i = typedChars; i < value.length; i++) {
          const typedCh = value[i];
          const targetCh = targetText[i];
          if (typedCh === targetCh) {
            next[i] = "ok";
            correctDelta++;
            comboNow++;
            if (comboNow > maxComboNow) maxComboNow = comboNow;
          } else {
            next[i] = "bad";
            mistakeDelta++;
            comboNow = 0; // mistake breaks the combo
            penaltyDelta += penaltyPerMistake;
          }
        }

        setCorrectChars((c) => c + correctDelta);
        setMistakes((m) => m + mistakeDelta);
        setCombo(comboNow);
        setMaxCombo(maxComboNow);
        setPenaltyChars((p) => p + penaltyDelta);

        return next;
      });

      setTypedChars(value.length);

      // Reached the end of the target text: race is complete
      if (value.length >= targetText.length) {
        setFinished(true);
        setActive(false);
        onComplete?.();
      }
    },
    [
      active,
      combo,
      maxCombo,
      finished,
      penaltyPerMistake,
      targetText,
      typedChars,
      onComplete,
    ],
  );

  // Recompute WPM/accuracy on every correctChars/mistakes change while active
  const tickGauges = useCallback(() => {
    return recomputeGauges(correctChars, mistakes);
  }, [correctChars, mistakes, recomputeGauges]);

  // Progress bar percentage, penalized by mistakes and capped below 100%
  // so the bar doesn't visually "finish" before the input actually does
  const progressPct = Math.min(
    96,
    (Math.max(0, correctChars - penaltyChars) /
      Math.max(1, targetText.length)) *
      100,
  );

  return {
    typedChars,
    typedState,
    correctChars,
    mistakes,
    combo,
    maxCombo,
    penaltyChars,
    wpm,
    acc,
    active,
    finished,
    progressPct,
    handleInputValue,
    tickGauges,
    reset,
    startTimeRef,
  };
}

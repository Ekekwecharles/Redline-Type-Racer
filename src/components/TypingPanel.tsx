"use client";

import React, { useEffect, useRef } from "react";

interface TypingPanelProps {
  targetText: string;
  typedChars: number;
  typedState: Array<"ok" | "bad" | null>;
  statusText: string;
  statusVariant: "neutral" | "win" | "lose";
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TypingPanel({
  targetText,
  typedChars,
  typedState,
  statusText,
  statusVariant,
  onChange,
  disabled,
}: TypingPanelProps) {
  // Real DOM input the user actually types into. Kept invisible and
  // focused programmatically, the visible "text" the user sees below is
  // just styled spans, not a real input.
  const inputRef = useRef<HTMLInputElement>(null);
  // Ref to whichever <span> represents the character the user is currently
  // on. Used purely for auto-scrolling that character into view.
  const currentCharRef = useRef<HTMLSpanElement | null>(null);

  // Runs whenever a new race starts (targetText changes) or the panel
  // becomes enabled/disabled. Clears any leftover input value from the
  // previous race and refocuses the hidden input so typing works instantly.
  useEffect(() => {
    if (inputRef.current) inputRef.current.value = "";
    if (!disabled) inputRef.current?.focus();
  }, [disabled, targetText]);

  // Keep the current character roughly centered in the fixed-height window
  // instead of letting the box (and the whole page) grow with the text.
  useEffect(() => {
    currentCharRef.current?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [typedChars]);

  // Color/style the status line differently depending on whether the race
  // is still in progress, won, or lost.
  const statusColor =
    statusVariant === "win"
      ? "text-cyan font-display tracking-wide"
      : statusVariant === "lose"
        ? "text-pink font-display tracking-wide"
        : "text-dim";

  return (
    // Clicking anywhere in the panel refocuses the hidden input, since the
    // input itself is invisible and easy to accidentally click off of.
    <div
      onClick={() => inputRef.current?.focus()}
      className="bg-asphalt-2 border border-line rounded-2xl px-5 py-5 cursor-text relative"
    >
      <div className="text-[19px] leading-[1.7] tracking-wide h-[98px] overflow-hidden break-words">
        {targetText.split("").map((ch, i) => {
          // Default styling for characters not yet reached.
          let cls = "char-pending";

          // Character already typed: color it based on whether it was
          // typed correctly or incorrectly, using the recorded typedState.
          if (i < typedChars)
            cls = typedState[i] === "ok" ? "char-correct" : "char-wrong";
          // The very next character the user needs to type, gets a
          // distinct "cursor" style.
          else if (i === typedChars) cls = "char-current";

          const isCurrent = i === typedChars;
          return (
            <span
              key={i}
              // Only attach the scroll-tracking ref to the current character.
              ref={isCurrent ? currentCharRef : null}
              className={cls}
            >
              {ch}
            </span>
          );
        })}
      </div>

      {/* Shows instructions, "GO!" prompt, or win/lose result text */}
      <div className={`text-xs mt-2.5 min-h-[18px] ${statusColor}`}>
        {statusText}
      </div>

      {/* The actual input element. Invisible and non-interactive by mouse
          (pointer-events-none), it only exists to capture keyboard input
          and drive onChange, all visible feedback comes from the styled
          spans above instead of this input's own text. */}
      <input
        ref={inputRef}
        className="absolute opacity-0 pointer-events-none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        disabled={disabled}
        defaultValue=""
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

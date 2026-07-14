"use client";

import { useEffect, useRef } from "react";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const currentCharRef = useRef<HTMLSpanElement | null>(null);

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

  const statusColor =
    statusVariant === "win"
      ? "text-cyan font-display tracking-wide"
      : statusVariant === "lose"
        ? "text-pink font-display tracking-wide"
        : "text-dim";

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="bg-asphalt-2 border border-line rounded-2xl px-5 py-5 cursor-text relative"
    >
      <div className="text-[19px] leading-[1.7] tracking-wide h-[98px] overflow-hidden break-words">
        {targetText.split("").map((ch, i) => {
          let cls = "char-pending";
          if (i < typedChars)
            cls = typedState[i] === "ok" ? "char-correct" : "char-wrong";
          else if (i === typedChars) cls = "char-current";
          const isCurrent = i === typedChars;
          return (
            <span
              key={i}
              ref={isCurrent ? currentCharRef : null}
              className={cls}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div className={`text-xs mt-2.5 min-h-[18px] ${statusColor}`}>
        {statusText}
      </div>
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

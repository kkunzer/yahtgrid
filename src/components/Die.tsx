"use client";

import { motion } from "framer-motion";

export type DieState = "neutral" | "selected" | "held" | "locked" | "rolling";

interface DieProps {
  value: number;
  state?: DieState;
  onClick?: () => void;
  onHoldToggle?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  "aria-label"?: string;
}

// Standard die dot positions for each face value
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

const SIZE_MAP = {
  sm: { container: "w-10 h-10", dotR: 5, viewBox: "0 0 100 100" },
  md: { container: "w-14 h-14", dotR: 7, viewBox: "0 0 100 100" },
  lg: { container: "w-16 h-16", dotR: 8, viewBox: "0 0 100 100" },
};

const STATE_STYLES: Record<DieState, string> = {
  neutral: "bg-[var(--color-die-bg)] border-[var(--color-border)] hover:border-[var(--color-primary)] cursor-pointer",
  selected: "bg-[var(--color-primary)] border-[var(--color-primary-dark)] ring-2 ring-[var(--color-primary-light)] cursor-pointer",
  held: "bg-[var(--color-accent)] border-[var(--color-accent-dark)] ring-2 ring-[var(--color-accent)] cursor-pointer",
  locked: "bg-[var(--color-surface-3)] border-[var(--color-border)] opacity-50 cursor-not-allowed",
  rolling: "bg-[var(--color-die-bg)] border-[var(--color-border)] cursor-not-allowed",
};

const STATE_DOT_COLOR: Record<DieState, string> = {
  neutral: "var(--color-die-dot)",
  selected: "white",
  held: "white",
  locked: "var(--color-muted)",
  rolling: "var(--color-die-dot)",
};

export function Die({
  value,
  state = "neutral",
  onClick,
  disabled,
  size = "md",
  "aria-label": ariaLabel,
}: DieProps) {
  const { container, dotR, viewBox } = SIZE_MAP[size];
  const dots = DOT_POSITIONS[value] ?? DOT_POSITIONS[1];
  const dotColor = STATE_DOT_COLOR[state];
  const isInteractive = !disabled && state !== "locked" && state !== "rolling";

  const handleClick = () => {
    if (isInteractive && onClick) onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === " " || e.key === "Enter") && isInteractive && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.button
      className={`
        ${container}
        rounded-xl border-2 shadow-sm
        flex items-center justify-center
        transition-all duration-150
        select-none
        ${STATE_STYLES[state]}
        ${isInteractive ? "active:scale-95" : ""}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={!isInteractive}
      aria-label={ariaLabel ?? `Die showing ${value}${state === "selected" ? ", selected" : ""}${state === "held" ? ", held for reroll" : ""}`}
      aria-pressed={state === "selected" ? true : state === "held" ? true : undefined}
      whileHover={isInteractive ? { scale: 1.05 } : {}}
      whileTap={isInteractive ? { scale: 0.92 } : {}}
      animate={state === "rolling" ? { rotate: [0, 90, 180, 270, 360] } : {}}
      transition={{ duration: 0.4 }}
    >
      <svg viewBox={viewBox} className="w-full h-full p-2" aria-hidden="true">
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={dotR} fill={dotColor} />
        ))}
      </svg>
    </motion.button>
  );
}

interface DiceRollProps {
  dice: number[];
  selectedIndices: number[];
  heldIndices: number[];
  lockedIndices?: number[];
  isRolling?: boolean;
  onSelectDie: (index: number) => void;
  onHoldDie?: (index: number) => void;
  holdMode?: boolean;
  disabled?: boolean;
}

export function DiceRoll({
  dice,
  selectedIndices,
  heldIndices,
  lockedIndices = [],
  isRolling = false,
  onSelectDie,
  onHoldDie,
  holdMode = false,
  disabled = false,
}: DiceRollProps) {
  return (
    <div
      className="flex gap-2 justify-center flex-wrap"
      role="group"
      aria-label="Current dice roll"
    >
      {dice.map((value, i) => {
        let dieState: DieState = "neutral";
        if (isRolling) dieState = "rolling";
        else if (lockedIndices.includes(i)) dieState = "locked";
        else if (selectedIndices.includes(i)) dieState = "selected";
        else if (heldIndices.includes(i)) dieState = "held";

        const handleClick = () => {
          if (holdMode && onHoldDie) {
            onHoldDie(i);
          } else {
            onSelectDie(i);
          }
        };

        return (
          <Die
            key={i}
            value={value}
            state={dieState}
            onClick={handleClick}
            disabled={disabled || isRolling}
            aria-label={`Die ${i + 1}: ${value}${dieState === "selected" ? ", selected" : ""}${dieState === "held" ? ", held" : ""}${holdMode ? ". Hold mode active" : ""}`}
          />
        );
      })}
    </div>
  );
}

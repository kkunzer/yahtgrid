"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_LABELS, CATEGORY_MAX_SCORES } from "@/engine/scoring";
import type { Category } from "@/engine/scoring";
import type { PlacedDie } from "@/store/gameStore";

interface GridRowProps {
  category: Category;
  dice: PlacedDie[];
  score: number | null;
  isComplete: boolean;
  isSelected?: boolean;
  canPlace: boolean; // selected dice can be placed here
  onClick: () => void;
  rowIndex: number;
}

const DICE_CELL_COUNT = 5;

export function GridRow({
  category,
  dice,
  score,
  isComplete,
  isSelected = false,
  canPlace,
  onClick,
}: GridRowProps) {
  const maxScore = CATEGORY_MAX_SCORES[category];
  const label = CATEGORY_LABELS[category];

  const isInteractive = !isComplete && canPlace;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === " " || e.key === "Enter") && isInteractive) {
      e.preventDefault();
      onClick();
    }
  };

  const scorePercent = score !== null && maxScore > 0 ? (score / maxScore) * 100 : 0;
  const scoreColor =
    score === null
      ? "var(--color-muted)"
      : score === 0
      ? "var(--color-error)"
      : scorePercent >= 80
      ? "var(--color-success)"
      : "var(--color-primary)";

  return (
    <motion.div
      className={`
        flex items-center gap-2 p-2 rounded-xl border-2 transition-all duration-150
        ${isComplete
          ? "border-[var(--color-border)] bg-[var(--color-surface-2)] opacity-90"
          : isSelected
          ? "border-[var(--color-primary)] bg-[var(--color-surface-2)] ring-1 ring-[var(--color-primary-light)]"
          : isInteractive
          ? "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] cursor-pointer hover:bg-[var(--color-surface-2)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-60 cursor-not-allowed"
        }
      `}
      onClick={() => isInteractive && onClick()}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isInteractive ? 0 : -1}
      aria-label={`${label} row. ${isComplete ? `Scored: ${score} points` : `${dice.length} of 5 dice placed`}${isInteractive ? ". Press to place selected dice here." : ""}`}
      aria-disabled={!isInteractive}
      aria-pressed={isSelected}
      whileHover={isInteractive ? { scale: 1.01 } : {}}
      whileTap={isInteractive ? { scale: 0.98 } : {}}
    >
      {/* Category label */}
      <div className="w-24 shrink-0 text-sm font-medium text-[var(--color-text-secondary)] truncate">
        {label}
      </div>

      {/* Dice cells */}
      <div className="flex gap-1 flex-1 justify-center" role="group" aria-label={`Dice in ${label} row`}>
        {Array.from({ length: DICE_CELL_COUNT }).map((_, i) => {
          const die = dice[i];
          return (
            <motion.div
              key={i}
              className={`
                w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold
                ${die
                  ? "border-[var(--color-primary)] bg-[var(--color-surface-3)] text-[var(--color-text)]"
                  : "border-dashed border-[var(--color-border)] bg-transparent text-[var(--color-muted)]"
                }
              `}
              initial={die ? { scale: 0.5, opacity: 0 } : {}}
              animate={die ? { scale: 1, opacity: 1 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              aria-hidden="true"
            >
              {die ? die.value : ""}
            </motion.div>
          );
        })}
      </div>

      {/* Score display */}
      <div className="w-12 shrink-0 text-right" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {isComplete && (
            <motion.span
              key="score"
              className="text-sm font-bold tabular-nums"
              style={{ color: scoreColor }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {score}
            </motion.span>
          )}
        </AnimatePresence>
        {!isComplete && (
          <span className="text-xs text-[var(--color-muted)]">
            /{maxScore}
          </span>
        )}
      </div>
    </motion.div>
  );
}

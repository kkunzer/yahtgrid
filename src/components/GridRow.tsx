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
  canPlace: boolean;
  onClick: () => void;
  rowIndex: number;
  previewScore?: number | null; // potential score if selected dice placed here
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
  previewScore,
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

  const showPreview = previewScore !== null && previewScore !== undefined && !isComplete && canPlace;

  return (
    <motion.div
      className={`
        flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all duration-150
        ${isComplete
          ? "border-[var(--color-border)] bg-[var(--color-surface-2)] opacity-90"
          : isSelected
          ? "border-[var(--color-primary)] bg-[var(--color-surface-2)] shadow-sm ring-1 ring-[var(--color-primary-light)]"
          : isInteractive
          ? "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-2)] cursor-pointer"
          : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-50 cursor-not-allowed"
        }
      `}
      onClick={() => isInteractive && onClick()}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isInteractive ? 0 : -1}
      aria-label={`${label}. ${isComplete ? `Scored: ${score} points` : `${dice.length} of 5 dice placed`}${isInteractive ? ". Press to place selected dice here." : ""}`}
      aria-disabled={!isInteractive}
      aria-pressed={isSelected}
      whileHover={isInteractive ? { scale: 1.01 } : {}}
      whileTap={isInteractive ? { scale: 0.98 } : {}}
    >
      {/* Category label */}
      <div className="w-16 shrink-0 text-xs font-medium text-[var(--color-text-secondary)] truncate leading-tight">
        {label}
      </div>

      {/* Compact dice slots */}
      <div className="flex gap-0.5 flex-1 justify-center" role="group" aria-label={`Dice in ${label}`}>
        {Array.from({ length: DICE_CELL_COUNT }).map((_, i) => {
          const die = dice[i];
          return (
            <motion.div
              key={i}
              className={`
                w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold leading-none
                ${die
                  ? "bg-[var(--color-primary)] text-white border border-[var(--color-primary-dark)]"
                  : isInteractive
                  ? "border border-dashed border-[var(--color-border)] text-transparent bg-transparent"
                  : "border border-dashed border-[var(--color-border)] opacity-40 bg-transparent"
                }
              `}
              initial={die ? { scale: 0.4, opacity: 0 } : {}}
              animate={die ? { scale: 1, opacity: 1 } : {}}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              aria-hidden="true"
            >
              {die ? die.value : ""}
            </motion.div>
          );
        })}
      </div>

      {/* Score / preview / max */}
      <div className="w-10 shrink-0 text-right" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.span
              key="score"
              className="text-xs font-bold tabular-nums"
              style={{ color: scoreColor }}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {score}
            </motion.span>
          ) : showPreview ? (
            <motion.span
              key="preview"
              className="text-xs font-semibold tabular-nums text-[var(--color-accent)]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              aria-label={`Would score ${previewScore}`}
            >
              +{previewScore}
            </motion.span>
          ) : (
            <span key="max" className="text-[10px] text-[var(--color-muted)]">
              /{maxScore}
            </span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

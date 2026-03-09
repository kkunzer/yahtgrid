"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { DiceRoll } from "./Die";
import { ROLLS_PER_GAME } from "@/engine/puzzle";

export function RollTray() {
  const {
    puzzle,
    currentRollIndex,
    selectedDiceIndices,
    placedDiceIndices,
    heldDiceIndices,
    hasRerolled,
    phase,
    selectDie,
    toggleHoldDie,
    reroll,
  } = useGameStore();

  const [holdMode, setHoldMode] = useState(false);

  if (!puzzle || phase === "idle" || phase === "complete") return null;

  const currentRoll = puzzle.rolls[currentRollIndex];
  if (!currentRoll) return null;

  const rollsRemaining = ROLLS_PER_GAME - currentRollIndex;
  const diceRemainingInRoll = 5 - placedDiceIndices.length;
  const canReroll = !hasRerolled && heldDiceIndices.length > 0 && heldDiceIndices.length < diceRemainingInRoll;

  const handleReroll = () => {
    reroll();
    setHoldMode(false);
  };

  const instructions = holdMode
    ? heldDiceIndices.length > 0
      ? `${heldDiceIndices.length} held — tap Re-roll to roll the others`
      : "Tap dice to hold them for re-roll"
    : selectedDiceIndices.length > 0
    ? `${selectedDiceIndices.length} selected — tap a row in the grid to place`
    : placedDiceIndices.length > 0
    ? `${diceRemainingInRoll} of 5 dice left to place from this roll`
    : "Tap dice to select, then tap a row to place them";

  return (
    <section
      className="w-full flex flex-col items-center gap-3 p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)]"
      aria-label="Current dice roll"
    >
      {/* Roll progress */}
      <div className="w-full flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
        <span>
          Roll <strong className="text-[var(--color-text)]">{currentRollIndex + 1}</strong> of {ROLLS_PER_GAME}
        </span>
        <span className="tabular-nums">{rollsRemaining} remaining</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5" aria-hidden="true" role="presentation">
        {Array.from({ length: ROLLS_PER_GAME }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < currentRollIndex
                ? "bg-[var(--color-primary)]"
                : i === currentRollIndex
                ? "bg-[var(--color-accent)] ring-2 ring-[var(--color-accent-dark)]"
                : "bg-[var(--color-border)]"
            }`}
          />
        ))}
      </div>

      {/* Mode indicator */}
      {!hasRerolled && (
        <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)] text-xs font-semibold w-full" role="group" aria-label="Die click mode">
          <button
            onClick={() => setHoldMode(false)}
            className={`flex-1 py-1.5 transition-colors ${
              !holdMode
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)]"
            }`}
            aria-pressed={!holdMode}
          >
            Select to Place
          </button>
          <button
            onClick={() => setHoldMode(true)}
            className={`flex-1 py-1.5 transition-colors ${
              holdMode
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)]"
            }`}
            aria-pressed={holdMode}
          >
            Hold to Re-roll
          </button>
        </div>
      )}

      {/* Dice */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRollIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          <DiceRoll
            dice={currentRoll.dice}
            selectedIndices={selectedDiceIndices}
            heldIndices={heldDiceIndices}
            lockedIndices={placedDiceIndices}
            onSelectDie={selectDie}
            onHoldDie={toggleHoldDie}
            holdMode={holdMode && !hasRerolled}
            disabled={phase !== "placing"}
          />
        </motion.div>
      </AnimatePresence>

      {/* Instructions */}
      <div
        className="text-xs text-[var(--color-text-secondary)] text-center min-h-[1.25rem]"
        aria-live="polite"
        aria-atomic="true"
      >
        {instructions}
      </div>

      {/* Re-roll button */}
      {!hasRerolled && (
        <button
          onClick={handleReroll}
          disabled={!canReroll}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all w-full justify-center
            ${canReroll
              ? "border-[var(--color-accent)] text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] hover:border-[var(--color-accent-dark)] active:scale-95"
              : "border-[var(--color-border)] text-[var(--color-muted)] cursor-not-allowed opacity-50 bg-transparent"
            }
          `}
          aria-label={
            heldDiceIndices.length === 0
              ? "Switch to Hold mode and hold dice first, then re-roll"
              : heldDiceIndices.length === 5
              ? "Hold at least one die to re-roll the others"
              : `Re-roll ${5 - heldDiceIndices.length} unheld dice`
          }
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Re-roll {heldDiceIndices.length > 0 && heldDiceIndices.length < 5 ? `(${5 - heldDiceIndices.length} dice)` : ""}
        </button>
      )}

      {hasRerolled && (
        <p className="text-xs text-[var(--color-muted)] text-center">
          Re-roll used this turn — select dice to place
        </p>
      )}
    </section>
  );
}

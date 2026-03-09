"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { scoreDice } from "@/engine/scoring";
import type { Category } from "@/engine/scoring";
import { GridRow } from "./GridRow";

const UPPER_CATEGORIES: Category[] = ["ones", "twos", "threes", "fours", "fives", "sixes"];

export function GameGrid() {
  const { rows, selectedDiceIndices, puzzle, currentRollIndex, phase, placeInRow } = useGameStore();
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const hasSelectedDice = selectedDiceIndices.length > 0;
  const isPlacing = phase === "placing";

  // Compute preview scores for selected dice against each category
  const selectedDiceValues =
    hasSelectedDice && puzzle
      ? selectedDiceIndices.map((i) => puzzle.rolls[currentRollIndex]?.dice[i]).filter(Boolean) as number[]
      : [];

  function getPreviewScore(rowIndex: number): number | null {
    if (!hasSelectedDice || selectedDiceValues.length === 0) return null;
    const row = rows[rowIndex];
    if (row.isComplete) return null;
    // Only show preview when all 5 will be placed (current + already in row = 5)
    const projectedDice = [
      ...row.dice.map((d) => d.value),
      ...selectedDiceValues,
    ];
    if (projectedDice.length !== 5) return null;
    return scoreDice(projectedDice, row.category);
  }

  const upperRows = rows.slice(0, 6);
  const lowerRows = rows.slice(6);
  const upperScores = rows.reduce((acc, row) => {
    if (row.isComplete && row.score !== null) {
      acc[row.category as string] = row.score;
    }
    return acc;
  }, {} as Record<string, number>);

  const renderRow = (row: typeof rows[0], i: number) => {
    const canPlace = isPlacing && hasSelectedDice && !row.isComplete;
    const previewScore = getPreviewScore(i);
    return (
      <GridRow
        key={row.category}
        category={row.category}
        dice={row.dice}
        score={row.score}
        isComplete={row.isComplete}
        isSelected={selectedRowIndex === i}
        canPlace={canPlace}
        previewScore={previewScore}
        onClick={() => {
          setSelectedRowIndex(i);
          placeInRow(i);
        }}
        rowIndex={i}
      />
    );
  };

  return (
    <section
      className="w-full flex flex-col gap-2"
      aria-label="Scoring grid"
      aria-live="polite"
    >
      {/* Placement hint */}
      <div className="flex items-center justify-between px-1 min-h-[1.25rem]">
        <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
          Score Grid
        </h2>
        {hasSelectedDice && isPlacing && (
          <span className="text-xs text-[var(--color-primary)] font-medium animate-pulse">
            Tap a row to place {selectedDiceIndices.length} die{selectedDiceIndices.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Two-column layout: Upper | Lower */}
      <div className="grid grid-cols-2 gap-2">
        {/* Upper section */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)] px-1 mb-0.5">
            Upper
          </p>
          {upperRows.map((row, i) => renderRow(row, i))}
        </div>

        {/* Lower section */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)] px-1 mb-0.5">
            Lower
          </p>
          {lowerRows.map((row, i) => renderRow(row, i + 6))}
        </div>
      </div>

      {/* Upper section bonus — spans full width */}
      <UpperSectionBonus scores={upperScores} />
    </section>
  );
}

function UpperSectionBonus({ scores }: { scores: Record<string, number> }) {
  const upperCats = UPPER_CATEGORIES as string[];
  const upperTotal = upperCats.reduce((sum, cat) => sum + (scores[cat] ?? 0), 0);
  const target = 63;
  const progress = Math.min(upperTotal, target);
  const hasBonus = upperTotal >= target;
  const remaining = target - upperTotal;

  return (
    <div
      className="px-2 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]"
      aria-label={`Upper section: ${upperTotal} of ${target} needed for 35 point bonus`}
    >
      <div className="flex justify-between text-[10px] text-[var(--color-text-secondary)] mb-1">
        <span className="font-medium">Upper Bonus (+35)</span>
        <span className={hasBonus ? "text-[var(--color-success)] font-bold" : ""}>
          {hasBonus ? "✓ Earned!" : `${upperTotal}/${target} — need ${remaining} more`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-all duration-500 ${hasBonus ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]"}`}
          style={{ width: `${(progress / target) * 100}%` }}
        />
      </div>
    </div>
  );
}

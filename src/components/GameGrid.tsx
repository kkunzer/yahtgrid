"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { GridRow } from "./GridRow";

export function GameGrid() {
  const { rows, selectedDiceIndices, phase, placeInRow } = useGameStore();
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const hasSelectedDice = selectedDiceIndices.length > 0;
  const isPlacing = phase === "placing";

  return (
    <section
      className="flex flex-col gap-1.5 w-full"
      aria-label="Scoring grid"
      aria-live="polite"
    >
      <div className="flex items-center justify-between px-2 mb-1">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
          Score Grid
        </h2>
        {hasSelectedDice && isPlacing && (
          <span className="text-xs text-[var(--color-primary)] font-medium animate-pulse">
            Tap a row to place {selectedDiceIndices.length} die{selectedDiceIndices.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {rows.map((row, i) => {
        const canPlace = isPlacing && hasSelectedDice && !row.isComplete;
        return (
          <GridRow
            key={row.category}
            category={row.category}
            dice={row.dice}
            score={row.score}
            isComplete={row.isComplete}
            isSelected={selectedRowIndex === i}
            canPlace={canPlace}
            onClick={() => {
              setSelectedRowIndex(i);
              placeInRow(i);
            }}
            rowIndex={i}
          />
        );
      })}

      {/* Upper section bonus indicator */}
      <UpperSectionBonus scores={rows.reduce((acc, row) => {
        if (row.isComplete && row.score !== null) {
          acc[row.category] = row.score;
        }
        return acc;
      }, {} as Record<string, number>)} />
    </section>
  );
}

function UpperSectionBonus({ scores }: { scores: Record<string, number> }) {
  const upperCats = ["ones", "twos", "threes", "fours", "fives", "sixes"];
  const upperTotal = upperCats.reduce((sum, cat) => sum + (scores[cat] ?? 0), 0);
  const target = 63;
  const progress = Math.min(upperTotal, target);
  const hasBonus = upperTotal >= target;
  const remaining = target - upperTotal;

  return (
    <div
      className="mt-1 px-2 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]"
      aria-label={`Upper section: ${upperTotal} of ${target} needed for 35 point bonus`}
    >
      <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
        <span>Upper Section Bonus</span>
        <span className={hasBonus ? "text-[var(--color-success)] font-bold" : ""}>
          {hasBonus ? "+35 ✓" : `${upperTotal}/${target} (need ${remaining} more)`}
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

"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_LABELS } from "@/engine/scoring";
import type { Category } from "@/engine/scoring";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryExample {
  dice: number[];
  score: number;
  note?: string;
}

const CATEGORY_EXAMPLES: Partial<Record<Category, CategoryExample>> = {
  ones: { dice: [1, 1, 3, 4, 5], score: 2, note: "Sum of all 1s" },
  sixes: { dice: [6, 6, 6, 2, 3], score: 18, note: "Sum of all 6s" },
  threeOfAKind: { dice: [4, 4, 4, 1, 2], score: 15, note: "Sum of all dice" },
  fourOfAKind: { dice: [3, 3, 3, 3, 5], score: 17, note: "Sum of all dice" },
  fullHouse: { dice: [2, 2, 5, 5, 5], score: 25, note: "Always 25 pts" },
  smallStraight: { dice: [1, 2, 3, 4, 6], score: 30, note: "4 in a row = 30 pts" },
  largeStraight: { dice: [2, 3, 4, 5, 6], score: 40, note: "5 in a row = 40 pts" },
  yahtzee: { dice: [6, 6, 6, 6, 6], score: 50, note: "All 5 same = 50 pts!" },
  chance: { dice: [1, 3, 4, 5, 2], score: 15, note: "Just the total sum" },
};

function DiceFace({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface-3)] text-sm font-bold text-[var(--color-text)]"
      aria-label={`Die: ${value}`}
    >
      {value}
    </span>
  );
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    dialogRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto pointer-events-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="pointer-events-auto w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl outline-none my-4" tabIndex={-1}>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] rounded-t-2xl z-10">
                <h2 id="help-title" className="text-xl font-bold text-[var(--color-text)]">
                  How to Play
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                  aria-label="Close help"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="p-5 flex flex-col gap-6">
                {/* Concept */}
                <section aria-labelledby="help-concept">
                  <h3 id="help-concept" className="font-semibold text-[var(--color-text)] mb-2">The Concept</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Each day, everyone plays the same fixed sequence of{" "}
                    <strong>13 dice rolls</strong>. Place each roll&apos;s dice into rows of a scoring grid.
                    Complete rows score points based on their category. Beat the <em>par score</em> to win!
                  </p>
                </section>

                {/* How to play */}
                <section aria-labelledby="help-howto">
                  <h3 id="help-howto" className="font-semibold text-[var(--color-text)] mb-2">How to Play</h3>
                  <ol className="text-sm text-[var(--color-text-secondary)] leading-relaxed list-decimal list-inside space-y-2">
                    <li><strong>Tap dice</strong> to select them from the current roll</li>
                    <li><strong>Tap a row</strong> in the grid to place the selected dice there</li>
                    <li>A row <strong>scores when all 5 cells are filled</strong></li>
                    <li>Each row uses a different scoring category — place wisely!</li>
                    <li>You get <strong>one re-roll per turn</strong>: hold dice you want to keep, then tap Re-roll</li>
                  </ol>
                </section>

                {/* Re-roll */}
                <section aria-labelledby="help-reroll">
                  <h3 id="help-reroll" className="font-semibold text-[var(--color-text)] mb-2">Re-roll Mechanic</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Before placing dice, you can hold some and re-roll the rest — <strong>once per turn</strong>.
                    Held dice are shown in blue. Tap the Re-roll button to roll the unselected dice.
                  </p>
                </section>

                {/* Scoring categories */}
                <section aria-labelledby="help-scoring">
                  <h3 id="help-scoring" className="font-semibold text-[var(--color-text)] mb-3">Scoring Categories</h3>

                  {/* Upper section */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-2">
                      Upper Section (score that number&apos;s sum)
                    </h4>
                    <div className="grid grid-cols-3 gap-1 text-xs text-[var(--color-text-secondary)]">
                      {["ones","twos","threes","fours","fives","sixes"].map((cat) => (
                        <span key={cat} className="px-2 py-1 rounded bg-[var(--color-surface-2)]">
                          {CATEGORY_LABELS[cat as Category]}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      Total ≥ 63 → +35 bonus!
                    </p>
                  </div>

                  {/* Lower section */}
                  <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-2">
                    Lower Section
                  </h4>
                  <div className="flex flex-col gap-2">
                    {(Object.entries(CATEGORY_EXAMPLES) as [Category, CategoryExample][]).map(([cat, ex]) => (
                      <div key={cat} className="flex items-start gap-3 p-2 rounded-xl bg-[var(--color-surface-2)]">
                        <div className="flex gap-0.5 shrink-0">
                          {ex.dice.map((d, i) => <DiceFace key={i} value={d} />)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[var(--color-text)]">
                            {CATEGORY_LABELS[cat]}
                            <span className="ml-2 font-bold text-[var(--color-primary)]">{ex.score} pts</span>
                          </div>
                          {ex.note && (
                            <div className="text-xs text-[var(--color-muted)]">{ex.note}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Sharing */}
                <section aria-labelledby="help-sharing">
                  <h3 id="help-sharing" className="font-semibold text-[var(--color-text)] mb-2">Sharing</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    After completing the puzzle, tap <strong>Copy Result</strong> to share your score as an emoji grid — without spoiling the solution!
                  </p>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

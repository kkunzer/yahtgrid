"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const { stats } = useGameStore();
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

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  // Build histogram: buckets 0-50, 51-100, 101-150, 151-200, 201+
  const buckets = [
    { label: "0–50", max: 50 },
    { label: "51–100", max: 100 },
    { label: "101–150", max: 150 },
    { label: "151–200", max: 200 },
    { label: "201+", max: Infinity },
  ];
  const bucketCounts = buckets.map(({ max }, i) => {
    const min = i === 0 ? 0 : buckets[i - 1].max + 1;
    return stats.scoreHistory.filter((s) => s >= min && s <= max).length;
  });
  const maxCount = Math.max(1, ...bucketCounts);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stats-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="pointer-events-auto w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl outline-none" tabIndex={-1}>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
                <h2 id="stats-title" className="text-xl font-bold text-[var(--color-text)]">
                  Statistics
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                  aria-label="Close statistics"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col gap-5">
                {/* Key stats */}
                {stats.gamesPlayed === 0 ? (
                  <p className="text-center text-[var(--color-text-secondary)] text-sm py-4">
                    No games played yet. Start today&apos;s puzzle!
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      {[
                        { value: stats.gamesPlayed, label: "Played" },
                        { value: `${winRate}%`, label: "Win Rate" },
                        { value: stats.currentStreak, label: "Streak" },
                        { value: stats.longestStreak, label: "Best Streak" },
                      ].map(({ value, label }) => (
                        <div key={label} className="flex flex-col gap-1">
                          <span className="text-2xl font-bold text-[var(--color-text)] tabular-nums">
                            {value}
                          </span>
                          <span className="text-xs text-[var(--color-muted)] leading-tight">{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Score histogram */}
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                        Score Distribution
                      </h3>
                      <div className="flex flex-col gap-1.5" role="list" aria-label="Score distribution histogram">
                        {buckets.map(({ label }, i) => (
                          <div key={label} className="flex items-center gap-2" role="listitem">
                            <span className="text-xs text-[var(--color-muted)] w-14 shrink-0 tabular-nums">
                              {label}
                            </span>
                            <div className="flex-1 h-6 rounded bg-[var(--color-surface-3)] overflow-hidden relative">
                              <motion.div
                                className="h-full rounded bg-[var(--color-primary)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${(bucketCounts[i] / maxCount) * 100}%` }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                aria-hidden="true"
                              />
                            </div>
                            <span className="text-xs text-[var(--color-text)] w-4 tabular-nums text-right" aria-label={`${bucketCounts[i]} games`}>
                              {bucketCounts[i]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

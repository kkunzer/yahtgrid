"use client";

import { useGameStore } from "@/store/gameStore";

interface HeaderProps {
  onOpenHelp: () => void;
  onOpenStats: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function Header({ onOpenHelp, onOpenStats }: HeaderProps) {
  const { date, puzzle, totalScore, phase, stats } = useGameStore();
  const toggleTheme = () => {
    const html = document.documentElement;
    const currentDark = html.dataset.theme === "dark";
    html.dataset.theme = currentDark ? "light" : "dark";
  };

  return (
    <header
      className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-40"
      role="banner"
    >
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Help button */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          aria-label="How to play"
          title="How to play"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r=".5" fill="currentColor" />
          </svg>
        </button>

        {/* Center: Title, date, puzzle number */}
        <div className="flex flex-col items-center flex-1 min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--color-text)]">
            YahtzGrid
          </h1>
          {date && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span>{formatDate(date)}</span>
              {puzzle && (
                <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-text-secondary)]">
                  #{puzzle.puzzleNumber}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Score, streak, stats, theme */}
        <div className="flex items-center gap-1">
          {phase !== "idle" && (
            <div
              className="flex flex-col items-center px-2"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Current score: ${totalScore}`}
            >
              <span className="text-lg font-bold text-[var(--color-primary)] tabular-nums">
                {totalScore}
              </span>
              {puzzle && (
                <span className="text-xs text-[var(--color-muted)]">
                  par {puzzle.parScore}
                </span>
              )}
            </div>
          )}

          {stats.currentStreak > 0 && (
            <div
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[var(--color-surface-2)] text-sm"
              aria-label={`Current streak: ${stats.currentStreak} days`}
              title={`${stats.currentStreak} day streak`}
            >
              <span aria-hidden="true">🔥</span>
              <span className="font-bold text-[var(--color-text)] tabular-nums">
                {stats.currentStreak}
              </span>
            </div>
          )}

          <button
            onClick={onOpenStats}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            aria-label="View statistics"
            title="Statistics"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
            </svg>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            aria-label="Toggle dark/light mode"
            title="Toggle theme"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

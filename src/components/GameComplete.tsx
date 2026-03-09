"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { CATEGORY_LABELS, CATEGORY_MAX_SCORES } from "@/engine/scoring";
import { useState } from "react";

export function GameComplete() {
  const { puzzle, totalScore, rows, stats } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  if (!puzzle) return null;

  const parScore = puzzle.parScore;
  const diff = totalScore - parScore;
  const diffStr = diff > 0 ? `+${diff} above par` : diff < 0 ? `${diff} below par` : "exactly par";
  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  // Build emoji grid for share
  const emojiRows = rows.map((row) => {
    if (!row.isComplete || row.score === null) return "⬜";
    if (row.score === 0) return "🟥";
    const max = CATEGORY_MAX_SCORES[row.category];
    if (row.score >= max * 0.8) return "🟩";
    return "🟨";
  });

  const shareText = [
    `YahtzGrid #${puzzle.puzzleNumber}`,
    `Score: ${totalScore} (par ${parScore}) ${diff >= 0 ? "✅" : "❌"}`,
    `${diffStr}`,
    "",
    emojiRows.join(""),
    "",
    "Play at yahtzgrid.app",
  ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without Clipboard API (non-HTTPS, some mobile Safari)
      try {
        const textarea = document.createElement("textarea");
        textarea.value = shareText;
        textarea.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (ok) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          setCopyFailed(true);
          setTimeout(() => setCopyFailed(false), 3000);
        }
      } catch {
        setCopyFailed(true);
        setTimeout(() => setCopyFailed(false), 3000);
      }
    }
  };

  return (
    <motion.div
      className="w-full flex flex-col items-center gap-6 p-6 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      aria-live="polite"
      aria-label="Game complete"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          className="text-4xl mb-2"
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 0.8, delay: 0.3 }}
          aria-hidden="true"
        >
          {diff >= 0 ? "🎉" : "🎲"}
        </motion.div>
        <h2 className="text-2xl font-extrabold text-[var(--color-text)]">
          Puzzle Complete!
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          Puzzle #{puzzle.puzzleNumber}
        </p>
      </div>

      {/* Score */}
      <div className="text-center">
        <div
          className="text-5xl font-black tabular-nums text-[var(--color-primary)]"
          aria-label={`Final score: ${totalScore}`}
        >
          {totalScore}
        </div>
        <div className="text-sm text-[var(--color-text-secondary)] mt-1">
          Par: <strong>{parScore}</strong> &nbsp;·&nbsp;{" "}
          <span className={diff >= 0 ? "text-[var(--color-success)] font-semibold" : "text-[var(--color-error)] font-semibold"}>
            {diffStr}
          </span>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 w-full text-center">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-[var(--color-text)]">{stats.gamesPlayed}</span>
          <span className="text-xs text-[var(--color-muted)]">Played</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-[var(--color-text)]">{winRate}%</span>
          <span className="text-xs text-[var(--color-muted)]">Win Rate</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-[var(--color-text)]">{stats.currentStreak}</span>
          <span className="text-xs text-[var(--color-muted)]">Streak</span>
        </div>
      </div>

      {/* Share */}
      <div className="w-full flex flex-col gap-2">
        <div className="font-mono text-xs p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] whitespace-pre-wrap text-[var(--color-text-secondary)]">
          {shareText}
        </div>
        <button
          onClick={handleCopy}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all border-2 border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] hover:border-[var(--color-primary-dark)] active:scale-95"
          aria-label={copied ? "Copied!" : copyFailed ? "Copy failed" : "Copy result to clipboard"}
        >
          {copied ? "✓ Copied!" : copyFailed ? "Copy failed — try manually" : "Copy Result"}
        </button>
      </div>

      {/* Row breakdown */}
      <details className="w-full">
        <summary className="text-sm text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)]">
          View score breakdown
        </summary>
        <div className="mt-3 flex flex-col gap-1">
          {rows.map((row) => (
            <div
              key={row.category}
              className="flex justify-between text-sm px-2 py-1 rounded"
            >
              <span className="text-[var(--color-text-secondary)]">
                {CATEGORY_LABELS[row.category]}
              </span>
              <span className={`font-mono font-semibold ${
                row.score === null ? "text-[var(--color-muted)]" :
                row.score === 0 ? "text-[var(--color-error)]" :
                "text-[var(--color-success)]"
              }`}>
                {row.score ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </details>
    </motion.div>
  );
}

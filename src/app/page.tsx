"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { Header } from "@/components/Header";
import { RollTray } from "@/components/RollTray";
import { GameGrid } from "@/components/GameGrid";
import { GameComplete } from "@/components/GameComplete";
import { StatsModal } from "@/components/StatsModal";
import { HelpModal } from "@/components/HelpModal";

export default function HomePage() {
  const { phase, startGame } = useGameStore();
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Auto-start game when hydrated
  useEffect(() => {
    if (hydrated && phase === "idle") {
      startGame();
    }
  }, [hydrated, phase, startGame]);

  if (!hydrated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-surface)]">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" aria-label="Loading..." role="status" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface)]">
      <Header onOpenHelp={() => setShowHelp(true)} onOpenStats={() => setShowStats(true)} />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        {phase === "idle" && (
          <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
            <div className="text-6xl" aria-hidden="true">🎲</div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">Ready to play?</h2>
            <p className="text-[var(--color-text-secondary)] max-w-sm">
              Today&apos;s puzzle is waiting. Same dice for everyone — how high can you score?
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-lg shadow-lg hover:bg-[var(--color-primary-dark)] transition-all active:scale-95"
            >
              Start Puzzle
            </button>
          </div>
        )}

        {phase === "placing" && (
          <>
            <RollTray />
            <GameGrid />
          </>
        )}

        {phase === "complete" && (
          <>
            <GameComplete />
            <GameGrid />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-[var(--color-muted)] border-t border-[var(--color-border)]">
        YahtzGrid — A new puzzle every day
      </footer>

      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

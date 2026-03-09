import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "@/engine/scoring";
import { scoreDice, computeTotalScore } from "@/engine/scoring";
import { generateDailyPuzzle, getTodayUTC } from "@/engine/puzzle";
import type { DailyPuzzle } from "@/engine/puzzle";

export type GamePhase = "idle" | "rolling" | "placing" | "complete";

export interface PlacedDie {
  value: number;
  rollIndex: number;
}

export interface RowState {
  category: Category;
  dice: PlacedDie[];
  score: number | null;
  isComplete: boolean;
}

export interface GameState {
  date: string;
  phase: GamePhase;
  puzzle: DailyPuzzle | null;
  currentRollIndex: number;
  selectedDiceIndices: number[]; // indices into current roll's dice
  placedDiceIndices: number[]; // indices already placed from current roll
  heldDiceIndices: number[]; // indices for re-roll mechanic
  hasRerolled: boolean;
  rows: RowState[];
  scores: Partial<Record<Category, number>>;
  totalScore: number;
  stats: PlayerStats;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number; // score > 50% of par
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  scoreHistory: number[];
}

const INITIAL_CATEGORIES: Category[] = [
  "ones", "twos", "threes", "fours", "fives", "sixes",
  "threeOfAKind", "fourOfAKind", "fullHouse",
  "smallStraight", "largeStraight", "yahtzee", "chance",
];

function makeInitialRows(): RowState[] {
  return INITIAL_CATEGORIES.map((cat) => ({
    category: cat,
    dice: [],
    score: null,
    isComplete: false,
  }));
}

export interface GameActions {
  startGame: () => void;
  selectDie: (diceIndex: number) => void;
  toggleHoldDie: (diceIndex: number) => void;
  reroll: () => void;
  placeInRow: (rowIndex: number) => void;
  resetForNewDay: () => void;
}

const initialStats: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: null,
  scoreHistory: [],
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      date: "",
      phase: "idle",
      puzzle: null,
      currentRollIndex: 0,
      selectedDiceIndices: [],
      placedDiceIndices: [],
      heldDiceIndices: [],
      hasRerolled: false,
      rows: makeInitialRows(),
      scores: {},
      totalScore: 0,
      stats: initialStats,

      startGame: () => {
        const today = getTodayUTC();
        const stored = get();

        // If already completed today, don't restart
        if (stored.date === today && stored.phase === "complete") return;

        // If it's a new day, reset game state (preserve stats)
        if (stored.date !== today) {
          const puzzle = generateDailyPuzzle(today);
          set({
            date: today,
            phase: "placing",
            puzzle,
            currentRollIndex: 0,
            selectedDiceIndices: [],
            placedDiceIndices: [],
            heldDiceIndices: [],
            hasRerolled: false,
            rows: makeInitialRows(),
            scores: {},
            totalScore: 0,
          });
        } else if (stored.phase === "idle") {
          const puzzle = generateDailyPuzzle(today);
          set({
            phase: "placing",
            puzzle,
          });
        }
      },

      selectDie: (diceIndex: number) => {
        const { selectedDiceIndices, phase } = get();
        if (phase !== "placing") return;

        if (selectedDiceIndices.includes(diceIndex)) {
          set({ selectedDiceIndices: selectedDiceIndices.filter((i) => i !== diceIndex) });
        } else {
          set({ selectedDiceIndices: [...selectedDiceIndices, diceIndex] });
        }
      },

      toggleHoldDie: (diceIndex: number) => {
        const { heldDiceIndices, hasRerolled, phase } = get();
        if (phase !== "placing" || hasRerolled) return;

        if (heldDiceIndices.includes(diceIndex)) {
          set({ heldDiceIndices: heldDiceIndices.filter((i) => i !== diceIndex) });
        } else {
          set({ heldDiceIndices: [...heldDiceIndices, diceIndex] });
        }
      },

      reroll: () => {
        const { puzzle, currentRollIndex, heldDiceIndices, hasRerolled, phase } = get();
        if (!puzzle || phase !== "placing" || hasRerolled) return;

        const currentDice = [...puzzle.rolls[currentRollIndex].dice];
        // NOTE: Re-rolls are intentionally deterministic and shared across all players
        // for a given puzzle date and roll index. This maintains parity so players face
        // the same re-roll outcomes and scores can be fairly compared on the leaderboard.
        const seed = puzzle.date + "-reroll-" + currentRollIndex;
        let h = 0;
        for (const c of seed) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;

        const newDice = currentDice.map((d, i) => {
          if (heldDiceIndices.includes(i)) return d;
          h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
          return (h % 6) + 1;
        });

        const updatedPuzzle = {
          ...puzzle,
          rolls: puzzle.rolls.map((r, i) =>
            i === currentRollIndex ? { dice: newDice } : r
          ),
        };

        set({ puzzle: updatedPuzzle, hasRerolled: true, selectedDiceIndices: [] });
      },

      placeInRow: (rowIndex: number) => {
        const {
          puzzle,
          currentRollIndex,
          selectedDiceIndices,
          placedDiceIndices,
          rows,
          scores,
          phase,
        } = get();

        if (!puzzle || phase !== "placing") return;
        if (selectedDiceIndices.length === 0) return;

        const targetRow = rows[rowIndex];
        if (targetRow.isComplete) return;

        // Only place selected dice that haven't already been placed
        const availableSelected = selectedDiceIndices.filter(
          (i) => !placedDiceIndices.includes(i)
        );
        if (availableSelected.length === 0) return;

        // Cap placement to the number of empty slots remaining in the row
        const slotsRemaining = 5 - targetRow.dice.length;
        const cappedSelected = availableSelected.slice(0, slotsRemaining);

        const currentDice = puzzle.rolls[currentRollIndex].dice;
        const newDiceForRow: PlacedDie[] = cappedSelected.map((idx) => ({
          value: currentDice[idx],
          rollIndex: currentRollIndex,
        }));

        const updatedRowDice = [...targetRow.dice, ...newDiceForRow];
        const isComplete = updatedRowDice.length >= 5;

        let rowScore: number | null = null;
        let newScores = { ...scores };

        if (isComplete) {
          const diceValues = updatedRowDice.slice(0, 5).map((d) => d.value);
          rowScore = scoreDice(diceValues, targetRow.category);
          newScores = { ...newScores, [targetRow.category]: rowScore };
        }

        const updatedRows = rows.map((r, i) =>
          i === rowIndex
            ? { ...r, dice: updatedRowDice, score: rowScore, isComplete }
            : r
        );

        const totalScore = computeTotalScore(newScores);

        // Track which dice from this roll have now been placed
        const newPlacedDiceIndices = [...placedDiceIndices, ...cappedSelected];
        const allDicePlacedFromRoll = newPlacedDiceIndices.length >= 5;

        // Advance to next roll only when all 5 dice from this roll are placed
        const nextRollIndex = currentRollIndex + 1;
        const allRollsUsed = allDicePlacedFromRoll && nextRollIndex >= puzzle.rolls.length;
        const allRowsComplete = updatedRows.every((r) => r.isComplete);
        const gameOver = allRollsUsed || allRowsComplete;

        const newState: Partial<GameState> = {
          rows: updatedRows,
          scores: newScores,
          totalScore,
          selectedDiceIndices: [],
        };

        if (allDicePlacedFromRoll) {
          // Move to next roll — reset roll-level state
          newState.placedDiceIndices = [];
          newState.heldDiceIndices = [];
          newState.hasRerolled = false;
        } else {
          // More dice to place from this roll
          newState.placedDiceIndices = newPlacedDiceIndices;
        }

        if (gameOver) {
          newState.phase = "complete";
          // Update stats
          const { stats, puzzle: p } = get();
          const parScore = p?.parScore ?? 0;
          const won = totalScore > parScore * 0.5;
          const today = getTodayUTC();

          const lastDate = stats.lastPlayedDate;
          const yesterday = new Date(today + "T00:00:00Z");
          yesterday.setUTCDate(yesterday.getUTCDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);

          const streak = lastDate === yesterdayStr ? stats.currentStreak + 1 : 1;

          newState.stats = {
            gamesPlayed: stats.gamesPlayed + 1,
            gamesWon: stats.gamesWon + (won ? 1 : 0),
            currentStreak: streak,
            longestStreak: Math.max(stats.longestStreak, streak),
            lastPlayedDate: today,
            scoreHistory: [...stats.scoreHistory, totalScore],
          };
        } else if (allDicePlacedFromRoll) {
          newState.currentRollIndex = nextRollIndex;
        }

        set(newState as Partial<GameState & GameActions>);
      },

      resetForNewDay: () => {
        const today = getTodayUTC();
        const puzzle = generateDailyPuzzle(today);
        set({
          date: today,
          phase: "placing",
          puzzle,
          currentRollIndex: 0,
          selectedDiceIndices: [],
          placedDiceIndices: [],
          heldDiceIndices: [],
          hasRerolled: false,
          rows: makeInitialRows(),
          scores: {},
          totalScore: 0,
        });
      },
    }),
    {
      name: "yahtzgrid-state",
      partialize: (state) => ({
        date: state.date,
        phase: state.phase,
        puzzle: state.puzzle,
        currentRollIndex: state.currentRollIndex,
        placedDiceIndices: state.placedDiceIndices,
        rows: state.rows,
        scores: state.scores,
        totalScore: state.totalScore,
        stats: state.stats,
        hasRerolled: state.hasRerolled,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const today = getTodayUTC();
        // If stored date is stale, reset game state but keep stats
        if (state.date && state.date !== today) {
          state.date = today;
          state.phase = "idle";
          state.puzzle = null;
          state.currentRollIndex = 0;
          state.selectedDiceIndices = [];
          state.placedDiceIndices = [];
          state.heldDiceIndices = [];
          state.hasRerolled = false;
          state.rows = makeInitialRows();
          state.scores = {};
          state.totalScore = 0;
        }
      },
    }
  )
);

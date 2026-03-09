import { mulberry32, dateSeed } from "./rng";
import { CATEGORIES, getBestCategory, scoreDice, computeTotalScore } from "./scoring";
import type { Category } from "./scoring";

export const ROLLS_PER_GAME = 13; // One per Yahtzee category
export const DICE_PER_ROLL = 5;

export interface DiceRoll {
  dice: number[];
}

export interface DailyPuzzle {
  date: string;
  puzzleNumber: number;
  rolls: DiceRoll[];
  parScore: number;
}

/** Launch date — puzzle #1 */
const LAUNCH_DATE = "2026-03-09";

function daysBetween(dateStr: string): number {
  const launch = new Date(LAUNCH_DATE + "T00:00:00Z");
  const target = new Date(dateStr + "T00:00:00Z");
  return Math.max(1, Math.floor((target.getTime() - launch.getTime()) / 86400000) + 1);
}

function rollDice(rng: () => number): number[] {
  return Array.from({ length: DICE_PER_ROLL }, () => Math.floor(rng() * 6) + 1);
}

/**
 * Generate the daily puzzle for a given UTC date string (YYYY-MM-DD).
 * Deterministic: same date → same output, always.
 */
export function generateDailyPuzzle(date: string): DailyPuzzle {
  const seed = dateSeed(date);
  const rng = mulberry32(seed);

  const rolls: DiceRoll[] = Array.from({ length: ROLLS_PER_GAME }, () => ({
    dice: rollDice(rng),
  }));

  const parScore = computeParScore(rolls);
  const puzzleNumber = daysBetween(date);

  return { date, puzzleNumber, rolls, parScore };
}

/**
 * Greedy par score: for each roll, pick the best remaining category.
 */
function computeParScore(rolls: DiceRoll[]): number {
  const used = new Set<Category>();
  const scores: Partial<Record<Category, number>> = {};

  for (const roll of rolls) {
    const best = getBestCategory(roll.dice, used);
    if (best) {
      scores[best] = scoreDice(roll.dice, best);
      used.add(best);
    }
  }

  // Fill remaining categories with 0
  for (const cat of CATEGORIES) {
    if (!used.has(cat)) {
      scores[cat] = 0;
    }
  }

  return computeTotalScore(scores);
}

/** Get today's UTC date as YYYY-MM-DD */
export function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

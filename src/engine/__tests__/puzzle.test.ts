import { describe, it, expect } from "vitest";
import { generateDailyPuzzle, ROLLS_PER_GAME, DICE_PER_ROLL } from "../puzzle";

describe("generateDailyPuzzle", () => {
  it("returns identical output on every call for the same date", () => {
    const a = generateDailyPuzzle("2026-03-09");
    const b = generateDailyPuzzle("2026-03-09");
    expect(a).toEqual(b);
  });

  it("returns different roll sequences for different dates", () => {
    const a = generateDailyPuzzle("2026-03-09");
    const b = generateDailyPuzzle("2026-03-10");
    expect(a.rolls).not.toEqual(b.rolls);
  });

  it("produces correct number of rolls", () => {
    const puzzle = generateDailyPuzzle("2026-03-09");
    expect(puzzle.rolls).toHaveLength(ROLLS_PER_GAME);
  });

  it("produces correct number of dice per roll", () => {
    const puzzle = generateDailyPuzzle("2026-03-09");
    puzzle.rolls.forEach((roll) => {
      expect(roll.dice).toHaveLength(DICE_PER_ROLL);
    });
  });

  it("all dice values are integers 1-6", () => {
    const puzzle = generateDailyPuzzle("2026-03-09");
    puzzle.rolls.forEach((roll) => {
      roll.dice.forEach((d) => {
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(6);
        expect(Number.isInteger(d)).toBe(true);
      });
    });
  });

  it("par score is a positive integer", () => {
    const puzzle = generateDailyPuzzle("2026-03-09");
    expect(puzzle.parScore).toBeGreaterThan(0);
    expect(Number.isInteger(puzzle.parScore)).toBe(true);
  });

  it("puzzle number is 1 for launch date", () => {
    const puzzle = generateDailyPuzzle("2026-03-09");
    expect(puzzle.puzzleNumber).toBe(1);
  });

  it("puzzle number increments daily", () => {
    const puzzle = generateDailyPuzzle("2026-03-10");
    expect(puzzle.puzzleNumber).toBe(2);
  });
});

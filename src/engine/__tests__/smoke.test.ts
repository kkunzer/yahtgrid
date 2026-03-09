import { describe, it, expect } from "vitest";
import { mulberry32, dateSeed } from "../rng";
import { generateDailyPuzzle } from "../puzzle";
import { scoreDice, CATEGORIES } from "../scoring";

describe("smoke tests", () => {
  it("RNG produces numbers in [0,1)", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("dateSeed produces different seeds for different dates", () => {
    const s1 = dateSeed("2026-03-09");
    const s2 = dateSeed("2026-03-10");
    expect(s1).not.toBe(s2);
  });

  it("all scoring categories are handled without throwing", () => {
    const dice = [1, 2, 3, 4, 5];
    for (const cat of CATEGORIES) {
      expect(() => scoreDice(dice, cat)).not.toThrow();
    }
  });

  it("generateDailyPuzzle runs without errors", () => {
    expect(() => generateDailyPuzzle("2026-03-09")).not.toThrow();
  });
});

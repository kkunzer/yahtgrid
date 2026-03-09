import { describe, it, expect } from "vitest";
import {
  scoreDice,
  getBestCategory,
  upperSectionBonus,
  computeTotalScore,
} from "../scoring";

describe("scoreDice — upper section", () => {
  it("scores ones correctly", () => {
    expect(scoreDice([1, 1, 2, 3, 4], "ones")).toBe(2);
    expect(scoreDice([2, 3, 4, 5, 6], "ones")).toBe(0);
  });
  it("scores twos correctly", () => {
    expect(scoreDice([2, 2, 2, 1, 3], "twos")).toBe(6);
    expect(scoreDice([1, 3, 4, 5, 6], "twos")).toBe(0);
  });
  it("scores threes correctly", () => {
    expect(scoreDice([3, 3, 1, 2, 4], "threes")).toBe(6);
    expect(scoreDice([1, 2, 4, 5, 6], "threes")).toBe(0);
  });
  it("scores fours correctly", () => {
    expect(scoreDice([4, 4, 4, 4, 1], "fours")).toBe(16);
    expect(scoreDice([1, 2, 3, 5, 6], "fours")).toBe(0);
  });
  it("scores fives correctly", () => {
    expect(scoreDice([5, 5, 1, 2, 3], "fives")).toBe(10);
    expect(scoreDice([1, 2, 3, 4, 6], "fives")).toBe(0);
  });
  it("scores sixes correctly", () => {
    expect(scoreDice([6, 6, 6, 6, 6], "sixes")).toBe(30);
    expect(scoreDice([1, 2, 3, 4, 5], "sixes")).toBe(0);
  });
});

describe("scoreDice — three/four of a kind", () => {
  it("three of a kind scores sum", () => {
    expect(scoreDice([3, 3, 3, 1, 2], "threeOfAKind")).toBe(12);
    expect(scoreDice([1, 2, 3, 4, 5], "threeOfAKind")).toBe(0);
  });
  it("four of a kind scores sum", () => {
    expect(scoreDice([4, 4, 4, 4, 2], "fourOfAKind")).toBe(18);
    expect(scoreDice([3, 3, 3, 1, 2], "fourOfAKind")).toBe(0);
  });
  it("five of a kind qualifies as three and four of a kind too", () => {
    expect(scoreDice([5, 5, 5, 5, 5], "threeOfAKind")).toBe(25);
    expect(scoreDice([5, 5, 5, 5, 5], "fourOfAKind")).toBe(25);
  });
});

describe("scoreDice — full house", () => {
  it("scores 25 for valid full house", () => {
    expect(scoreDice([2, 2, 3, 3, 3], "fullHouse")).toBe(25);
    expect(scoreDice([6, 6, 1, 1, 1], "fullHouse")).toBe(25);
  });
  it("scores 0 for non-full-house", () => {
    expect(scoreDice([1, 2, 3, 4, 5], "fullHouse")).toBe(0);
    expect(scoreDice([1, 1, 1, 1, 2], "fullHouse")).toBe(0);
  });
});

describe("scoreDice — straights", () => {
  it("small straight — all valid runs", () => {
    expect(scoreDice([1, 2, 3, 4, 6], "smallStraight")).toBe(30);
    expect(scoreDice([2, 3, 4, 5, 1], "smallStraight")).toBe(30);
    expect(scoreDice([3, 4, 5, 6, 1], "smallStraight")).toBe(30);
    expect(scoreDice([1, 1, 2, 3, 4], "smallStraight")).toBe(30); // duplicate ok
  });
  it("small straight — invalid", () => {
    expect(scoreDice([1, 2, 3, 5, 6], "smallStraight")).toBe(0);
  });
  it("large straight", () => {
    expect(scoreDice([1, 2, 3, 4, 5], "largeStraight")).toBe(40);
    expect(scoreDice([2, 3, 4, 5, 6], "largeStraight")).toBe(40);
    expect(scoreDice([1, 2, 3, 4, 6], "largeStraight")).toBe(0);
  });
});

describe("scoreDice — yahtzee", () => {
  it("scores 50 for five of a kind", () => {
    expect(scoreDice([3, 3, 3, 3, 3], "yahtzee")).toBe(50);
  });
  it("scores 0 otherwise", () => {
    expect(scoreDice([3, 3, 3, 3, 2], "yahtzee")).toBe(0);
  });
});

describe("scoreDice — chance", () => {
  it("scores the sum of all dice", () => {
    expect(scoreDice([1, 2, 3, 4, 5], "chance")).toBe(15);
    expect(scoreDice([6, 6, 6, 6, 6], "chance")).toBe(30);
  });
});

describe("upperSectionBonus", () => {
  it("adds 35 when upper section sums to 63+", () => {
    expect(upperSectionBonus({ ones: 3, twos: 8, threes: 12, fours: 16, fives: 20, sixes: 24 })).toBe(35);
  });
  it("no bonus when under 63", () => {
    expect(upperSectionBonus({ ones: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6 })).toBe(0);
  });
});

describe("computeTotalScore", () => {
  it("includes upper section bonus when applicable", () => {
    const scores = { ones: 5, twos: 10, threes: 15, fours: 20, fives: 25, sixes: 30, chance: 20 };
    expect(computeTotalScore(scores)).toBe(5 + 10 + 15 + 20 + 25 + 30 + 20 + 35);
  });
});

describe("getBestCategory", () => {
  it("picks yahtzee for five of a kind", () => {
    expect(getBestCategory([6, 6, 6, 6, 6], new Set())).toBe("yahtzee");
  });
  it("returns null when all categories are used", () => {
    const all = new Set(["ones","twos","threes","fours","fives","sixes","threeOfAKind","fourOfAKind","fullHouse","smallStraight","largeStraight","yahtzee","chance"] as const);
    expect(getBestCategory([1, 2, 3, 4, 5], all as never)).toBeNull();
  });
});

/**
 * Yahtzee scoring engine — pure functions, no React dependencies.
 */

export type Category =
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes"
  | "threeOfAKind"
  | "fourOfAKind"
  | "fullHouse"
  | "smallStraight"
  | "largeStraight"
  | "yahtzee"
  | "chance";

export const CATEGORIES: Category[] = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
  "threeOfAKind",
  "fourOfAKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "yahtzee",
  "chance",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  ones: "Ones",
  twos: "Twos",
  threes: "Threes",
  fours: "Fours",
  fives: "Fives",
  sixes: "Sixes",
  threeOfAKind: "3 of a Kind",
  fourOfAKind: "4 of a Kind",
  fullHouse: "Full House",
  smallStraight: "Sm. Straight",
  largeStraight: "Lg. Straight",
  yahtzee: "YAHTZEE",
  chance: "Chance",
};

export const CATEGORY_MAX_SCORES: Record<Category, number> = {
  ones: 5,
  twos: 10,
  threes: 15,
  fours: 20,
  fives: 25,
  sixes: 30,
  threeOfAKind: 30,
  fourOfAKind: 30,
  fullHouse: 25,
  smallStraight: 30,
  largeStraight: 40,
  yahtzee: 50,
  chance: 30,
};

/** Count occurrences of each die face in a 5-dice array. */
function counts(dice: number[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const d of dice) {
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return map;
}

function sum(dice: number[]): number {
  return dice.reduce((a, b) => a + b, 0);
}

/**
 * Score a set of exactly 5 dice for a given category.
 * Returns 0 if the category condition is not met.
 */
export function scoreDice(dice: number[], category: Category): number {
  const c = counts(dice);
  const vals = [...c.values()];
  const s = sum(dice);

  switch (category) {
    case "ones":
      return (c.get(1) ?? 0) * 1;
    case "twos":
      return (c.get(2) ?? 0) * 2;
    case "threes":
      return (c.get(3) ?? 0) * 3;
    case "fours":
      return (c.get(4) ?? 0) * 4;
    case "fives":
      return (c.get(5) ?? 0) * 5;
    case "sixes":
      return (c.get(6) ?? 0) * 6;
    case "threeOfAKind":
      return vals.some((v) => v >= 3) ? s : 0;
    case "fourOfAKind":
      return vals.some((v) => v >= 4) ? s : 0;
    case "fullHouse": {
      const hasThree = vals.some((v) => v === 3);
      const hasTwo = vals.some((v) => v === 2);
      return hasThree && hasTwo ? 25 : 0;
    }
    case "smallStraight": {
      const unique = new Set(dice);
      const hasSmall =
        ([1, 2, 3, 4].every((n) => unique.has(n))) ||
        ([2, 3, 4, 5].every((n) => unique.has(n))) ||
        ([3, 4, 5, 6].every((n) => unique.has(n)));
      return hasSmall ? 30 : 0;
    }
    case "largeStraight": {
      const sorted = [...new Set(dice)].sort((a, b) => a - b);
      const isLarge =
        (sorted.length === 5 &&
          (JSON.stringify(sorted) === JSON.stringify([1, 2, 3, 4, 5]) ||
           JSON.stringify(sorted) === JSON.stringify([2, 3, 4, 5, 6])));
      return isLarge ? 40 : 0;
    }
    case "yahtzee":
      return vals.some((v) => v === 5) ? 50 : 0;
    case "chance":
      return s;
    default:
      return 0;
  }
}

/**
 * Return the best available category for the given dice, maximizing score.
 * Ties are broken by category order in CATEGORIES array.
 */
export function getBestCategory(
  dice: number[],
  usedCategories: Set<Category>
): Category | null {
  let best: Category | null = null;
  let bestScore = -1;

  for (const cat of CATEGORIES) {
    if (usedCategories.has(cat)) continue;
    const s = scoreDice(dice, cat);
    if (s > bestScore) {
      bestScore = s;
      best = cat;
    }
  }

  return best;
}

/**
 * Upper section bonus: if the sum of ones through sixes is >= 63, add 35.
 */
export function upperSectionBonus(scores: Partial<Record<Category, number>>): number {
  const upper: Category[] = ["ones", "twos", "threes", "fours", "fives", "sixes"];
  const total = upper.reduce((acc, cat) => acc + (scores[cat] ?? 0), 0);
  return total >= 63 ? 35 : 0;
}

/**
 * Compute total score including upper section bonus.
 */
export function computeTotalScore(scores: Partial<Record<Category, number>>): number {
  const categoryTotal = Object.values(scores).reduce((a, b) => a + b, 0);
  return categoryTotal + upperSectionBonus(scores);
}

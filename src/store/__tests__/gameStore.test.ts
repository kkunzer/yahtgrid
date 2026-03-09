import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/gameStore";
import type { RowState } from "@/store/gameStore";
import type { Category } from "@/engine/scoring";

const INITIAL_CATEGORIES: Category[] = [
  "ones", "twos", "threes", "fours", "fives", "sixes",
  "threeOfAKind", "fourOfAKind", "fullHouse",
  "smallStraight", "largeStraight", "yahtzee", "chance",
];

const mockPuzzle = {
  date: "2026-03-09",
  puzzleNumber: 1,
  parScore: 100,
  rolls: Array.from({ length: 13 }, () => ({ dice: [1, 2, 3, 4, 5] })),
};

function makeRow(category: Category, diceValues: number[] = []): RowState {
  return {
    category,
    dice: diceValues.map((v) => ({ value: v, rollIndex: 0 })),
    score: null,
    isComplete: false,
  };
}

function makeInitialRows(): RowState[] {
  return INITIAL_CATEGORIES.map((cat) => makeRow(cat));
}

describe("gameStore — placeInRow dice cap", () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({
      date: "2026-03-09",
      phase: "placing",
      puzzle: mockPuzzle,
      currentRollIndex: 0,
      selectedDiceIndices: [],
      placedDiceIndices: [],
      heldDiceIndices: [],
      hasRerolled: false,
      rows: makeInitialRows(),
      scores: {},
      totalScore: 0,
    });
  });

  it("should cap placed dice at 5 when row already has 3 dice and 3 are selected", () => {
    const rows = makeInitialRows();
    rows[0] = makeRow("ones", [1, 1, 1]); // 3 dice already placed, 2 slots remain
    useGameStore.setState({ rows, selectedDiceIndices: [0, 1, 2] }); // 3 dice selected
    useGameStore.getState().placeInRow(0);
    const { rows: updatedRows } = useGameStore.getState();
    expect(updatedRows[0].dice.length).toBe(5);
  });

  it("should add only remaining slots worth of dice when row is partially filled", () => {
    const rows = makeInitialRows();
    rows[0] = makeRow("ones", [1, 1, 1]); // 3 dice, 2 slots left
    useGameStore.setState({ rows, selectedDiceIndices: [0, 1, 2] }); // 3 selected, only 2 fit
    useGameStore.getState().placeInRow(0);
    const { rows: updatedRows } = useGameStore.getState();
    // Only 2 more dice should be added (filling to 5)
    expect(updatedRows[0].dice.length).toBe(5);
    const newDice = updatedRows[0].dice.slice(3);
    expect(newDice.length).toBe(2);
  });

  it("should never exceed 5 dice regardless of how many are selected", () => {
    const rows = makeInitialRows();
    rows[0] = makeRow("ones", [1]); // 1 die, 4 slots left
    useGameStore.setState({ rows, selectedDiceIndices: [0, 1, 2, 3, 4] }); // all 5 selected
    useGameStore.getState().placeInRow(0);
    const { rows: updatedRows } = useGameStore.getState();
    expect(updatedRows[0].dice.length).toBeLessThanOrEqual(5);
    expect(updatedRows[0].dice.length).toBe(5);
  });

  it("should mark row complete and compute score when filled to 5 via cap", () => {
    const rows = makeInitialRows();
    rows[0] = makeRow("ones", [1, 1, 1]); // 3 dice already
    useGameStore.setState({ rows, selectedDiceIndices: [0, 1, 2] }); // 3 selected, 2 slots
    useGameStore.getState().placeInRow(0);
    const { rows: updatedRows } = useGameStore.getState();
    expect(updatedRows[0].isComplete).toBe(true);
    expect(updatedRows[0].score).not.toBeNull();
    expect(typeof updatedRows[0].score).toBe("number");
  });

  it("should allow placing exactly 5 dice when row is empty", () => {
    useGameStore.setState({ selectedDiceIndices: [0, 1, 2, 3, 4] });
    useGameStore.getState().placeInRow(0);
    const { rows: updatedRows } = useGameStore.getState();
    expect(updatedRows[0].dice.length).toBe(5);
    expect(updatedRows[0].isComplete).toBe(true);
  });

  it("should allow placing fewer than 5 dice when row is empty", () => {
    useGameStore.setState({ selectedDiceIndices: [0, 1] }); // only 2 selected
    useGameStore.getState().placeInRow(0);
    const { rows: updatedRows } = useGameStore.getState();
    expect(updatedRows[0].dice.length).toBe(2);
    expect(updatedRows[0].isComplete).toBe(false);
  });

  it("should not place any dice when row is already complete", () => {
    const rows = makeInitialRows();
    rows[0] = {
      category: "ones",
      dice: [1, 2, 3, 4, 5].map((v) => ({ value: v, rollIndex: 0 })),
      score: 1,
      isComplete: true,
    };
    useGameStore.setState({ rows, selectedDiceIndices: [0, 1, 2] });
    useGameStore.getState().placeInRow(0);
    const { rows: updatedRows } = useGameStore.getState();
    expect(updatedRows[0].dice.length).toBe(5); // unchanged
  });

  it("should not place dice when no dice are selected", () => {
    useGameStore.setState({ selectedDiceIndices: [] });
    useGameStore.getState().placeInRow(0);
    const { rows: updatedRows } = useGameStore.getState();
    expect(updatedRows[0].dice.length).toBe(0); // nothing added
  });

  it("should not place already-placed dice indices again", () => {
    // Dice 0 and 1 were already placed in a previous action
    useGameStore.setState({
      selectedDiceIndices: [0, 1, 2],
      placedDiceIndices: [0, 1], // 0 and 1 already placed
    });
    useGameStore.getState().placeInRow(0);
    const { rows: updatedRows } = useGameStore.getState();
    // Only die at index 2 should be placed (indices 0 and 1 excluded)
    expect(updatedRows[0].dice.length).toBe(1);
  });

  it("should advance to next roll when all 5 dice from current roll are placed", () => {
    useGameStore.setState({ selectedDiceIndices: [0, 1, 2, 3, 4] });
    useGameStore.getState().placeInRow(0);
    const state = useGameStore.getState();
    // All 5 dice placed → advance roll
    expect(state.currentRollIndex).toBe(1);
    expect(state.placedDiceIndices).toEqual([]);
  });
});

describe("gameStore — selectDie", () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({
      date: "2026-03-09",
      phase: "placing",
      puzzle: mockPuzzle,
      currentRollIndex: 0,
      selectedDiceIndices: [],
      placedDiceIndices: [],
      heldDiceIndices: [],
      hasRerolled: false,
      rows: makeInitialRows(),
      scores: {},
      totalScore: 0,
    });
  });

  it("should add die index when not already selected", () => {
    useGameStore.getState().selectDie(2);
    expect(useGameStore.getState().selectedDiceIndices).toContain(2);
  });

  it("should remove die index when already selected (toggle)", () => {
    useGameStore.setState({ selectedDiceIndices: [1, 2, 3] });
    useGameStore.getState().selectDie(2);
    expect(useGameStore.getState().selectedDiceIndices).not.toContain(2);
    expect(useGameStore.getState().selectedDiceIndices).toContain(1);
    expect(useGameStore.getState().selectedDiceIndices).toContain(3);
  });

  it("should not select dice when phase is not placing", () => {
    useGameStore.setState({ phase: "idle" });
    useGameStore.getState().selectDie(0);
    expect(useGameStore.getState().selectedDiceIndices).toHaveLength(0);
  });
});

describe("gameStore — toggleHoldDie", () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({
      date: "2026-03-09",
      phase: "placing",
      puzzle: mockPuzzle,
      currentRollIndex: 0,
      selectedDiceIndices: [],
      placedDiceIndices: [],
      heldDiceIndices: [],
      hasRerolled: false,
      rows: makeInitialRows(),
      scores: {},
      totalScore: 0,
    });
  });

  it("should add die to held when not already held", () => {
    useGameStore.getState().toggleHoldDie(1);
    expect(useGameStore.getState().heldDiceIndices).toContain(1);
  });

  it("should remove die from held when already held", () => {
    useGameStore.setState({ heldDiceIndices: [0, 1, 2] });
    useGameStore.getState().toggleHoldDie(1);
    expect(useGameStore.getState().heldDiceIndices).not.toContain(1);
  });

  it("should not hold dice after reroll has already been used", () => {
    useGameStore.setState({ hasRerolled: true });
    useGameStore.getState().toggleHoldDie(0);
    expect(useGameStore.getState().heldDiceIndices).toHaveLength(0);
  });
});

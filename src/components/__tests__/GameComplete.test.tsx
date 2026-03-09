import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";

// Mock framer-motion
vi.mock("framer-motion", async () => {
  const { forwardRef, createElement } = await import("react");
  return {
    motion: {
      div: forwardRef(function MotionDiv(
        { children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any,
        ref: any
      ) {
        return createElement("div", { ...props, ref }, children);
      }),
      span: forwardRef(function MotionSpan(
        { children, initial, animate, exit, transition, ...props }: any,
        ref: any
      ) {
        return createElement("span", { ...props, ref }, children);
      }),
    },
    AnimatePresence: function AnimatePresence({ children }: any) {
      return children;
    },
  };
});

const mockRows = [
  { category: "ones", dice: [{ value: 1, rollIndex: 0 }, { value: 1, rollIndex: 0 }, { value: 2, rollIndex: 0 }, { value: 3, rollIndex: 0 }, { value: 4, rollIndex: 0 }], score: 2, isComplete: true },
  { category: "twos", dice: [{ value: 2, rollIndex: 1 }, { value: 2, rollIndex: 1 }, { value: 1, rollIndex: 1 }, { value: 3, rollIndex: 1 }, { value: 4, rollIndex: 1 }], score: 4, isComplete: true },
  { category: "threes", dice: [], score: null, isComplete: false },
  { category: "fours", dice: [], score: null, isComplete: false },
  { category: "fives", dice: [], score: null, isComplete: false },
  { category: "sixes", dice: [], score: null, isComplete: false },
  { category: "threeOfAKind", dice: [], score: null, isComplete: false },
  { category: "fourOfAKind", dice: [], score: null, isComplete: false },
  { category: "fullHouse", dice: [], score: null, isComplete: false },
  { category: "smallStraight", dice: [], score: null, isComplete: false },
  { category: "largeStraight", dice: [], score: null, isComplete: false },
  { category: "yahtzee", dice: [], score: null, isComplete: false },
  { category: "chance", dice: [], score: null, isComplete: false },
];

const mockStats = {
  gamesPlayed: 5,
  gamesWon: 3,
  currentStreak: 2,
  longestStreak: 4,
  lastPlayedDate: "2026-03-08",
  scoreHistory: [80, 100, 120, 90, 110],
};

const mockPuzzle = {
  date: "2026-03-09",
  puzzleNumber: 1,
  parScore: 100,
  rolls: Array.from({ length: 13 }, () => ({ dice: [1, 2, 3, 4, 5] })),
};

vi.mock("@/store/gameStore", () => ({
  useGameStore: () => ({
    puzzle: mockPuzzle,
    totalScore: 120,
    rows: mockRows,
    stats: mockStats,
  }),
}));

const { GameComplete } = await import("@/components/GameComplete");

/** Helper: click copy button and flush all pending promises/microtasks */
async function clickCopyButton() {
  const copyButton = screen.getByRole("button", { name: /copy result to clipboard/i });
  await act(async () => {
    fireEvent.click(copyButton);
  });
}

/** Ensure document.execCommand exists (jsdom doesn't include it by default) */
function defineExecCommand(returnValue: boolean | (() => never)) {
  const fn = typeof returnValue === "function"
    ? vi.fn().mockImplementation(returnValue)
    : vi.fn().mockReturnValue(returnValue);
  Object.defineProperty(document, "execCommand", {
    value: fn,
    configurable: true,
    writable: true,
  });
  return fn;
}

describe("GameComplete — rendering", () => {
  it("should render 'Puzzle Complete!' heading", () => {
    render(<GameComplete />);
    expect(screen.getByText("Puzzle Complete!")).toBeInTheDocument();
  });

  it("should display the total score via aria-label", () => {
    render(<GameComplete />);
    expect(screen.getByLabelText(/final score: 120/i)).toBeInTheDocument();
  });

  it("should display puzzle number", () => {
    render(<GameComplete />);
    expect(screen.getByText(/puzzle #1/i)).toBeInTheDocument();
  });

  it("should display par score comparison", () => {
    render(<GameComplete />);
    expect(screen.getByText(/par:/i)).toBeInTheDocument();
  });

  it("should display Copy Result button initially", () => {
    render(<GameComplete />);
    expect(
      screen.getByRole("button", { name: /copy result to clipboard/i })
    ).toBeInTheDocument();
  });

  it("should display games played stat", () => {
    render(<GameComplete />);
    // gamesPlayed = 5, displayed in stats section
    expect(screen.getByText("Played")).toBeInTheDocument();
  });

  it("should include 'YahtzGrid #1' in the rendered share text", () => {
    render(<GameComplete />);
    // "YahtzGrid #1" only appears in the share text div, not elsewhere
    expect(screen.getByText(/YahtzGrid #1/)).toBeInTheDocument();
  });

  it("should include 'par 100' in the share text display", () => {
    render(<GameComplete />);
    expect(screen.getByText(/par 100/)).toBeInTheDocument();
  });
});

describe("GameComplete — clipboard copy success", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should show 'Copied!' after successful clipboard write", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<GameComplete />);
    await clickCopyButton();

    expect(screen.getByText(/✓ Copied!/i)).toBeInTheDocument();
    expect(writeTextMock).toHaveBeenCalledOnce();
  });

  it("should call clipboard.writeText with share text containing puzzle info", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<GameComplete />);
    await clickCopyButton();

    expect(writeTextMock).toHaveBeenCalledOnce();
    const shareText: string = writeTextMock.mock.calls[0][0];
    expect(shareText).toContain("YahtzGrid #1");
    expect(shareText).toContain("120");
    expect(shareText).toContain("par 100");
  });

  it("should change button aria-label to 'Copied!' after successful copy", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<GameComplete />);
    await clickCopyButton();

    // Component sets aria-label="Copied!" when copied=true
    expect(screen.getByRole("button", { name: /^Copied!$/ })).toBeInTheDocument();
  });
});

describe("GameComplete — clipboard copy fallback (execCommand)", () => {
  beforeEach(() => {
    // Always define execCommand since jsdom may not have it
    defineExecCommand(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fall back to execCommand when clipboard API throws", async () => {
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("Not available")) },
      configurable: true,
      writable: true,
    });
    // Override to return success
    defineExecCommand(true);

    render(<GameComplete />);
    await clickCopyButton();

    expect(screen.getByText(/✓ Copied!/i)).toBeInTheDocument();
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("should show 'Copy failed' when clipboard fails and execCommand returns false", async () => {
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("Not available")) },
      configurable: true,
      writable: true,
    });
    defineExecCommand(false);

    render(<GameComplete />);
    await clickCopyButton();

    await waitFor(() => {
      expect(screen.getByText(/copy failed — try manually/i)).toBeInTheDocument();
    });
  });

  it("should show 'Copy failed' when both clipboard and execCommand throw", async () => {
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("Not available")) },
      configurable: true,
      writable: true,
    });
    defineExecCommand(() => { throw new Error("execCommand not supported"); });

    render(<GameComplete />);
    await clickCopyButton();

    await waitFor(() => {
      expect(screen.getByText(/copy failed — try manually/i)).toBeInTheDocument();
    });
  });

  it("should show 'Copy failed' when navigator.clipboard is undefined", async () => {
    // Simulate environment where clipboard API is completely unavailable
    Object.defineProperty(window.navigator, "clipboard", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    defineExecCommand(false);

    render(<GameComplete />);
    await clickCopyButton();

    await waitFor(() => {
      expect(screen.getByText(/copy failed — try manually/i)).toBeInTheDocument();
    });
  });

  it("should show 'Copy failed' button label when copy fails", async () => {
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("Not available")) },
      configurable: true,
      writable: true,
    });
    defineExecCommand(false);

    render(<GameComplete />);
    await clickCopyButton();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /copy failed/i })).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock framer-motion to avoid animation complexity in tests
vi.mock("framer-motion", async () => {
  const { forwardRef, createElement, Fragment } = await import("react");
  return {
    motion: {
      div: forwardRef(function MotionDiv(
        {
          children,
          initial: _initial,
          animate: _animate,
          exit: _exit,
          transition: _transition,
          whileHover: _whileHover,
          whileTap: _whileTap,
          ...props
        }: import("react").HTMLAttributes<HTMLDivElement> & {
          initial?: unknown;
          animate?: unknown;
          exit?: unknown;
          transition?: unknown;
          whileHover?: unknown;
          whileTap?: unknown;
        },
        ref: import("react").ForwardedRef<HTMLDivElement>
      ) {
        return createElement("div", { ...props, ref }, children);
      }),
      span: forwardRef(function MotionSpan(
        {
          children,
          initial: _initial,
          animate: _animate,
          exit: _exit,
          ...props
        }: import("react").HTMLAttributes<HTMLSpanElement> & {
          initial?: unknown;
          animate?: unknown;
          exit?: unknown;
        },
        ref: import("react").ForwardedRef<HTMLSpanElement>
      ) {
        return createElement("span", { ...props, ref }, children);
      }),
    },
    AnimatePresence: ({ children }: { children: import("react").ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

// Mock zustand game store
vi.mock("@/store/gameStore", () => ({
  useGameStore: () => ({
    stats: {
      gamesPlayed: 5,
      gamesWon: 3,
      currentStreak: 2,
      longestStreak: 4,
      lastPlayedDate: "2026-03-08",
      scoreHistory: [80, 100, 120, 90, 110],
    },
  }),
}));

// Import after mocks are set up
const { StatsModal } = await import("@/components/StatsModal");

describe("StatsModal — rendering", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render dialog with role=dialog when open", () => {
    render(<StatsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should have aria-modal=true on the dialog element", () => {
    render(<StatsModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("should render Statistics heading", () => {
    render(<StatsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Statistics")).toBeInTheDocument();
  });

  it("should not render dialog content when closed (isOpen=false)", () => {
    render(<StatsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should display stats when games have been played", () => {
    render(<StatsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("5")).toBeInTheDocument(); // gamesPlayed
  });
});

describe("StatsModal — focus trap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should close when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<StatsModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should not fire onClose when Escape is pressed and modal is closed", () => {
    const onClose = vi.fn();
    render(<StatsModal isOpen={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should trap Tab focus — wrap from last focusable element to first", () => {
    const onClose = vi.fn();
    render(<StatsModal isOpen={true} onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled"));

    expect(focusable.length).toBeGreaterThan(0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus the last element, then Tab should wrap to first
    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(first);
  });

  it("should trap Shift+Tab focus — wrap from first focusable element to last", () => {
    const onClose = vi.fn();
    render(<StatsModal isOpen={true} onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled"));

    expect(focusable.length).toBeGreaterThan(0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus the first element, then Shift+Tab should wrap to last
    first.focus();
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("should not intercept Tab when focused element is not at boundary", () => {
    render(<StatsModal isOpen={true} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled"));

    // With multiple focusable elements, Tab on a middle element should not trap
    if (focusable.length > 2) {
      const middle = focusable[1];
      middle.focus();
      const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      document.dispatchEvent(event);
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    }
  });

  it("should call onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<StatsModal isOpen={true} onClose={onClose} />);
    const closeButton = screen.getByRole("button", { name: /close statistics/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should clean up keydown listener when modal closes", () => {
    const onClose = vi.fn();
    const { rerender } = render(<StatsModal isOpen={true} onClose={onClose} />);

    // Close the modal
    rerender(<StatsModal isOpen={false} onClose={onClose} />);

    // Escape should no longer trigger onClose after unmount/close
    onClose.mockClear();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});

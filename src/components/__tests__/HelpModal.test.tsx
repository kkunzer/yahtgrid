import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock framer-motion to avoid animation complexity in tests
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
    },
    AnimatePresence: function AnimatePresence({ children }: any) {
      return children;
    },
  };
});

// Import after mocks are set up
const { HelpModal } = await import("@/components/HelpModal");

describe("HelpModal — rendering", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render dialog with role=dialog when open", () => {
    render(<HelpModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should have aria-modal=true on the dialog element", () => {
    render(<HelpModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("should render 'How to Play' h2 heading", () => {
    render(<HelpModal isOpen={true} onClose={vi.fn()} />);
    // Use heading level 2 to distinguish from the "How to Play" section h3
    expect(screen.getByRole("heading", { level: 2, name: "How to Play" })).toBeInTheDocument();
  });

  it("should not render dialog content when closed", () => {
    render(<HelpModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("HelpModal — focus trap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should close when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should not fire onClose when Escape is pressed and modal is closed", () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should trap Tab focus — wrap from last focusable element to first", () => {
    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

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
    render(<HelpModal isOpen={true} onClose={vi.fn()} />);

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

  it("should call onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    const closeButton = screen.getByRole("button", { name: /close help/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should clean up keydown listener when modal closes", () => {
    const onClose = vi.fn();
    const { rerender } = render(<HelpModal isOpen={true} onClose={onClose} />);

    // Close the modal
    rerender(<HelpModal isOpen={false} onClose={onClose} />);

    // Escape should no longer trigger after close
    onClose.mockClear();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should have aria-labelledby pointing to help title", () => {
    render(<HelpModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "help-title");
  });
});

# PLAN.md — Daily Puzzle Game: Fresh Take on Classic Rules

## Overview

This document covers the analysis, concept selection, and full implementation plan for a viral daily puzzle game that re-interprets classic game rules. The product should deliver quick (5–15 min) daily engagement, be highly replayable, and provide a sleek accessible experience on any device.

---

## Phase 0: Concept Selection

Three candidates were evaluated. One is selected for implementation. The others are documented for future consideration.

---

### Option A: "NumField" — Minesweeper × Nonogram

**Core Mechanic:**
A grid (e.g. 7×7) where each cell either contains a hidden die value (1–6) or is a blank "mine." Row and column clues reveal Minesweeper-style information: how many mines, total sum of visible values, whether a row contains a straight/pair/etc. Players deduce cell contents using logic alone — no guessing allowed.

**Daily Engagement:**
Seed the grid daily. Same puzzle for every player. Shareable result (emoji grid showing which cells were correctly deduced).

**Pros:** Pure deduction, zero luck, elegant to share, high replayability, Minesweeper nostalgia without being a clone.

**Cons:** Risk of "unsolvable without guessing" states requiring careful puzzle generation. Complex constraint solver needed for authoring valid puzzles.

---

### Option B: "YahtzGrid" — Yahtzee × Spatial Placement *(SELECTED)*

**Core Mechanic:**
Each day, players receive a fixed sequence of pre-determined dice rolls (5 dice per roll, ~10 rolls total). Players must place each roll's five dice one-at-a-time into rows of an expanding grid. When a row is complete (5 cells filled), it scores like a Yahtzee category (three-of-a-kind, straight, full house, Yahtzee, etc.). The goal is to maximize total score from the fixed dice. Since dice are identical for all players, scores can be directly compared. A "par score" is published each day, creating a meaningful benchmark.

**Daily Engagement:**
Fixed daily seed = identical experience for everyone. Share score + grid emoji. Leaderboard via simple score submission. Strategy layer: which row do I target with these dice? Risk/reward when holding for a better category.

**Pros:** Familiar Yahtzee scoring everyone already knows, spatial strategy layer makes it distinct, natural shareability, mobile-friendly tap-to-place, adjustable difficulty, zero deduction complexity for puzzle generation.

**Cons:** Yahtzee scoring rules need clear in-app explanation for non-Yahtzee players.

---

### Option C: "SolitSort" — FreeCell × Ordered Logic

**Core Mechanic:**
A known-solvable daily arrangement of numbered colored cards (all face-up, FreeCell style) stacked in columns. Players must sort all cards into four foundation piles using a limited number of temporary holding spaces. Twist: certain move sequences trigger "combos" (e.g. moving three sequential cards at once gives a bonus move slot). Score is determined by moves used versus the minimum proven solution.

**Pros:** Pure planning, satisfying to watch "fall into place," proven FreeCell format.

**Cons:** Higher cognitive load, harder to explain combos simply, less shareable result format, puzzle authoring requires pre-solved valid games.

---

## Selected Concept: **YahtzGrid**

**Rationale:**
- Yahtzee scoring is the most universally recognized of all options — players who have never played Minesweeper or FreeCell still know "three of a kind"
- Fixed daily dice = trivial puzzle generation (date-seeded RNG, no constraint solver needed)
- Score optimization creates genuine strategy without deduction complexity
- Natural "par score" benchmark drives discussion and return visits
- Emoji-grid share format (like Wordle) is straightforward to implement
- Mobile-first drag-or-tap placement works naturally
- No Graeco-Latin square logic involved

**Working Title:** *YahtzGrid* (rename before launch)

---

## Technical Approach

### Stack
- **Framework:** Next.js 15 (App Router) with TypeScript
- **Styling:** Tailwind CSS v4 with custom design tokens (accessible color palette, WCAG AA minimum)
- **Animations:** Framer Motion (dice roll, placement, score popups)
- **State:** Zustand (game state) + localStorage (daily persistence, stats)
- **Seeding:** Mulberry32 seeded RNG — date string as seed input
- **Sharing:** Clipboard API (text share) + Canvas API (image share card)
- **Testing:** Vitest + React Testing Library

### Architecture Principles
- Fully client-side — no backend required for MVP
- Game engine is a pure TypeScript module (no React dependencies) — fully testable
- Daily puzzle state auto-saved to localStorage; completing the day's puzzle locks the board
- Responsive grid: single-column mobile, wider layout on tablet/desktop
- All interactive elements keyboard-navigable; ARIA live regions for score updates

---

## Implementation Tasks

Tasks are ordered by dependency. Each is sized for a single agent session.

---

### Task 1: Project Initialization
**Description:** Bootstrap the Next.js 15 project with TypeScript, Tailwind CSS v4, ESLint, Prettier, and Vitest. Establish folder structure: `src/engine/`, `src/components/`, `src/store/`, `src/app/`.

**Acceptance Criteria:**
- `pnpm dev` starts the dev server with no errors
- `pnpm test` runs Vitest with a passing smoke test
- `pnpm lint` passes with zero warnings
- Tailwind configured with a custom color palette (primary, surface, accent, error, muted)
- Folder structure matches the defined architecture

**Dependencies:** None

---

### Task 2: Daily Seed & Dice Generation Engine
**Description:** Implement a deterministic seeded RNG (Mulberry32). Create a `generateDailyPuzzle(date: string)` function that produces a repeatable sequence of dice rolls (10 rolls × 5 dice, values 1–6) and a computed "par score." Write unit tests verifying the same date always produces the same rolls.

**Acceptance Criteria:**
- `generateDailyPuzzle("2026-03-09")` returns identical output on every call
- Different dates return different roll sequences
- All dice values are integers 1–6
- Par score is computed using the optimal greedy placement strategy
- 100% unit test coverage on the engine module

**Dependencies:** Task 1

---

### Task 3: Yahtzee Scoring Engine
**Description:** Implement all standard Yahtzee scoring categories as pure functions: Ones–Sixes, Three of a Kind, Four of a Kind, Full House, Small Straight, Large Straight, Yahtzee (five of a kind), Chance. Add a `scoreDice(dice: number[], category: Category): number` function and a `getBestCategory(dice: number[], usedCategories: Set<Category>): Category` for par calculation.

**Acceptance Criteria:**
- All 13 categories correctly score per official Yahtzee rules
- Edge cases covered: Yahtzee bonus scoring, upper-section bonus (sum ≥ 63)
- `getBestCategory` returns the highest-scoring available category
- 100% unit test coverage with explicit test cases for each category and edge case

**Dependencies:** Task 1

---

### Task 4: Game State Store
**Description:** Implement Zustand store managing: current roll index, placed dice per row, completed rows with scores, used categories, total score, game phase (idle/rolling/placing/complete). Integrate localStorage persistence so refreshing mid-game restores state. Add daily-reset logic: if stored date ≠ today, clear state.

**Acceptance Criteria:**
- Game state survives page refresh
- Stale day's state is cleared automatically on new day
- Store actions: `startGame`, `selectDie`, `placeInRow`, `completeRow`, `endGame`
- All state transitions are valid (no placing after game complete, etc.)
- Zustand devtools enabled in development

**Dependencies:** Tasks 2, 3

---

### Task 5: Core Layout & Design System
**Description:** Build the top-level page layout: header (title, date, streak badge), main game area, footer (stats, help). Define reusable Tailwind components (tokens, spacing scale). Implement dark/light mode via CSS variables. Ensure layout is responsive: stacked on mobile, side-by-side on desktop.

**Acceptance Criteria:**
- Layout renders correctly at 320px, 768px, and 1280px widths
- Dark mode toggled via system preference (`prefers-color-scheme`) with manual override
- No horizontal scroll on any tested viewport
- Color contrast ratio ≥ 4.5:1 for all text (WCAG AA)
- Header shows current date and player's current streak

**Dependencies:** Task 1

---

### Task 6: Dice Component
**Description:** Build a `<Die>` component rendering a die face (1–6) using SVG dots or Unicode. States: neutral, selected (highlighted), locked (already placed), rolling (animation). Build `<DiceRoll>` to display the current set of 5 dice. Tapping/clicking a die selects/deselects it for placement.

**Acceptance Criteria:**
- Die faces visually match standard die dot patterns
- Rolling animation plays when a new roll arrives (Framer Motion)
- Selected state is visually distinct and announced to screen readers (`aria-pressed`)
- Keyboard: Tab to focus, Space/Enter to select/deselect
- Works correctly on touch devices (no hover dependency)

**Dependencies:** Task 5

---

### Task 7: Grid & Row Components
**Description:** Build `<GameGrid>` displaying 10 rows × 5 cells. Each row has: 5 cell slots, a category label, and a score display. Build `<GridRow>` with states: empty, partially filled, complete (scored). Tapping a row with selected dice triggers placement. Show which categories are still available.

**Acceptance Criteria:**
- Grid renders all 10 rows with correct visual hierarchy
- Filled cells display the die value with appropriate styling
- Completed rows show the Yahtzee category name and points earned
- Unavailable categories are visually dimmed
- Row targets are keyboard-navigable and screen-reader-labelled
- Grid is scrollable on small screens without breaking layout

**Dependencies:** Tasks 4, 6

---

### Task 8: Game Flow & Interaction Logic
**Description:** Wire the full game loop: load today's puzzle → display first roll → player selects dice → player targets a row → dice placed → row scored if complete → next roll loaded → repeat until all rolls placed → game complete. Implement the "hold" mechanic: player can hold up to 5 dice and re-roll the rest (one re-roll per roll). Update store on each action.

**Acceptance Criteria:**
- Full game is playable end-to-end without errors
- Re-roll mechanic correctly replaces only non-held dice
- Re-rolls are limited to one per turn (button disabled after use)
- Placing dice triggers score calculation and visual feedback
- Undo is not supported (irreversible placement, by design)
- Game ends when all rolls are exhausted and displays final score

**Dependencies:** Tasks 3, 4, 7

---

### Task 9: Score Feedback & Animations
**Description:** Implement score popup animations when a row completes ("+25 Full House!" floating text). Show running total in the header. Animate dice sliding from roll tray into grid cells. Add celebratory animation on game complete (confetti or pulse effect). Respect `prefers-reduced-motion`.

**Acceptance Criteria:**
- Score popup appears within 200ms of row completion
- Popup text is readable at all viewport sizes
- Animation is skipped/simplified when `prefers-reduced-motion: reduce` is set
- Running score in header updates after every placement
- Final screen shows total score, par score, and diff ("3 above par!")

**Dependencies:** Task 8

---

### Task 10: Share System
**Description:** Build a post-game share card: emoji grid showing category results per row (✅ for above-par, 🟡 for at-par, ❌ for below-par), total score, date, puzzle number. Implement "Copy Result" (clipboard text) and "Share Image" (Canvas-rendered PNG). Add social share meta tags for link previews.

**Acceptance Criteria:**
- Share text is correctly formatted and copies to clipboard
- Share image renders correctly (tested via canvas snapshot)
- Puzzle number increments daily (day 1 = launch date, stored as constant)
- `og:image` and Twitter card meta tags are set for the root page
- Share button is accessible and clearly labeled

**Dependencies:** Task 8

---

### Task 11: Statistics Modal
**Description:** Build a stats modal (accessible dialog) showing: games played, win rate (completed above 50% of par), current streak, longest streak, score distribution histogram. All data from localStorage. Triggered from a stats icon in the header.

**Acceptance Criteria:**
- Modal traps focus correctly (ARIA `role="dialog"`, `aria-modal="true"`)
- Closes on Escape key and backdrop click
- Stats update immediately after game completion
- Histogram renders score ranges on a scale (e.g. 0–50, 51–100, etc.)
- Empty state handled gracefully (first-time user)

**Dependencies:** Task 4

---

### Task 12: Help / How to Play
**Description:** Build a help modal triggered from a "?" button in the header. Explains: the daily puzzle concept, how dice placement works, all Yahtzee scoring categories with examples, the re-roll mechanic, and how sharing works. Include a short interactive tutorial option (highlight each UI element in sequence).

**Acceptance Criteria:**
- All 13 Yahtzee categories are listed with example dice and point values
- Modal is accessible (focus trap, keyboard close)
- Tutorial mode highlights elements via accessible overlay
- Help content is readable at 16px base font on smallest supported viewport (320px)

**Dependencies:** Task 5

---

### Task 13: Accessibility Audit & Keyboard Navigation
**Description:** Conduct a full accessibility pass: keyboard navigation of all game interactions (select dice, target row, confirm placement), ARIA live regions for score updates and game phase changes, focus management after modal open/close, color contrast verification for all states (hover, selected, disabled).

**Acceptance Criteria:**
- Game is 100% playable using keyboard alone
- Screen reader announces: current roll dice values, selected dice, row scores, game completion
- All focus transitions are intentional (no focus loss)
- axe-core automated scan returns zero violations
- Tested with NVDA or JAWS (manual or emulated)

**Dependencies:** Tasks 6, 7, 8, 11, 12

---

### Task 14: Performance & PWA
**Description:** Add PWA manifest and service worker for offline play. Optimize bundle size (lazy-load modals, animations). Add skeleton loading states. Verify Lighthouse scores: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90.

**Acceptance Criteria:**
- App installs as PWA on iOS and Android
- Game is playable offline after first visit
- Lighthouse scores meet thresholds
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms on 4G throttled

**Dependencies:** Tasks 1–13 (final pass)

---

## Dependency Graph

```
Task 1 (Init)
  └─► Task 2 (Seed/Dice Engine)
  └─► Task 3 (Scoring Engine)
  └─► Task 5 (Layout/Design System)
        └─► Task 6 (Dice Component)
        └─► Task 11 (Stats Modal)
        └─► Task 12 (Help Modal)

Tasks 2 + 3 → Task 4 (Game State Store)
Tasks 4 + 6 → Task 7 (Grid Components)
Tasks 3 + 4 + 7 → Task 8 (Game Flow)
Task 8 → Task 9 (Score Animations)
Task 8 → Task 10 (Share System)

Tasks 6+7+8+11+12 → Task 13 (Accessibility Audit)
Tasks 1–13 → Task 14 (PWA + Performance)
```

---

## Risks & Open Questions

| Risk | Severity | Mitigation |
|------|----------|------------|
| Yahtzee rules unfamiliar to some users | Medium | Inline category examples in placement UI; full help modal |
| "Forced bad placement" frustration | High | Ensure re-roll mechanic provides strategic relief; show par score so players understand the ceiling |
| Par score calculation difficulty | Medium | Greedy optimal is good enough for par; document that par is not perfect play |
| Canvas API inconsistency (iOS Safari) | Low | Test on real iOS device; fallback to text-only share |
| Naming/IP concerns with "Yahtzee" branding | Medium | Use generic names ("Full House," "Straight") in UI without mentioning Yahtzee brand; consult legal before launch |
| Daily reset edge cases (timezones) | Medium | Use UTC date for seed; display "Puzzle for [UTC date]" clearly |
| Motivating daily return after poor score | Medium | Streak mechanic + "beat your best" secondary goal regardless of par |

---

## Out of Scope (MVP)

- Multiplayer or live leaderboard (backend required)
- User accounts or cloud sync
- Puzzle archive / play past days
- Hints or assistant mode
- Monetization / ads
- Native mobile app (PWA covers mobile)

---

## Concept Alternatives (Deferred)

- **NumField** (Minesweeper × Nonogram): Strong deduction mechanic; requires constraint-satisfaction puzzle generator. Viable as a follow-up product.
- **SolitSort** (FreeCell × Logic): Higher cognitive load, less universally accessible. Better suited for a "hard mode" variant.

# YahtzGrid

A daily dice puzzle game. Each day everyone plays the same fixed sequence of 13 dice rolls and tries to maximize their score by placing dice into Yahtzee-style scoring rows. Compare your score against a published par.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [How the Game Works](#how-the-game-works)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Game Engine API](#game-engine-api)
- [State Store](#state-store)
- [Scoring Reference](#scoring-reference)
- [Configuration](#configuration)
- [Testing](#testing)
- [Known Limitations](#known-limitations)

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development Workflow

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Start production server (requires build first) |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |

---

## How the Game Works

1. Each day a fixed sequence of **13 dice rolls** (5 dice each) is generated from a date-based seed. Every player sees the same rolls.
2. On each turn, select dice from the current roll and tap a scoring row to place them.
3. Optionally **hold** some dice and **re-roll** the rest — once per turn. Re-roll outcomes are also deterministic per date and roll index, so all players get the same re-roll.
4. A row **scores when all 5 cells are filled**, using the row's fixed scoring category.
5. The game ends when all 13 rolls are placed (or all rows are complete).
6. Your total score is compared against the **par score** — the greedy-optimal result a computer would achieve playing the same dice.
7. After finishing, copy an emoji result grid to share without spoiling the dice values.

**Win condition:** Score greater than 50% of par.

**Streaks** are tracked across consecutive days. Stats and game state persist in `localStorage`.

---

## Project Structure

```
src/
  engine/           # Pure TypeScript — no React dependencies
    rng.ts          # Seeded PRNG (Mulberry32) + date-to-seed hash
    scoring.ts      # All 13 Yahtzee categories, bonus logic
    puzzle.ts       # Daily puzzle generation
    __tests__/      # Unit tests for the engine

  store/
    gameStore.ts    # Zustand store — game state, actions, localStorage persistence
    __tests__/

  components/
    Die.tsx         # Individual die face with animation states
    RollTray.tsx    # Current roll display, hold/re-roll controls
    GameGrid.tsx    # 13-row scoring grid
    GridRow.tsx     # Single scoring row with placement logic
    Header.tsx      # Title, date, score, streak, modal triggers
    GameComplete.tsx # Final score, par comparison, share card
    StatsModal.tsx  # Statistics dialog with score histogram
    HelpModal.tsx   # How-to-play with category examples
    __tests__/

  app/
    layout.tsx      # Root layout with metadata and PWA manifest link
    page.tsx        # Main game page — orchestrates all components
    globals.css     # Design tokens (CSS variables), dark mode

public/
  manifest.json     # PWA manifest
```

---

## Architecture Overview

The app is **fully client-side** — no backend is required.

```
generateDailyPuzzle(date)
        │
        ▼
  useGameStore (Zustand)   ←──── localStorage persistence
        │
        ├── RollTray       (select / hold / re-roll dice)
        ├── GameGrid       (place dice into scoring rows)
        ├── GameComplete   (final score + share)
        ├── StatsModal     (history from localStorage)
        └── HelpModal      (static how-to-play content)
```

**Game phases** (`GamePhase`):

| Phase | Meaning |
|---|---|
| `idle` | Not yet started (first load or new day) |
| `placing` | Active game — player is placing dice |
| `complete` | Puzzle finished for today |

The phase is persisted so a completed game cannot be restarted on the same day.

---

## Game Engine API

All functions are pure TypeScript in `src/engine/`. They have no React dependency and are fully unit-tested.

### `src/engine/rng.ts`

```ts
// Returns a function that produces floats in [0, 1) from a numeric seed
mulberry32(seed: number): () => number

// Hashes a YYYY-MM-DD string to a numeric seed
dateSeed(dateStr: string): number
```

### `src/engine/puzzle.ts`

```ts
// Generates the full daily puzzle deterministically for a UTC date string
generateDailyPuzzle(date: string): DailyPuzzle

// Returns today's date as "YYYY-MM-DD" in UTC
getTodayUTC(): string

// Constants
ROLLS_PER_GAME = 13   // one roll per scoring category
DICE_PER_ROLL  = 5
```

**`DailyPuzzle` shape:**

```ts
interface DailyPuzzle {
  date: string;         // "YYYY-MM-DD"
  puzzleNumber: number; // 1-based day count since launch (2026-03-09)
  rolls: DiceRoll[];    // 13 rolls × 5 dice, values 1–6
  parScore: number;     // greedy-optimal score for these rolls
}
```

### `src/engine/scoring.ts`

```ts
// Score exactly 5 dice for a given category; returns 0 if condition not met
scoreDice(dice: number[], category: Category): number

// Returns the highest-scoring available category for the given dice
getBestCategory(dice: number[], usedCategories: Set<Category>): Category | null

// Returns 35 if the upper-section sum (ones–sixes) is >= 63, else 0
upperSectionBonus(scores: Partial<Record<Category, number>>): number

// Sum of all category scores plus upper-section bonus
computeTotalScore(scores: Partial<Record<Category, number>>): number
```

---

## State Store

`src/store/gameStore.ts` exports `useGameStore` — a Zustand store with `localStorage` persistence under the key `"yahtzgrid-state"`.

### Key State Fields

| Field | Type | Description |
|---|---|---|
| `phase` | `GamePhase` | Current game phase |
| `puzzle` | `DailyPuzzle \| null` | Today's puzzle (null until started) |
| `currentRollIndex` | `number` | Which of the 13 rolls is active |
| `selectedDiceIndices` | `number[]` | Indices of dice selected for placement |
| `heldDiceIndices` | `number[]` | Indices of dice held for re-roll |
| `hasRerolled` | `boolean` | Whether re-roll was used this turn |
| `rows` | `RowState[]` | 13 scoring rows with placed dice and scores |
| `scores` | `Partial<Record<Category, number>>` | Scored categories |
| `totalScore` | `number` | Running total including upper bonus |
| `stats` | `PlayerStats` | Cross-session stats from localStorage |

### Actions

| Action | Description |
|---|---|
| `startGame()` | Load today's puzzle; no-op if already completed today |
| `selectDie(index)` | Toggle a die as selected for placement |
| `toggleHoldDie(index)` | Toggle a die as held for re-roll (before re-roll only) |
| `reroll()` | Re-roll non-held dice; allowed once per turn |
| `placeInRow(rowIndex)` | Place selected dice into a row; scores the row when full |
| `resetForNewDay()` | Force-reset game state to today (for edge cases) |

### Stats (`PlayerStats`)

```ts
interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;          // score > 50% of par
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  scoreHistory: number[];    // one entry per completed game
}
```

Stats are preserved across daily resets. Only game-round state is cleared each new day.

---

## Scoring Reference

### Upper Section (sum of that face value)

| Category | Max Score | Rule |
|---|---|---|
| Ones | 5 | Sum of all 1s |
| Twos | 10 | Sum of all 2s |
| Threes | 15 | Sum of all 3s |
| Fours | 20 | Sum of all 4s |
| Fives | 25 | Sum of all 5s |
| Sixes | 30 | Sum of all 6s |

**Upper section bonus:** If the sum of Ones through Sixes totals **63 or more**, add **+35** to the final score.

### Lower Section

| Category | Score | Rule |
|---|---|---|
| 3 of a Kind | Sum of all dice | At least three dice showing the same value |
| 4 of a Kind | Sum of all dice | At least four dice showing the same value |
| Full House | 25 | Three of one value + two of another |
| Small Straight | 30 | Four sequential values (e.g. 1-2-3-4) |
| Large Straight | 40 | Five sequential values (1-2-3-4-5 or 2-3-4-5-6) |
| YAHTZEE | 50 | All five dice the same |
| Chance | Sum of all dice | Any roll; always scores |

### Share Emoji Legend

After completing the puzzle, the result grid uses:

| Emoji | Meaning |
|---|---|
| 🟩 | Score ≥ 80% of category maximum |
| 🟨 | Score > 0 but < 80% of maximum |
| 🟥 | Row scored 0 |
| ⬜ | Row was not filled |

---

## Configuration

### Launch Date / Puzzle Numbering

The puzzle number is counted from the launch date defined in `src/engine/puzzle.ts`:

```ts
const LAUNCH_DATE = "2026-03-09"; // Puzzle #1
```

Change this constant before public launch to reset puzzle numbering.

### Daily Seed

Puzzles are seeded from the UTC date string (`YYYY-MM-DD`) via `dateSeed()` in `src/engine/rng.ts`. The same date always produces the same puzzle. Using UTC prevents players in different timezones from seeing different puzzles on the same calendar day.

### Re-roll Determinism

Re-roll outcomes are seeded from `"{date}-reroll-{rollIndex}"`, making them identical for all players on a given day and turn. This preserves score comparability.

### localStorage Key

Game state is stored under the key `"yahtzgrid-state"`. Clear this key in DevTools to reset all state and stats locally.

---

## Testing

Tests live alongside source files in `__tests__/` directories.

```bash
npm test            # Run all tests once
npm run test:watch  # Watch mode
```

**Test coverage:**

- `src/engine/__tests__/scoring.test.ts` — all 13 categories, edge cases, upper bonus
- `src/engine/__tests__/puzzle.test.ts` — determinism, puzzle number, dice value range
- `src/engine/__tests__/smoke.test.ts` — end-to-end puzzle generation smoke test
- `src/store/__tests__/gameStore.test.ts` — store actions and state transitions
- `src/components/__tests__/` — component rendering and interaction tests

---

## Known Limitations

- **No service worker / offline support.** The PWA manifest exists (`public/manifest.json`) but no service worker is registered. The app requires an internet connection on first load.
- **No backend.** Scores are not submitted to any leaderboard. Comparison is local only.
- **Single timezone (UTC).** The puzzle date is based on UTC. Players in UTC+12 or similar may see a "new" puzzle earlier than expected by local time.
- **No undo.** Dice placement is irreversible by design.

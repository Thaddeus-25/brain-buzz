# Brain Buzz — Design Spec

**Date:** 2026-11-05
**Status:** Approved design, awaiting spec review

## 1. Purpose

A simple, lightweight browser mind game that keeps the player's brain working and
helps them stay awake (e.g. late-night study breaks). Short, varied rounds keep
attention switching so the game doesn't become automatic.

**Success criteria**
- Opens instantly from a GitHub Pages link or by double-clicking `index.html` — no installs, no build step.
- Four distinct round types that rotate randomly and get harder over time.
- Two modes (Endless, Sprint) with best scores remembered between visits.
- Playable on desktop (keyboard + mouse) and phone (touch).
- No sound or music.

**Out of scope (for now):** sound, accounts/online leaderboards, settings menu, frameworks.

## 2. Tech & Hosting

- Plain HTML + CSS + JavaScript using native ES modules (`<script type="module">`).
- No dependencies, no bundler, no Node.
- Repo: `Thaddeus-25/brain-buzz` (public). GitHub Pages serves the `main` branch root at
  `https://thaddeus-25.github.io/brain-buzz/`.
- Note: ES modules don't load over `file://` in some browsers. The README will say to
  play via the Pages link or a local server (`python -m http.server`).

## 3. File Layout

```
index.html              markup for the three screens
style.css               dark theme, responsive layout
js/main.js              game loop: screens, modes, timer, lives, score, difficulty
js/storage.js           loadBest(mode) / saveBest(mode, score) via localStorage
js/rounds/math.js
js/rounds/colorClash.js
js/rounds/memory.js
js/rounds/oddOneOut.js
js/rounds/index.js      exports the list of all round types
tests.html              in-browser test runner for round logic + storage
js/tests.js
README.md
```

## 4. Round Interface

Each round module exports an object with the same shape (like a Java interface):

```js
{
  id: 'math',                 // unique string
  name: 'Quick Math',         // shown above the challenge
  generate(level) -> challenge,   // pure: builds a new challenge for difficulty level (1, 2, 3, ...)
  render(challenge, container, submit),  // draws UI into container; calls submit(answer) once
  check(challenge, answer) -> boolean    // pure: is the answer correct?
}
```

`generate` and `check` are pure functions (no DOM), so they are unit-testable.
`render` owns all DOM for that round and calls `submit` exactly once.

## 5. Round Types

| Round | Challenge | Input | Scaling with level |
|---|---|---|---|
| **Quick Math** | Expression like `7 × 8 − 9` | Type number, Enter | Level 1: two-operand +/−, numbers ≤ 10. Higher: adds ×, larger numbers (up to ~12×level), three operands from level 3. Answers are always integers. |
| **Color Clash** | Color word (e.g. "RED") drawn in a *different* ink color | Click one of 4 color buttons (labelled with color names) | Answer = ink color. Higher levels: button order shuffled each round, more color choices (4 → 6). |
| **Number Memory** | Digits flash for a short time, then hide | Type digits, Enter | Length = 2 + level (capped at 12). Display time ≈ 600 ms per digit, minimum 1.5 s. Round timer starts after digits hide. |
| **Odd One Out** | Grid of identical symbols with one different one | Click/tap the odd cell | Grid 3×3 at level 1, up to 6×6. Symbol pairs get more similar (e.g. `O`/`Q` → `b`/`d` → `l`/`I`). |

## 6. Game Modes

**Endless**
- 3 lives (shown as ●●●).
- Per-round timer: `max(4, 12 − level)` seconds (Number Memory timer starts after the digits hide).
- Wrong answer or timeout: lose 1 life, show the correct answer briefly (~1 s), continue.
- Level goes up every 5 correct answers.
- Game over at 0 lives.

**Sprint**
- 60-second global timer; no per-round timer, no lives.
- Wrong answer: −2 seconds and shows the correct answer briefly.
- Level goes up every 5 correct answers.
- Ends when the timer reaches 0.

**Round selection (both modes):** random, but never the same round type twice in a row.

## 7. Scoring & Storage

- Correct answer: `10 + streakBonus`, where `streakBonus = 2 × (streak − 1)` capped at 20.
  Streak resets to 0 on any miss.
- Best score per mode is saved in `localStorage` under `brainBuzz.best.endless` and
  `brainBuzz.best.sprint`.
- If `localStorage` is unavailable (e.g. private mode), the game still plays and best scores
  just don't persist (wrap access in try/catch).

## 8. Screens & Flow

```
Menu  ──(Endless / Sprint)──▶  Game  ──(lives = 0 or time = 0)──▶  Results
  ▲                                                                   │
  └──────────────────────(Menu)───── (Play again) ─▶ Game ◀──────────┘
```

- **Menu:** title, short "how to play", two mode buttons, best score for each mode.
- **Game:** top bar (score, level, lives or time left), timer bar, round name, challenge area,
  brief ✓/✗ feedback flash.
- **Results:** final score, "New best!" if beaten, correct answers count, Play again / Menu.
- Esc during a game returns to the menu (the game is discarded).

## 9. Look & Feel

- Dark background, high-contrast text, one accent color, large tap targets (≥ 44 px).
- Color Clash colors are chosen to be distinguishable on a dark background, and buttons carry
  text labels so the game doesn't rely on color alone.
- Layout works down to 360 px wide with no horizontal scroll.
- Typed-answer inputs autofocus; Enter submits.

## 10. Error Handling

- Empty or non-numeric typed input counts as a wrong answer (no crash).
- Double submissions are ignored (each round accepts the first submit only).
- Timers are cleared when switching screens, so no stray callbacks fire after a game ends.

## 11. Testing

- `tests.html` runs a tiny assert-based test runner in the browser and lists pass/fail.
- Covered: for each round, `generate(level)` produces valid challenges across levels 1–10
  (e.g. math answers are integers; Color Clash ink ≠ word; Odd One Out has exactly one odd
  cell), and `check` accepts the right answer and rejects wrong ones; scoring/streak math;
  storage falls back safely.
- Manual play-test of both modes in a browser before pushing.

## 12. Delivery

1. Create the local repo and build the game with small, focused commits (no AI co-author lines).
2. Create the public GitHub repo `Thaddeus-25/brain-buzz` with `gh` and push `main`.
3. Turn on GitHub Pages (main branch, root) and confirm the live link loads.

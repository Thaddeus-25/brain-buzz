// Pure game rules (no DOM), so they're easy to test.

export const ENDLESS_LIVES = 3;
export const SPRINT_SECONDS = 60;
export const SPRINT_PENALTY_SECONDS = 2;
export const LEVEL_EVERY = 5;

/** Level 1 at the start, +1 every 5 correct answers. */
export const levelFor = (correct) => 1 + Math.floor(correct / LEVEL_EVERY);

/** Endless mode: seconds allowed per round at a given level. */
export const roundSeconds = (level) => Math.max(4, 12 - level);

/** Points for a correct answer; streak counts this answer (1 = first in a row). */
export const pointsFor = (streak) => 10 + Math.min(20, 2 * (streak - 1));

/** Random round type, never the same id twice in a row. */
export function pickRound(rounds, lastId, rng = Math.random) {
  const pool = rounds.filter((r) => r.id !== lastId);
  return pool[Math.floor(rng() * pool.length)];
}

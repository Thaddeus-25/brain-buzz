// Tiny test runner. Works in the browser (tests.html) and in Node (`node js/tests.js`).
import math, { evaluate } from './rounds/math.js';
import colorClash from './rounds/colorClash.js';
import memory from './rounds/memory.js';
import oddOneOut from './rounds/oddOneOut.js';
import { ROUNDS } from './rounds/index.js';
import { levelFor, roundSeconds, pointsFor, pickRound } from './game.js';
import { loadBest, saveBest } from './storage.js';
import { resolveTheme, loadSavedTheme, saveTheme } from './theme.js';

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
  }
}
function assert(condition, message = 'assertion failed') {
  if (!condition) throw new Error(message);
}
/** Run fn for levels 1–10, 50 challenges each. */
function forLevels(round, fn) {
  for (let level = 1; level <= 10; level++) {
    for (let n = 0; n < 50; n++) fn(round.generate(level), level);
  }
}

// --- Quick Math ---
test('math: evaluate respects × before + and −', () => {
  assert(evaluate([2, 3, 4], ['+', '×']) === 14);
  assert(evaluate([10, 3, 2], ['−', '+']) === 9);
  assert(evaluate([7, 8, 9], ['×', '−']) === 47);
});
test('math: answers are non-negative integers', () => {
  forLevels(math, (c) => assert(Number.isInteger(c.answer) && c.answer >= 0, `bad answer ${c.answer}`));
});
test('math: check accepts right answer and rejects wrong/empty', () => {
  const c = math.generate(3);
  assert(math.check(c, String(c.answer)));
  assert(math.check(c, ` ${c.answer} `));
  assert(!math.check(c, String(c.answer + 1)));
  assert(!math.check(c, ''));
  assert(!math.check(c, 'abc'));
});

// --- Color Clash ---
test('colorClash: ink never equals the word, and ink is an option', () => {
  forLevels(colorClash, (c) => {
    assert(c.ink !== c.word, 'ink matched word');
    assert(c.options.includes(c.ink), 'ink missing from options');
  });
});
test('colorClash: 4 options before level 4, 6 after', () => {
  assert(colorClash.generate(1).options.length === 4);
  assert(colorClash.generate(4).options.length === 6);
});
test('colorClash: check uses the ink, not the word', () => {
  const c = colorClash.generate(2);
  assert(colorClash.check(c, c.ink));
  assert(!colorClash.check(c, c.word));
});

// --- Number Memory ---
test('memory: length is 2 + level, capped at 12', () => {
  assert(memory.generate(1).digits.length === 3);
  assert(memory.generate(5).digits.length === 7);
  assert(memory.generate(20).digits.length === 12);
});
test('memory: study time is at least 1.5 s', () => {
  forLevels(memory, (c) => assert(c.studyMs >= 1500));
});
test('memory: check ignores spaces, rejects wrong', () => {
  const c = memory.generate(4);
  assert(memory.check(c, c.digits));
  assert(memory.check(c, c.digits.split('').join(' ')));
  assert(!memory.check(c, c.digits.slice(1)));
  assert(!memory.check(c, ''));
});

// --- Odd One Out ---
test('oddOneOut: exactly one odd cell, at oddIndex', () => {
  forLevels(oddOneOut, (c) => {
    assert(c.cells.length === c.size * c.size, 'grid size wrong');
    const oddCells = c.cells.filter((s) => s === c.odd);
    assert(oddCells.length === 1, 'not exactly one odd cell');
    assert(c.cells[c.oddIndex] === c.odd, 'oddIndex wrong');
  });
});
test('oddOneOut: grid grows from 3 to 6', () => {
  assert(oddOneOut.generate(1).size === 3);
  assert(oddOneOut.generate(20).size === 6);
});
test('oddOneOut: check accepts index (number or string)', () => {
  const c = oddOneOut.generate(1);
  assert(oddOneOut.check(c, c.oddIndex));
  assert(oddOneOut.check(c, String(c.oddIndex)));
  assert(!oddOneOut.check(c, (c.oddIndex + 1) % c.cells.length));
});

// --- All rounds share the same interface ---
test('every round has id, name, generate, check, answerText, render', () => {
  for (const r of ROUNDS) {
    assert(typeof r.id === 'string' && typeof r.name === 'string', `${r.id} missing id/name`);
    for (const fn of ['generate', 'check', 'answerText', 'render']) {
      assert(typeof r[fn] === 'function', `${r.id} missing ${fn}`);
    }
    assert(typeof r.answerText(r.generate(1)) === 'string');
  }
});

// --- Game rules ---
test('levelFor: +1 level every 5 correct', () => {
  assert(levelFor(0) === 1 && levelFor(4) === 1 && levelFor(5) === 2 && levelFor(12) === 3);
});
test('roundSeconds: shrinks to a 4 s minimum', () => {
  assert(roundSeconds(1) === 11 && roundSeconds(8) === 4 && roundSeconds(30) === 4);
});
test('pointsFor: streak bonus capped at +20', () => {
  assert(pointsFor(1) === 10 && pointsFor(2) === 12 && pointsFor(11) === 30 && pointsFor(50) === 30);
});
test('pickRound: never repeats the last round', () => {
  for (let i = 0; i < 200; i++) {
    const r = pickRound(ROUNDS, 'math');
    assert(r && r.id !== 'math');
  }
});

// --- Storage ---
test('storage: save then load with a fake store', () => {
  const data = {};
  const store = { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
  assert(loadBest('endless', store) === 0);
  assert(saveBest('endless', 140, store));
  assert(loadBest('endless', store) === 140);
  assert(loadBest('sprint', store) === 0);
});
test('storage: blocked or missing storage falls back safely', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert(loadBest('endless', broken) === 0);
  assert(saveBest('endless', 5, broken) === false);
  assert(loadBest('endless', null) === 0);
  assert(saveBest('endless', 5, null) === false);
});

// --- Theme ---
test('theme: a saved choice wins over the system setting', () => {
  assert(resolveTheme('light', true) === 'light');
  assert(resolveTheme('dark', false) === 'dark');
});
test('theme: with no (or junk) saved choice, follow the system', () => {
  assert(resolveTheme(null, true) === 'dark');
  assert(resolveTheme(null, false) === 'light');
  assert(resolveTheme('purple', true) === 'dark');
});
test('theme: save/load round-trip, and blocked storage is safe', () => {
  const data = {};
  const store = { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
  assert(loadSavedTheme(store) === null);
  saveTheme('light', store);
  assert(loadSavedTheme(store) === 'light');
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert(loadSavedTheme(broken) === null);
  saveTheme('dark', broken); // must not throw
});

// --- Report ---
const passed = results.filter((r) => r.ok).length;
const summary = `${passed}/${results.length} tests passed`;
if (typeof document !== 'undefined') {
  const out = document.getElementById('results');
  for (const r of results) {
    const li = document.createElement('li');
    li.className = r.ok ? 'pass' : 'fail';
    li.textContent = `${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : ` — ${r.error}`}`;
    out.append(li);
  }
  document.getElementById('summary').textContent = summary;
  document.title = summary;
} else {
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : ` — ${r.error}`}`);
  console.log(summary);
  if (passed !== results.length) process.exitCode = 1;
}

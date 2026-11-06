// The game loop: switches screens, runs rounds, tracks timer / lives / score.
import { ROUNDS } from './rounds/index.js';
import {
  ENDLESS_LIVES, SPRINT_SECONDS, SPRINT_PENALTY_SECONDS,
  levelFor, roundSeconds, pointsFor, pickRound,
} from './game.js';
import { loadBest, saveBest } from './storage.js';

const $ = (id) => document.getElementById(id);
const screens = { menu: $('menu'), game: $('game'), results: $('results') };

let state = null; // everything about the game in progress (null when not playing)
let lastMode = 'endless';

function show(name) {
  for (const [key, section] of Object.entries(screens)) section.hidden = key !== name;
}

// ---------- Menu ----------
function showMenu() {
  stopGame();
  $('best-endless').textContent = loadBest('endless');
  $('best-sprint').textContent = loadBest('sprint');
  show('menu');
}

// ---------- Starting / stopping ----------
function startGame(mode) {
  stopGame();
  lastMode = mode;
  state = {
    mode,
    score: 0,
    streak: 0,
    correct: 0,
    lives: ENDLESS_LIVES,
    sprintEnd: performance.now() + SPRINT_SECONDS * 1000, // only used in sprint
    pausedAt: null, // sprint clock pauses while showing feedback
    lastId: null,
    round: null,
    challenge: null,
    cleanup: null,
    accepting: false, // true while the current round accepts an answer
    roundStart: 0, // endless: when the round timer starts (after memory study time)
    roundMs: 0,
    roundDeadline: null,
    tickId: setInterval(tick, 100),
    pauseId: null,
  };
  show('game');
  nextRound();
}

/** Clears every timer and listener so nothing fires after the game ends. */
function stopGame() {
  if (!state) return;
  clearInterval(state.tickId);
  clearTimeout(state.pauseId);
  state.cleanup?.();
  state = null;
}

function endGame() {
  const { mode, score, correct } = state;
  stopGame();
  const best = loadBest(mode);
  const isNewBest = score > best;
  if (isNewBest) saveBest(mode, score);
  $('results-title').textContent = mode === 'sprint' ? "Time's up!" : 'Game over';
  $('final-score').textContent = score;
  $('new-best').hidden = !isNewBest;
  $('final-detail').textContent = `${correct} correct · reached level ${levelFor(correct)}`
    + (isNewBest ? '' : ` · best ${best}`);
  show('results');
  $('again').focus();
}

// ---------- Rounds ----------
function nextRound() {
  const round = pickRound(ROUNDS, state.lastId);
  const level = levelFor(state.correct);
  const challenge = round.generate(level);
  Object.assign(state, { round, challenge, lastId: round.id, accepting: true });

  $('round-name').textContent = round.name;
  $('feedback').textContent = '';
  const area = $('challenge');
  area.replaceChildren();
  state.cleanup = round.render(challenge, area, onSubmit) || null;

  if (state.mode === 'endless') {
    const now = performance.now();
    state.roundStart = now + (challenge.studyMs || 0);
    state.roundMs = (roundSeconds(level) + (challenge.extraSeconds || 0)) * 1000;
    state.roundDeadline = state.roundStart + state.roundMs;
  }
  updateHud();
}

function onSubmit(answer) {
  if (!state || !state.accepting) return; // ignore double clicks / late submits
  resolve(state.round.check(state.challenge, answer), false);
}

/** Handles a finished round: right, wrong, or timed out. */
function resolve(correct, timedOut) {
  state.accepting = false;
  state.roundDeadline = null;
  const levelBefore = levelFor(state.correct);
  let delay;

  if (correct) {
    state.streak += 1;
    state.correct += 1;
    const points = pointsFor(state.streak);
    state.score += points;
    const levelUp = levelFor(state.correct) > levelBefore;
    setFeedback(`✓ +${points}${levelUp ? ' · Level up!' : ''}`, 'good');
    delay = levelUp ? 800 : 350;
  } else {
    state.streak = 0;
    if (state.mode === 'endless') state.lives -= 1;
    else state.sprintEnd -= SPRINT_PENALTY_SECONDS * 1000;
    const why = timedOut ? "⏱ Time's up" : '✗ Wrong';
    setFeedback(`${why}: answer was ${state.round.answerText(state.challenge)}`, 'bad');
    delay = 1100;
  }

  if (state.mode === 'sprint') state.pausedAt = performance.now();
  updateHud();

  state.pauseId = setTimeout(() => {
    state.cleanup?.();
    state.cleanup = null;
    if (state.mode === 'endless' && state.lives <= 0) return endGame();
    if (state.mode === 'sprint') {
      state.sprintEnd += performance.now() - state.pausedAt; // don't count the pause
      state.pausedAt = null;
      if (state.sprintEnd <= performance.now()) return endGame(); // penalty ran the clock out
    }
    nextRound();
  }, delay);
}

// ---------- Timer + HUD ----------
function tick() {
  const now = performance.now();
  if (state.mode === 'sprint') {
    const left = state.sprintEnd - (state.pausedAt ?? now); // frozen while paused
    setTimerBar(left / (SPRINT_SECONDS * 1000));
    const seconds = document.createElement('b');
    seconds.textContent = `${Math.max(0, Math.ceil(left / 1000))}s`;
    $('hud-status').replaceChildren('Time ', seconds);
    if (left <= 0 && state.pausedAt === null) endGame();
  } else if (state.accepting && state.roundDeadline !== null) {
    if (now < state.roundStart) {
      setTimerBar(1); // memory round: still studying
    } else {
      const left = state.roundDeadline - now;
      setTimerBar(left / state.roundMs);
      if (left <= 0) resolve(false, true);
    }
  }
}

function setTimerBar(fraction) {
  const f = Math.max(0, Math.min(1, fraction));
  const fill = $('timer-fill');
  fill.style.width = `${f * 100}%`;
  fill.classList.toggle('low', f < 0.3);
}

function updateHud() {
  $('hud-score').textContent = state.score;
  $('hud-level').textContent = levelFor(state.correct);
  if (state.mode === 'endless') {
    const lives = Math.max(0, state.lives);
    const hearts = document.createElement('span');
    hearts.className = 'lives';
    hearts.setAttribute('aria-label', `${lives} lives`);
    hearts.textContent = '●'.repeat(lives) + '○'.repeat(ENDLESS_LIVES - lives);
    $('hud-status').replaceChildren(hearts);
  }
}

function setFeedback(text, kind) {
  const fb = $('feedback');
  fb.textContent = text;
  fb.className = `feedback ${kind}`;
}

// ---------- Wire up buttons and keys ----------
document.querySelectorAll('.mode').forEach((btn) => {
  btn.addEventListener('click', () => startGame(btn.dataset.mode));
});
$('quit').addEventListener('click', showMenu);
$('again').addEventListener('click', () => startGame(lastMode));
$('to-menu').addEventListener('click', showMenu);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state) showMenu();
});

showMenu();

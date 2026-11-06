// Number Memory: digits flash on screen, then hide. Type them back.
import { randInt, el, textAnswer } from '../util.js';

export default {
  id: 'memory',
  name: 'Number Memory',

  generate(level) {
    const length = Math.min(12, 2 + level);
    const digits = Array.from({ length }, () => randInt(0, 9)).join('');
    return {
      digits,
      studyMs: Math.max(1500, 600 * length), // how long the digits stay visible
      extraSeconds: Math.floor(length / 3), // more typing time for long numbers
    };
  },

  check(challenge, answer) {
    return String(answer).replace(/\s/g, '') === challenge.digits;
  },

  answerText(challenge) {
    return challenge.digits;
  },

  render(challenge, container, submit) {
    const hint = el('p', { class: 'hint' }, 'Memorize!');
    const display = el('div', { class: 'big mono' }, challenge.digits);
    container.append(hint, display);

    const timer = setTimeout(() => {
      hint.textContent = 'Type the digits';
      display.textContent = '?'.repeat(challenge.digits.length);
      textAnswer(container, submit).focus();
    }, challenge.studyMs);
    return () => clearTimeout(timer); // cleanup if the game ends early
  },
};

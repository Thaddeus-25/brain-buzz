// Odd One Out: a grid of identical symbols with exactly one different one.
import { randInt, pick, el } from '../util.js';

// Symbol pairs grouped from easy (very different) to hard (look-alikes).
export const TIERS = [
  [['O', 'X'], ['A', 'V'], ['#', '@'], ['+', '='], ['S', 'Z']],
  [['O', 'Q'], ['E', 'F'], ['M', 'N'], ['6', '9'], ['C', 'G']],
  [['b', 'd'], ['p', 'q'], ['8', 'B'], ['5', 'S'], ['0', 'O'], ['u', 'v']],
];

export default {
  id: 'oddOneOut',
  name: 'Odd One Out',

  generate(level) {
    const size = Math.min(6, 3 + Math.floor((level - 1) / 2)); // 3×3 up to 6×6
    const tier = level <= 2 ? 0 : level <= 5 ? 1 : 2;
    const pair = pick(TIERS[tier]);
    const [common, odd] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
    const oddIndex = randInt(0, size * size - 1);
    const cells = Array(size * size).fill(common);
    cells[oddIndex] = odd;
    return { size, cells, odd, oddIndex };
  },

  check(challenge, answer) {
    return Number(answer) === challenge.oddIndex;
  },

  answerText(challenge) {
    const row = Math.floor(challenge.oddIndex / challenge.size) + 1;
    const col = (challenge.oddIndex % challenge.size) + 1;
    return `"${challenge.odd}" at row ${row}, column ${col}`;
  },

  render(challenge, container, submit) {
    const cells = challenge.cells.map((symbol, i) => {
      const btn = el('button', { type: 'button', class: 'cell mono', 'aria-label': `cell ${i + 1}` }, symbol);
      btn.addEventListener('click', () => submit(i));
      return btn;
    });
    container.append(
      el('p', { class: 'hint' }, 'Tap the one that is different'),
      el('div', { class: 'odd-grid', style: `--size:${challenge.size}` }, ...cells),
    );
  },
};

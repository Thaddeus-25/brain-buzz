// Color Clash (Stroop test): a color word is shown in a different ink color.
// The player must pick the INK color, not the word.
import { pick, shuffle, el } from '../util.js';

export const COLORS = [
  { name: 'RED', hex: '#ff5c5c' },
  { name: 'BLUE', hex: '#4d9bff' },
  { name: 'GREEN', hex: '#3ddc84' },
  { name: 'YELLOW', hex: '#ffd23f' },
  { name: 'PURPLE', hex: '#c084ff' },
  { name: 'ORANGE', hex: '#ff9f43' },
];

const hexOf = (name) => COLORS.find((c) => c.name === name).hex;

export default {
  id: 'colorClash',
  name: 'Color Clash',

  generate(level) {
    const palette = level >= 4 ? COLORS : COLORS.slice(0, 4); // 4 → 6 choices
    const word = pick(palette);
    const ink = pick(palette.filter((c) => c !== word)); // ink never matches the word
    const options = (level >= 2 ? shuffle(palette) : palette).map((c) => c.name);
    return { word: word.name, ink: ink.name, options, answer: ink.name };
  },

  check(challenge, answer) {
    return answer === challenge.answer;
  },

  answerText(challenge) {
    return challenge.ink;
  },

  render(challenge, container, submit) {
    container.append(
      el('p', { class: 'hint' }, 'Pick the INK color'),
      el('div', { class: 'big clash-word', style: `color:${hexOf(challenge.ink)}` }, challenge.word),
    );
    const buttons = challenge.options.map((name, i) => {
      const btn = el(
        'button',
        { type: 'button', class: 'btn color-btn' },
        el('span', { class: 'swatch', style: `background:${hexOf(name)}` }),
        el('span', {}, name),
        el('kbd', {}, String(i + 1)),
      );
      btn.addEventListener('click', () => submit(name));
      return btn;
    });
    container.append(el('div', { class: 'color-grid' }, ...buttons));

    // Keyboard shortcut: press 1–6 to choose.
    const onKey = (e) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < challenge.options.length) submit(challenge.options[i]);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey); // cleanup
  },
};

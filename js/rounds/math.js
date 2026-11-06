// Quick Math: solve a short arithmetic expression.
import { randInt, pick, textAnswer, el } from '../util.js';

/** Evaluates numbers/operators with normal precedence (× before + and −). */
export function evaluate(nums, ops) {
  // First pass: collapse multiplications.
  const terms = [nums[0]];
  const addOps = [];
  ops.forEach((op, i) => {
    if (op === '×') terms[terms.length - 1] *= nums[i + 1];
    else {
      addOps.push(op);
      terms.push(nums[i + 1]);
    }
  });
  // Second pass: + and − left to right.
  return addOps.reduce(
    (total, op, i) => (op === '+' ? total + terms[i + 1] : total - terms[i + 1]),
    terms[0],
  );
}

export default {
  id: 'math',
  name: 'Quick Math',

  generate(level) {
    const max = 10 + (level - 1) * 4; // bigger numbers as you level up
    const mulMax = Math.min(12, 3 + level); // keep × operands mental-math friendly
    const count = level >= 3 ? 3 : 2; // three numbers from level 3

    // Keep trying until the answer isn't negative (usually 1–2 tries).
    for (;;) {
      const ops = [];
      for (let i = 0; i < count - 1; i++) {
        const canMultiply = level >= 2 && !ops.includes('×'); // at most one ×
        ops.push(canMultiply && Math.random() < 0.5 ? '×' : pick(['+', '−']));
      }
      const nums = Array.from({ length: count }, () => randInt(1, max));
      const m = ops.indexOf('×');
      if (m >= 0) {
        nums[m] = randInt(2, mulMax);
        nums[m + 1] = randInt(2, mulMax);
      }
      const answer = evaluate(nums, ops);
      if (answer >= 0) {
        const text = nums.map((n, i) => (i === 0 ? `${n}` : ` ${ops[i - 1]} ${n}`)).join('');
        return { text, answer };
      }
    }
  },

  check(challenge, answer) {
    const s = String(answer).trim();
    if (!/^-?\d+$/.test(s)) return false; // empty or not a whole number = wrong
    return Number(s) === challenge.answer;
  },

  answerText(challenge) {
    return String(challenge.answer);
  },

  render(challenge, container, submit) {
    container.append(el('div', { class: 'big' }, `${challenge.text} = ?`));
    textAnswer(container, submit).focus();
  },
};

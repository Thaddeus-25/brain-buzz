// Small helpers shared by the rounds and the game loop.

/** Random integer between min and max, inclusive. */
export function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Random element of an array. */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Returns a shuffled copy of an array (Fisher–Yates). */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Create a DOM element: el('button', { class: 'btn' }, 'Click me'). */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'style') node.style.cssText = value;
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

/**
 * Adds a "type your answer + Enter" form to the container.
 * Calls submit(text) when the player presses Enter or the button.
 * Returns the <input> so the caller can focus it.
 */
export function textAnswer(container, submit) {
  const input = el('input', {
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    placeholder: 'Your answer',
    'aria-label': 'Your answer',
    class: 'answer-input',
  });
  const button = el('button', { type: 'submit', class: 'btn primary' }, 'Enter');
  const form = el('form', { class: 'answer-form' }, input, button);
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    submit(input.value);
  });
  container.append(form);
  return input;
}

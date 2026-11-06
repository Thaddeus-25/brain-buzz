// Dark / light theme. A saved choice wins; otherwise follow the computer's setting.
// The CSS does the actual recoloring based on <html data-theme="...">.
import { defaultStore } from './storage.js';

const KEY = 'brainBuzz.theme';

/** Pure: which theme to show, given the saved choice and the system setting. */
export function resolveTheme(saved, systemPrefersDark) {
  if (saved === 'light' || saved === 'dark') return saved;
  return systemPrefersDark ? 'dark' : 'light';
}

export function loadSavedTheme(store = defaultStore()) {
  try {
    return store?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export function saveTheme(theme, store = defaultStore()) {
  try {
    store?.setItem(KEY, theme);
  } catch {
    // storage blocked: the toggle still works, it just isn't remembered
  }
}

/** Hooks up the toggle button. Call once when the page loads. */
export function initTheme(button) {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  let current = resolveTheme(loadSavedTheme(), systemDark.matches);

  function apply(theme) {
    current = theme;
    document.documentElement.dataset.theme = theme;
    const next = theme === 'dark' ? 'light' : 'dark';
    button.textContent = theme === 'dark' ? '☀' : '☾';
    button.setAttribute('aria-label', `Switch to ${next} theme`);
    button.title = `Switch to ${next} theme`;
  }

  button.addEventListener('click', () => {
    const next = current === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    apply(next);
  });

  // If there's no saved choice, keep following the system setting live.
  systemDark.addEventListener('change', (e) => {
    if (!loadSavedTheme()) apply(e.matches ? 'dark' : 'light');
  });

  apply(current);
}

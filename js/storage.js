// Best scores saved in the browser's localStorage.
// `store` can be swapped out in tests; if storage is blocked we just don't save.

const key = (mode) => `brainBuzz.best.${mode}`;

function defaultStore() {
  try {
    return window.localStorage;
  } catch {
    return null; // e.g. storage disabled in private browsing
  }
}

export function loadBest(mode, store = defaultStore()) {
  try {
    const value = parseInt(store?.getItem(key(mode)), 10);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function saveBest(mode, score, store = defaultStore()) {
  try {
    if (!store) return false;
    store.setItem(key(mode), String(score));
    return true;
  } catch {
    return false;
  }
}

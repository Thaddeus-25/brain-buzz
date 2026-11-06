# Brain Buzz

A small, lightweight browser mind game to keep your brain working and keep you awake.
Quick mixed rounds, no sound, nothing to install.

**Play:** https://thaddeus-25.github.io/brain-buzz/

## Round types

| Round | What you do |
|---|---|
| **Quick Math** | Solve the expression and type the answer. |
| **Color Clash** | A color word is drawn in a different ink. Pick the **ink** color (keys 1–6 work too). |
| **Number Memory** | Digits flash briefly. Type them back from memory. |
| **Odd One Out** | Tap the one symbol in the grid that's different. |

Rounds are picked at random (never the same twice in a row) and get harder every 5 correct answers.

## Modes

- **Endless**: 3 lives and a per-round timer that shrinks as you level up. A wrong answer or a timeout costs a life.
- **Sprint**: 60 seconds total. A wrong answer costs 2 seconds.

Correct answers are worth 10 points plus a streak bonus (up to +20). Best scores are saved in your browser.

## Controls

- **Esc** or the **Pause** button pauses the game and freezes all timers. Press Esc again (or **Resume**) to continue with a fresh challenge, or choose **Quit to menu**.
- The game also pauses itself when you switch tabs or windows.
- The **☀ / ☾** button (top right) switches between dark and light themes. Until you pick one, it follows your computer's setting.

## Run locally

The game uses JavaScript modules, which browsers won't load from a double-clicked file.
Serve the folder instead:

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Tests

- In the browser: open `http://localhost:8000/tests.html`
- Or in Node: `node js/tests.js`

## Project layout

```
index.html, style.css     the page and its look
js/main.js                game loop: screens, timers, lives, score
js/game.js                pure rules: levels, timers, points, round picking
js/storage.js             best scores (localStorage)
js/theme.js               dark/light theme toggle
js/rounds/*.js            one file per round type, all with the same interface
js/tests.js, tests.html   tests
```

Each round exports `{ id, name, generate(level), check(challenge, answer), answerText(challenge), render(challenge, container, submit) }`.
To add a new round type, create a file with that shape and add it to `js/rounds/index.js`.

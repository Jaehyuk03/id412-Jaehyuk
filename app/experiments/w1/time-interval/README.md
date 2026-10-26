# Time Interval

A full-screen grid of neon-green digits. Every cell counts 0 → 9 at its own random speed and wraps back to 0; some cells are blank, and glowing "digital rain" drops fall down the columns.

- Route: /experiments/w1/time-interval
- Week: W1 · Tech: Canvas, requestAnimationFrame, CSS Modules
- Inputs: time only
- Parameters: CELL (28 px), MIN_INTERVAL / MAX_INTERVAL (60–900 ms), BLANK_CHANCE (0.12), TRAIL (12 cells), GLOW (14 px)

## How it works
- `resize()` builds a grid of `CELL`-sized cells that covers the whole window (rebuilt on resize).
- Each cell has its own `interval`; when `now` passes its `next` time it adds 1 and wraps at 10.
- On wrapping to 0 a cell re-rolls its speed and whether it is blank.
- One drop per column moves down at a random speed; digits just behind the head are drawn brighter, fading over `TRAIL` cells.
- Digits are drawn neon green (`#39ff14`); the bright ones get a canvas `shadowBlur` glow, dim ones none (keeps it fast).

## Run
pnpm dev → http://localhost:3000/experiments/w1/time-interval

## Status / next
Works. Next: drops that react to the mouse, or colour per speed.

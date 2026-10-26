# Time Interval

A full-screen grid of neon-green digits. Every cell counts 0 → 9 at its own random speed and wraps back to 0; some cells are blank, and glowing "digital rain" drops fall down the columns. Scroll to zoom in and out around the mouse; the screen edges glow the same neon green.

- Route: /experiments/w1/time-interval
- Week: W1 · Tech: Canvas, requestAnimationFrame, CSS Modules
- Inputs: time, scroll wheel + mouse position (zoom)
- Parameters: CELL (28 px), MIN_INTERVAL / MAX_INTERVAL (60–900 ms), BLANK_CHANCE (0.12), TRAIL (12 cells), GLOW (14 px), MIN_ZOOM / MAX_ZOOM (0.5–4), EDGE (120 px)

## How it works
- `resize()` builds a grid of `CELL`-sized cells that covers the whole window (rebuilt on resize).
- Each cell has its own `interval`; when `now` passes its `next` time it adds 1 and wraps at 10.
- On wrapping to 0 a cell re-rolls its speed and whether it is blank.
- One drop per column moves down at a random speed; digits just behind the head are drawn brighter, fading over `TRAIL` cells.
- Digits are drawn neon green (`#39ff14`); the bright ones get a canvas `shadowBlur` glow, dim ones none (keeps it fast).
- Scrolling changes `targetZoom`; `zoom` eases toward it and `offsetX/Y` move so the point under the mouse stays put. The offset is clamped so the grid always covers the screen; only on-screen cells are drawn.
- `drawEdgeGlow()` runs last each frame: four gradients fading inward over `EDGE` px, plus a bright green line with `shadowBlur` at the very edge.

## Run
pnpm dev → http://localhost:3000/experiments/w1/time-interval

## Status / next
Works. Next: drops that react to the mouse, or colour per speed.

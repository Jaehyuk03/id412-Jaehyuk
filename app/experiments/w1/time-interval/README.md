# Time Interval

A world map made of neon-green digits. Every land cell counts 0 → 9 at its own random speed, and now and then shows a letter of its country's name instead (Korea: k, o, r, e, a). Glowing "digital rain" falls down the columns, the screen edges glow, and the cursor is a neon scope with an afterimage.

- Route: /experiments/w1/time-interval
- Week: W1 · Tech: Canvas, requestAnimationFrame, CSS Modules
- Inputs: time, scroll wheel (zoom around the mouse), drag (move), mouse position (scope)
- Parameters: CELL (28 px), MIN_INTERVAL / MAX_INTERVAL (60–900 ms), BLANK_CHANCE (0.12), LETTER_CHANCE (0.15), MAX_ZOOM (2)
- Asset: `public/experiments/w1/time-interval/world.json`

## How it works
- `world.json` is a 360 × 144 grid (1° per cell, 84°N to 60°S) made from Natural Earth's 110m country shapes. Each row is run-length encoded as `[country, count, …]`, `-1` is ocean; `names` holds the English country names (a few shortened: South Korea → Korea, China).
- `loadMap()` unpacks it into one cell per square. Ocean cells are skipped; land cells count up on their own `interval` and, on each tick, show a random letter of their country's name with `LETTER_CHANCE`.
- One rain drop per column; digits just behind the head are brighter and glow (`shadowBlur`).
- Scrolling eases `zoom` toward `targetZoom` around the mouse; dragging moves `offsetX/Y`. The offset is clamped so the map always covers the screen. Zoomed far out, cells are drawn as small squares instead of text.
- `drawEdgeGlow()` and `drawScope()` run last each frame. The scope keeps its last `SCOPE_TRAIL` positions and draws the older ones fainter, which makes the afterimage.

## Run
pnpm dev → http://localhost:3000/experiments/w1/time-interval

## Status / next
Works. Small countries are only a cell or two at 1°. Next: show the country name under the scope.

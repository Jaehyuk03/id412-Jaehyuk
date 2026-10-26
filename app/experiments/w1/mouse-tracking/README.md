# Mouse Tracking

A black screen that follows the mouse: a crosshair through the cursor, a neon-green trail of where it has been, and a cute puppy that runs after it. When the mouse stops, the puppy sits; when the mouse moves again, it barks ("멍!") and runs after it. The x / y position and the speed are printed next to the cursor.

- Route: /experiments/w1/mouse-tracking
- Week: W1 · Tech: Canvas, requestAnimationFrame, CSS Modules
- Inputs: mouse position, time
- Parameters: EASE (0.08), STOP_DIST (60 px), SIT_DELAY (600 ms), BARK_TIME (450 ms), TRAIL (60 positions)

## How it works
- `mousemove` only stores the latest position in `mouse`; all drawing happens in the `requestAnimationFrame` loop.
- The puppy is four SVG pictures in `public/experiments/w1/mouse-tracking/` (`run-1`, `run-2`, `sit`, `bark`), loaded with `new Image()` and drawn with `drawImage`.
- Each frame picks a pose: barking (for `BARK_TIME` after waking up) → running (if farther than `STOP_DIST` from the cursor) → sitting (after `SIT_DELAY` without moving).
- Running moves `EASE` of the remaining distance each frame, swaps `run-1` / `run-2` every 120 ms and hops a little. `ctx.scale(-1, 1)` flips it when the cursor is to the left.
- A sitting puppy only gets up once the mouse is `WAKE_DIST` farther away, so small jiggles don't wake it.
- `drawBark()` draws the "멍!" bubble, which fades out shortly after the bark.

## Run
pnpm dev → http://localhost:3000/experiments/w1/mouse-tracking

## Status / next
Works. Next: a real bark sound with Tone.js, or a puppy that gets tired and lies down after a long time.

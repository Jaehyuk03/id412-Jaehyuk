# Mouse Tracking

A plain black screen with a small white pixel puppy (big head, floppy ears) that runs after the mouse. When the mouse stops, the puppy sits; when the mouse moves again, it barks ("멍!") and runs after it.

- Route: /experiments/w1/mouse-tracking
- Week: W1 · Tech: Canvas, requestAnimationFrame, CSS Modules
- Inputs: mouse position, time
- Parameters: PIXEL (4 px), EASE (0.08), STOP_DIST (40 px), WAKE_DIST (30 px), SIT_DELAY (600 ms), BARK_TIME (450 ms)

## How it works
- `mousemove` only stores the latest position in `mouse`; all drawing happens in the `requestAnimationFrame` loop.
- The puppy is four 16 × 12 pixel grids in `sprites.ts` (`RUN_1`, `RUN_2`, `SIT`, `BARK`): `#` is a white pixel, `.` is empty. Edit them by hand to change the puppy.
- `drawPuppy()` draws every `#` as a `PIXEL`-sized square with `fillRect`.
- Each frame picks a pose: barking (for `BARK_TIME` after waking up) → running (if farther than `STOP_DIST` from the cursor) → sitting (after `SIT_DELAY` without moving).
- Running moves `EASE` of the remaining distance each frame and swaps `RUN_1` / `RUN_2` every 120 ms, hopping one pixel on the second. When the cursor is to the left, each row is read from the right, which mirrors the puppy.
- A sitting puppy only gets up once the mouse is `WAKE_DIST` farther away, so small jiggles don't wake it.
- `drawBark()` draws a small white "멍!" box, which fades out shortly after the bark.

## Run
pnpm dev → http://localhost:3000/experiments/w1/mouse-tracking

## Status / next
Works. Next: a real bark sound with Tone.js, or a puppy that gets tired and lies down after a long time.

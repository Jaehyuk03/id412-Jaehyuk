# Mouse Tracking

A plain black screen with a tiny white pixel puppy (RunCat style, side view) that runs after the mouse. When the mouse stops, the puppy sits. When the cursor runs away, the puppy jumps, bites the cursor (a pixel chew bone, 개껌), shakes it, lets go with a "멍!" and runs after it.

- Route: /experiments/w1/mouse-tracking
- Week: W1 · Tech: Canvas, requestAnimationFrame, CSS Modules
- Inputs: mouse position, time
- Parameters: PIXEL (2 px), EASE (0.08), STOP_DIST (36 px), SIT_DELAY (600 ms), HOLD_TIME (500 ms)

## How it works
- The puppy and the cursor are pixel grids in `sprites.ts` (`RUN_1`, `RUN_2`, `STAND`, `BARK`, `SIT`, `BONE`): `#` white, `o` black, `.` empty. `drawSprite()` draws each as `PIXEL`-sized squares; reading rows from the right mirrors the puppy to face left.
- The real cursor is hidden (`cursor: none`); the page draws a chew bone (`BONE`) centred on the mouse so the puppy can hold it.
- The puppy has a `mode`: `run` (follow, stop `STOP_DIST` away) → `sit` (after `SIT_DELAY` still) → `lunge` (cursor moved `WAKE_DIST` away: jump so `MOUTH` lands on it) → `hold` (shake for `HOLD_TIME`) → back to `run`.
- While held, the drawn cursor sticks to the mouth; after letting go it springs back to the real mouse (`CURSOR_EASE`) and a "멍!" box fades out.

## Run
pnpm dev → http://localhost:3000/experiments/w1/mouse-tracking

## Status / next
Works. Next: a real bark sound with Tone.js, or more running frames for a smoother gallop.

# Mouse Tracking

A black screen that follows the mouse: a crosshair through the cursor, a neon-green trail of where it has been, and a glowing dot that eases after it. The x / y position and the speed are printed next to the cursor.

- Route: /experiments/w1/mouse-tracking
- Week: W1 · Tech: Canvas, requestAnimationFrame, CSS Modules
- Inputs: mouse position
- Parameters: TRAIL (60 positions), EASE (0.12), DOT (10 px), COLOR (neon green)

## How it works
- `mousemove` only stores the latest position in `mouse`; all drawing happens in the `requestAnimationFrame` loop.
- Each frame the position is pushed onto `trail`; the oldest is dropped past `TRAIL`. Older segments are drawn thinner and fainter.
- The follower moves `EASE` of the remaining distance each frame, so it lags behind and catches up smoothly.
- Speed is the distance moved since the last frame, smoothed so the number is readable.

## Run
pnpm dev → http://localhost:3000/experiments/w1/mouse-tracking

## Status / next
Works. Next: colour or trail length from speed, or several followers with different `EASE`.

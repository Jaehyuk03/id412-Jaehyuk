# Time Interval

A number that counts from 0 to 100, one step every 100 ms, then starts over. White on black, nothing else.

- Route: /experiments/w1/time-interval
- Week: W1 · Tech: React state + setInterval, CSS Modules
- Inputs: time only
- Parameters: MAX_COUNT (100), INTERVAL (100 ms)

## How it works
- `useEffect` starts one `setInterval`; each tick adds 1 to `count` and wraps at `MAX_COUNT`.
- The cleanup clears the interval when the page unmounts.
- Layout is a fixed full-screen flex box; the number is sized in `vw` so it scales with the window.

## Run
pnpm dev → http://localhost:3000/experiments/w1/time-interval

## Status / next
Works. Next: vary the interval, or drive it with the mouse.

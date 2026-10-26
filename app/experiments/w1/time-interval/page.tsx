"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

// A full-screen grid of digits. Each cell counts 0 → 9 at its own random speed,
// then wraps back to 0. Some cells are blank. Bright "rain" drops fall down the
// columns and light up the digits they pass.
const CELL = 28; // px, size of one grid cell
const MIN_INTERVAL = 60; // ms, fastest a cell can count
const MAX_INTERVAL = 900; // ms, slowest a cell can count
const BLANK_CHANCE = 0.12; // chance a cell is blank (re-rolled each time it wraps to 0)
const TRAIL = 12; // cells, length of the rain trail

type Cell = { digit: number; interval: number; next: number; blank: boolean };
type Drop = { y: number; speed: number }; // y in cells, speed in cells per second

function randomInterval() {
  return MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
}

export default function TimeInterval() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let cols = 0;
    let rows = 0;
    let cells: Cell[] = [];
    let drops: Drop[] = [];

    function newDrop(startAbove: boolean): Drop {
      return {
        y: startAbove ? -Math.random() * rows : Math.random() * rows,
        speed: 6 + Math.random() * 18,
      };
    }

    // Rebuild the grid so it always covers the whole window.
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(innerWidth / CELL);
      rows = Math.ceil(innerHeight / CELL);
      const now = performance.now();
      cells = Array.from({ length: cols * rows }, () => ({
        digit: Math.floor(Math.random() * 10),
        interval: randomInterval(),
        next: now + Math.random() * MAX_INTERVAL,
        blank: Math.random() < BLANK_CHANCE,
      }));
      drops = Array.from({ length: cols }, () => newDrop(false));
    }

    let last = performance.now();
    let frame = 0;

    function draw(now: number) {
      const dt = (now - last) / 1000;
      last = now;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.font = `${CELL * 0.8}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let x = 0; x < cols; x++) {
        const drop = drops[x];
        drop.y += drop.speed * dt;
        if (drop.y - TRAIL > rows) drops[x] = newDrop(true);

        for (let y = 0; y < rows; y++) {
          const cell = cells[y * cols + x];

          // Count up when this cell's own interval has passed.
          if (now >= cell.next) {
            cell.digit = (cell.digit + 1) % 10;
            cell.next = now + cell.interval;
            if (cell.digit === 0) {
              cell.blank = Math.random() < BLANK_CHANCE;
              cell.interval = randomInterval();
            }
          }
          if (cell.blank) continue;

          // Brightness: dim by default, bright near the head of the drop.
          const behind = drop.y - y; // cells between this cell and the drop head
          let light = 0.18;
          if (behind >= 0 && behind < TRAIL) light += (1 - behind / TRAIL) * 0.82;

          ctx.fillStyle = `rgba(255, 255, 255, ${light})`;
          ctx.fillText(String(cell.digit), x * CELL + CELL / 2, y * CELL + CELL / 2);
        }
      }

      frame = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <main className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </main>
  );
}

"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

// A full-screen grid of digits. Each cell counts 0 → 9 at its own random speed,
// then wraps back to 0. Some cells are blank. Bright "rain" drops fall down the
// columns and light up the digits they pass. Scroll to zoom in and out.
const CELL = 28; // px, size of one grid cell
const MIN_INTERVAL = 60; // ms, fastest a cell can count
const MAX_INTERVAL = 900; // ms, slowest a cell can count
const BLANK_CHANCE = 0.12; // chance a cell is blank (re-rolled each time it wraps to 0)
const TRAIL = 12; // cells, length of the rain trail
const GLOW = 14; // px, neon glow blur on the brightest digits
const MIN_ZOOM = 0.5; // most zoomed out
const MAX_ZOOM = 4; // most zoomed in
const ZOOM_SPEED = 0.0015; // how much one scroll step zooms

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
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let cells: Cell[] = [];
    let drops: Drop[] = [];
    let zoom = 1; // current zoom, eases toward targetZoom
    let targetZoom = 1; // set by the scroll wheel

    function newDrop(startAbove: boolean): Drop {
      return {
        y: startAbove ? -Math.random() * rows : Math.random() * rows,
        speed: 6 + Math.random() * 18,
      };
    }

    // Rebuild the grid. It is made big enough to still cover the whole window
    // when zoomed all the way out (MIN_ZOOM).
    function resize() {
      dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      cols = Math.ceil(innerWidth / (CELL * MIN_ZOOM)) + 2;
      rows = Math.ceil(innerHeight / (CELL * MIN_ZOOM)) + 2;
      const now = performance.now();
      cells = Array.from({ length: cols * rows }, () => ({
        digit: Math.floor(Math.random() * 10),
        interval: randomInterval(),
        next: now + Math.random() * MAX_INTERVAL,
        blank: Math.random() < BLANK_CHANCE,
      }));
      drops = Array.from({ length: cols }, () => newDrop(false));
    }

    // Scroll up = zoom in, scroll down = zoom out.
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      targetZoom *= Math.exp(-event.deltaY * ZOOM_SPEED);
      targetZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoom));
    }

    let last = performance.now();
    let frame = 0;

    function draw(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      zoom += (targetZoom - zoom) * 0.15; // ease, so zooming feels smooth

      // Clear the screen.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, innerWidth, innerHeight);

      // Zoom around the centre of the screen: the grid's centre stays in the middle.
      const gridW = cols * CELL;
      const gridH = rows * CELL;
      ctx.translate(innerWidth / 2, innerHeight / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-gridW / 2, -gridH / 2);

      // Only draw the cells that are on screen at this zoom.
      const halfW = innerWidth / 2 / zoom;
      const halfH = innerHeight / 2 / zoom;
      const firstCol = Math.max(0, Math.floor((gridW / 2 - halfW) / CELL));
      const lastCol = Math.min(cols - 1, Math.ceil((gridW / 2 + halfW) / CELL));
      const firstRow = Math.max(0, Math.floor((gridH / 2 - halfH) / CELL));
      const lastRow = Math.min(rows - 1, Math.ceil((gridH / 2 + halfH) / CELL));

      ctx.font = `${CELL * 0.8}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#39ff14";

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
          if (x < firstCol || x > lastCol || y < firstRow || y > lastRow) continue;

          // Brightness: dim by default, bright near the head of the drop.
          const behind = drop.y - y; // cells between this cell and the drop head
          let light = 0.18;
          if (behind >= 0 && behind < TRAIL) light += (1 - behind / TRAIL) * 0.82;

          // Neon green; brighter digits also get a glow (shadowBlur) like a neon sign.
          ctx.fillStyle = `rgba(57, 255, 20, ${light})`;
          ctx.shadowBlur = light > 0.4 ? GLOW * light * zoom : 0;
          ctx.fillText(String(cell.digit), x * CELL + CELL / 2, y * CELL + CELL / 2);
        }
      }

      frame = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <main className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </main>
  );
}

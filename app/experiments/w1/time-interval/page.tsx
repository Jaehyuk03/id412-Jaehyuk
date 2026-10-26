"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

// A world map made of digits. Every land cell counts 0 → 9 at its own random
// speed, and now and then shows a letter from its country's name instead
// (Korea: k, o, r, e, a). Bright "rain" drops fall down the columns.
// Scroll to zoom around the mouse, drag to move. The cursor is a neon scope.
const MAP_URL = "/experiments/w1/time-interval/world.json"; // 1° grid, one country per cell
const CELL = 28; // px, size of one grid cell at zoom 1
const MIN_INTERVAL = 60; // ms, fastest a cell can count
const MAX_INTERVAL = 900; // ms, slowest a cell can count
const BLANK_CHANCE = 0.12; // chance a land cell is blank (re-rolled each time it wraps to 0)
const LETTER_CHANCE = 0.15; // chance a cell shows a letter of its country instead of a digit
const TRAIL = 12; // cells, length of the rain trail
const GLOW = 14; // px, neon glow blur on the brightest digits
const MAX_ZOOM = 2; // most zoomed in (most zoomed out = whole map height fits the screen)
const ZOOM_SPEED = 0.0015; // how much one scroll step zooms
const EDGE = 40; // px, how far the neon edge glow reaches into the screen
const SCOPE = 18; // px, radius of the cursor scope
const SCOPE_TRAIL = 12; // frames of afterimage behind the scope
const GREEN = "#39ff14";

// The map file: each row is [country, runLength, country, runLength, ...], -1 is ocean.
type WorldMap = { cols: number; rows: number; names: string[]; cells: number[][] };
type Cell = {
  country: number; // index into names, -1 for ocean
  digit: number;
  letter: string; // "" shows the digit
  interval: number;
  next: number;
  blank: boolean;
};
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
    let cols = 0; // 0 until the map has loaded
    let rows = 0;
    let cells: Cell[] = [];
    let letters: string[] = []; // per country: its name as lowercase letters, "southafrica"
    let drops: Drop[] = [];
    let zoom = 1; // current zoom, eases toward targetZoom
    let targetZoom = 1; // set by the scroll wheel
    let offsetX = 0; // where the grid's top-left corner is on screen, in px
    let offsetY = 0;
    let mouseX = innerWidth / 2;
    let mouseY = innerHeight / 2;
    let mouseOnScreen = false;
    let dragging = false;
    let scopeTrail: { x: number; y: number }[] = []; // last positions, for the afterimage

    // Smallest zoom where the map still covers the whole screen.
    function minZoom() {
      if (!cols) return 1;
      return Math.max(innerWidth / (cols * CELL), innerHeight / (rows * CELL));
    }

    function newDrop(startAbove: boolean): Drop {
      return {
        y: startAbove ? -Math.random() * rows : Math.random() * rows,
        speed: 6 + Math.random() * 18,
      };
    }

    // Unpack the map file into one Cell per grid square, then show the whole map.
    async function loadMap() {
      const map: WorldMap = await (await fetch(MAP_URL)).json();
      const now = performance.now();
      letters = map.names.map((name) =>
        name.normalize("NFD").toLowerCase().replace(/[^a-z]/g, "")
      );
      cells = [];
      for (const row of map.cells) {
        for (let i = 0; i < row.length; i += 2) {
          for (let n = 0; n < row[i + 1]; n++) {
            cells.push({
              country: row[i],
              digit: Math.floor(Math.random() * 10),
              letter: "",
              interval: randomInterval(),
              next: now + Math.random() * MAX_INTERVAL,
              blank: Math.random() < BLANK_CHANCE,
            });
          }
        }
      }
      cols = map.cols;
      rows = map.rows;
      drops = Array.from({ length: cols }, () => newDrop(false));
      zoom = targetZoom = minZoom();
      offsetX = (innerWidth - cols * CELL * zoom) / 2;
      offsetY = (innerHeight - rows * CELL * zoom) / 2;
    }

    function resize() {
      dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      targetZoom = Math.max(minZoom(), targetZoom);
    }

    // Scroll up = zoom in, scroll down = zoom out, around the mouse.
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      targetZoom *= Math.exp(-event.deltaY * ZOOM_SPEED);
      targetZoom = Math.min(MAX_ZOOM, Math.max(minZoom(), targetZoom));
    }

    function onMouseMove(event: MouseEvent) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      mouseOnScreen = true;
      if (dragging) {
        offsetX += event.movementX;
        offsetY += event.movementY;
      }
    }
    const onMouseDown = () => (dragging = true);
    const onMouseUp = () => (dragging = false);
    const onMouseLeave = () => {
      dragging = false;
      mouseOnScreen = false;
    };

    let last = performance.now();
    let frame = 0;

    function draw(now: number) {
      const dt = (now - last) / 1000;
      last = now;

      // Ease toward targetZoom, so zooming feels smooth. Move the grid so the
      // point under the mouse stays under the mouse while it scales.
      const newZoom = zoom + (targetZoom - zoom) * 0.15;
      offsetX = mouseX - (mouseX - offsetX) * (newZoom / zoom);
      offsetY = mouseY - (mouseY - offsetY) * (newZoom / zoom);
      zoom = newZoom;

      // Keep the grid covering the whole screen (no black gaps at the edges).
      offsetX = Math.min(0, Math.max(innerWidth - cols * CELL * zoom, offsetX));
      offsetY = Math.min(0, Math.max(innerHeight - rows * CELL * zoom, offsetY));

      // Clear the screen.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, innerWidth, innerHeight);

      if (cols) drawMap(now, dt);
      drawEdgeGlow();
      drawScope();
      frame = requestAnimationFrame(draw);
    }

    function drawMap(now: number, dt: number) {
      ctx.translate(offsetX, offsetY);
      ctx.scale(zoom, zoom);

      // Only draw the cells that are on screen at this zoom.
      const cellOnScreen = CELL * zoom;
      const firstCol = Math.max(0, Math.floor(-offsetX / cellOnScreen));
      const lastCol = Math.min(cols - 1, Math.ceil((innerWidth - offsetX) / cellOnScreen));
      const firstRow = Math.max(0, Math.floor(-offsetY / cellOnScreen));
      const lastRow = Math.min(rows - 1, Math.ceil((innerHeight - offsetY) / cellOnScreen));

      // Zoomed far out the characters are too small to read: draw small squares instead.
      const asText = cellOnScreen >= 9;
      const glow = cellOnScreen >= 14;
      ctx.font = `${CELL * 0.8}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = GREEN;
      ctx.shadowColor = GREEN;

      for (let x = 0; x < cols; x++) {
        const drop = drops[x];
        drop.y += drop.speed * dt;
        if (drop.y - TRAIL > rows) drops[x] = newDrop(true);

        for (let y = 0; y < rows; y++) {
          const cell = cells[y * cols + x];
          if (cell.country < 0) continue; // ocean

          // Count up when this cell's own interval has passed.
          if (now >= cell.next) {
            cell.digit = (cell.digit + 1) % 10;
            cell.next = now + cell.interval;
            // Sometimes show a letter of this country's name instead of the digit.
            const name = letters[cell.country];
            cell.letter =
              Math.random() < LETTER_CHANCE ? name[Math.floor(Math.random() * name.length)] : "";
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
          if (cell.letter) light = Math.min(1, light + 0.35); // letters stand out a little

          ctx.globalAlpha = light;
          if (asText) {
            // Brighter characters also get a glow (shadowBlur) like a neon sign.
            ctx.shadowBlur = glow && light > 0.4 ? GLOW * light * zoom : 0;
            const text = cell.letter || String(cell.digit);
            ctx.fillText(text, x * CELL + CELL / 2, y * CELL + CELL / 2);
          } else {
            ctx.fillRect(x * CELL + CELL * 0.2, y * CELL + CELL * 0.2, CELL * 0.6, CELL * 0.6);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // Neon-green glow along the screen edges, drawn on top of the map.
    function drawEdgeGlow() {
      const w = innerWidth;
      const h = innerHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Soft glow fading inward from each edge.
      const edges = [
        [0, 0, 0, EDGE, 0, 0, w, EDGE], // top
        [0, h, 0, h - EDGE, 0, h - EDGE, w, EDGE], // bottom
        [0, 0, EDGE, 0, 0, 0, EDGE, h], // left
        [w, 0, w - EDGE, 0, w - EDGE, 0, EDGE, h], // right
      ];
      ctx.shadowBlur = 0;
      for (const [x0, y0, x1, y1, rx, ry, rw, rh] of edges) {
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        gradient.addColorStop(0, "rgba(57, 255, 20, 0.18)");
        gradient.addColorStop(1, "rgba(57, 255, 20, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(rx, ry, rw, rh);
      }

      // Thin neon line right at the edge.
      ctx.strokeStyle = "rgba(57, 255, 20, 0.6)";
      ctx.lineWidth = 0.5;
      ctx.shadowColor = GREEN;
      ctx.shadowBlur = 3;
      ctx.strokeRect(0, 0, w, h);
    }

    // The cursor: a neon cross-hair scope. Older positions are drawn fainter,
    // which leaves a short afterimage when the mouse moves.
    function drawScope() {
      if (!mouseOnScreen) {
        scopeTrail = [];
        return;
      }
      scopeTrail.push({ x: mouseX, y: mouseY });
      if (scopeTrail.length > SCOPE_TRAIL) scopeTrail.shift();

      ctx.strokeStyle = GREEN;
      ctx.fillStyle = GREEN;
      ctx.shadowColor = GREEN;
      scopeTrail.forEach((p, i) => {
        const newest = i === scopeTrail.length - 1;
        ctx.globalAlpha = newest ? 1 : ((i + 1) / scopeTrail.length) * 0.3;
        ctx.shadowBlur = newest ? 10 : 0;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, SCOPE, 0, Math.PI * 2);
        // Cross: four lines from just outside the circle to near the centre.
        ctx.moveTo(p.x - SCOPE - 8, p.y);
        ctx.lineTo(p.x - 5, p.y);
        ctx.moveTo(p.x + 5, p.y);
        ctx.lineTo(p.x + SCOPE + 8, p.y);
        ctx.moveTo(p.x, p.y - SCOPE - 8);
        ctx.lineTo(p.x, p.y - 5);
        ctx.moveTo(p.x, p.y + 5);
        ctx.lineTo(p.x, p.y + SCOPE + 8);
        ctx.stroke();
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2); // centre dot
      });
      ctx.globalAlpha = 1;
    }

    resize();
    loadMap();
    window.addEventListener("resize", resize);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <main className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </main>
  );
}

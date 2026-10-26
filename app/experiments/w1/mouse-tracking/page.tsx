"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";
import { BARK, CURSOR, MOUTH, RUN_1, RUN_2, SIT, STAND } from "./sprites";

// Tracks the mouse. A little white pixel puppy runs after the cursor. When the
// mouse stops, the puppy sits. When the cursor runs away from it, the puppy
// jumps, bites the cursor, shakes it, lets go with a "멍!" and runs after it.
// The real cursor is hidden; we draw our own so the puppy can hold it.
const PIXEL = 2; // px, size of one pixel of the puppy (28 × 16 pixels)
const EASE = 0.08; // how fast the puppy catches up (0 to 1)
const STOP_DIST = 36; // px, the puppy stops this far from the cursor
const WAKE_DIST = 30; // px, how far the cursor must move away before a sitting puppy jumps
const SIT_DELAY = 600; // ms standing still before the puppy sits
const LUNGE_TIME = 150; // ms the jump toward the cursor takes
const HOLD_TIME = 500; // ms the puppy holds and shakes the cursor
const BUBBLE_TIME = 800; // ms the "멍!" stays after letting go
const CURSOR_EASE = 0.25; // how fast the let-go cursor springs back to the mouse

type Point = { x: number; y: number };
type Mode = "run" | "sit" | "lunge" | "hold";

export default function MouseTracking() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = 1;
    let mouse: Point = { x: innerWidth / 2, y: innerHeight / 2 }; // the real mouse
    let cursor: Point = { ...mouse }; // where we draw the cursor
    let grab: Point = { ...mouse }; // where the puppy caught the cursor
    const dog: Point = { x: mouse.x - STOP_DIST, y: mouse.y }; // the puppy's feet
    let facing = 1; // 1 = looking right, -1 = looking left
    let mode: Mode = "run";
    let modeStart = performance.now(); // when the current mode began
    let lastMoved = performance.now(); // when the puppy last walked
    let letGo = -Infinity; // when the puppy last let go of the cursor
    let springBack = false; // true while the let-go cursor flies back to the mouse

    // Offset from the puppy's feet to its mouth, for the way it is facing.
    function mouthOffset(): Point {
      const w = STAND[0].length;
      return {
        x: facing * (MOUTH.col + 0.5 - w / 2) * PIXEL,
        y: (MOUTH.row - STAND.length) * PIXEL,
      };
    }

    function setMode(next: Mode, now: number) {
      mode = next;
      modeStart = now;
    }

    function resize() {
      dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
    }

    function onMouseMove(event: MouseEvent) {
      mouse = { x: event.clientX, y: event.clientY };
    }

    let frame = 0;

    function draw(now: number) {
      const dx = mouse.x - dog.x;
      const dy = mouse.y - dog.y;
      const dist = Math.hypot(dx, dy);
      const time = now - modeStart; // ms in the current mode
      let pose = STAND;
      let bob = 0; // px, little hop while running
      let shake = 0; // px, head shake while holding the cursor

      if (mode === "sit" && dist > STOP_DIST + WAKE_DIST) {
        // The cursor runs away from a sitting puppy: jump at it.
        grab = { ...mouse };
        facing = dx > 0 ? 1 : -1;
        setMode("lunge", now);
      }

      if (mode === "lunge") {
        // Jump so the mouth lands on the point where the cursor was caught.
        const m = mouthOffset();
        dog.x += (grab.x - m.x - dog.x) * 0.4;
        dog.y += (grab.y - m.y - dog.y) * 0.4;
        pose = BARK;
        if (time > LUNGE_TIME) setMode("hold", now);
      } else if (mode === "hold") {
        // Hold the cursor in the mouth and shake it, then let go.
        shake = Math.sin(now / 30) > 0 ? PIXEL : -PIXEL;
        if (time > HOLD_TIME) {
          setMode("run", now);
          letGo = now;
          springBack = true;
        }
      } else if (mode === "run" && dist > STOP_DIST + 1) {
        // Run toward a point STOP_DIST away from the cursor.
        const step = (dist - STOP_DIST) * EASE;
        dog.x += (dx / dist) * step;
        dog.y += (dy / dist) * step;
        if (Math.abs(dx) > 5) facing = dx > 0 ? 1 : -1;
        lastMoved = now;
        // Swap between the two running frames every 100 ms, hopping on the second.
        const step2 = Math.floor(now / 100) % 2 === 1;
        pose = step2 ? RUN_2 : RUN_1;
        bob = step2 ? PIXEL : 0;
      } else if (mode === "sit" || now - lastMoved > SIT_DELAY) {
        if (mode !== "sit") setMode("sit", now);
        pose = SIT;
      }

      // Where to draw the cursor: caught, in the mouth, flying back, or on the mouse.
      if (mode === "lunge") {
        cursor = { ...grab };
      } else if (mode === "hold") {
        const m = mouthOffset();
        cursor = { x: dog.x + m.x + shake, y: dog.y + m.y };
      } else if (springBack) {
        cursor.x += (mouse.x - cursor.x) * CURSOR_EASE;
        cursor.y += (mouse.y - cursor.y) * CURSOR_EASE;
        if (Math.hypot(mouse.x - cursor.x, mouse.y - cursor.y) < 1) springBack = false;
      } else {
        cursor = { ...mouse };
      }

      // Clear the screen.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, innerWidth, innerHeight);

      // Puppy, feet centred on dog.x / dog.y. Then the cursor on top of it.
      const w = pose[0].length * PIXEL;
      const h = pose.length * PIXEL;
      drawSprite(pose, dog.x - w / 2 + shake, dog.y - h - bob, facing === -1);
      drawSprite(CURSOR, cursor.x, cursor.y, false);

      // "멍!" after letting go, fading out.
      const age = now - letGo;
      if (age < BUBBLE_TIME) {
        drawBark(dog.x + facing * 20, dog.y - h - 14, 1 - age / BUBBLE_TIME);
      }

      frame = requestAnimationFrame(draw);
    }

    // Draw a sprite one square at a time from its top-left corner.
    // flip = true reads each row from the right, which mirrors it.
    function drawSprite(sprite: string[], x: number, y: number, flip: boolean) {
      const w = sprite[0].length;
      const left = Math.round(x);
      const top = Math.round(y);
      sprite.forEach((row, r) => {
        for (let c = 0; c < w; c++) {
          const pixel = flip ? row[w - 1 - c] : row[c];
          if (pixel === ".") continue;
          ctx.fillStyle = pixel === "#" ? "white" : "black";
          ctx.fillRect(left + c * PIXEL, top + r * PIXEL, PIXEL, PIXEL);
        }
      });
    }

    // A small white box with "멍!".
    function drawBark(x: number, y: number, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "white";
      ctx.fillRect(Math.round(x - 18), Math.round(y - 10), 36, 20);
      ctx.fillStyle = "black";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("멍!", x, y + 1);
      ctx.restore();
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <main className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </main>
  );
}

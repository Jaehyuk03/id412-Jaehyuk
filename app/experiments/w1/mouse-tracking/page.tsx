"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";
import { BARK, RUN_1, RUN_2, SIT } from "./sprites";

// Tracks the mouse. A little white pixel puppy runs after the cursor. When the
// mouse stops, the puppy sits; when the mouse moves again, it barks and runs.
const EASE = 0.08; // how fast the puppy catches up (0 to 1)
const STOP_DIST = 40; // px, the puppy stops this far from the cursor
const WAKE_DIST = 30; // px, how far the mouse must move away before a sitting puppy gets up
const SIT_DELAY = 600; // ms standing still before the puppy sits
const BARK_TIME = 450; // ms the puppy stands and barks before running
const PIXEL = 4; // px, size of one pixel of the puppy (16 × 11 pixels)

type Point = { x: number; y: number };

export default function MouseTracking() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = 1;
    let mouse: Point = { x: innerWidth / 2, y: innerHeight / 2 }; // where the mouse is now
    const dog: Point = { x: mouse.x - STOP_DIST, y: mouse.y }; // the puppy's feet
    let facing = 1; // 1 = looking right, -1 = looking left
    let sitting = false;
    let lastMoved = performance.now(); // when the puppy last walked
    let barkStart = -Infinity; // when the puppy last started barking

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
      // Puppy: decide what it does this frame.
      const dx = mouse.x - dog.x;
      const dy = mouse.y - dog.y;
      const dist = Math.hypot(dx, dy);
      let pose = RUN_1;
      let bob = 0; // px, little hop while running

      if (sitting && dist > STOP_DIST + WAKE_DIST) {
        // The mouse moved away from a sitting puppy: get up and bark.
        sitting = false;
        barkStart = now;
      }

      if (now - barkStart < BARK_TIME) {
        pose = BARK; // stand still and bark
      } else if (dist > STOP_DIST + 1 && !sitting) {
        // Run toward a point STOP_DIST away from the cursor, so it doesn't sit on it.
        const step = (dist - STOP_DIST) * EASE;
        dog.x += (dx / dist) * step;
        dog.y += (dy / dist) * step;
        if (Math.abs(dx) > 5) facing = dx > 0 ? 1 : -1;
        lastMoved = now;
        // Swap between the two running frames every 120 ms, hopping on the second.
        const step2 = Math.floor(now / 120) % 2 === 1;
        pose = step2 ? RUN_2 : RUN_1;
        bob = step2 ? PIXEL : 0;
      } else if (sitting || now - lastMoved > SIT_DELAY) {
        sitting = true;
        pose = SIT;
      }

      // Clear the screen.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, innerWidth, innerHeight);

      drawPuppy(pose, dog.x, dog.y - bob);

      // "멍!" speech bubble, fading out a little after the bark.
      const barkAge = now - barkStart;
      if (barkAge < BARK_TIME + 500) {
        const alpha = Math.min(1, (BARK_TIME + 500 - barkAge) / 500);
        drawBark(dog.x + facing * 28, dog.y - pose.length * PIXEL - 16, alpha);
      }

      frame = requestAnimationFrame(draw);
    }

    // Draw a sprite one square at a time, feet centred on x / y.
    // When facing left, read each row from the right to mirror it.
    function drawPuppy(sprite: string[], x: number, y: number) {
      const w = sprite[0].length;
      const left = Math.round(x - (w * PIXEL) / 2);
      const top = Math.round(y - sprite.length * PIXEL);
      ctx.fillStyle = "white";
      sprite.forEach((row, r) => {
        for (let c = 0; c < w; c++) {
          const pixel = facing === 1 ? row[c] : row[w - 1 - c];
          if (pixel === "#") ctx.fillRect(left + c * PIXEL, top + r * PIXEL, PIXEL, PIXEL);
        }
      });
    }

    // A small white box with "멍!".
    function drawBark(x: number, y: number, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "white";
      ctx.fillRect(Math.round(x - 20), Math.round(y - 11), 40, 22);
      ctx.fillStyle = "black";
      ctx.font = "bold 12px sans-serif";
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

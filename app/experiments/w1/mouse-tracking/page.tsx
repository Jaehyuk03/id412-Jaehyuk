"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

// Tracks the mouse. A white puppy silhouette runs after the cursor. When the
// mouse stops, the puppy sits; when the mouse moves again, it barks and runs.
const EASE = 0.08; // how fast the puppy catches up (0 to 1)
const STOP_DIST = 60; // px, the puppy stops this far from the cursor
const WAKE_DIST = 40; // px, how far the mouse must move away before a sitting puppy gets up
const SIT_DELAY = 600; // ms standing still before the puppy sits
const BARK_TIME = 450; // ms the puppy stands and barks before running
const DOG_W = 110; // px, size the puppy is drawn at
const DOG_H = 92;

type Point = { x: number; y: number };

// The puppy illustrations, in public/experiments/w1/mouse-tracking/.
function loadImage(name: string) {
  const img = new Image();
  img.src = `/experiments/w1/mouse-tracking/${name}.svg`;
  return img;
}

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
    const images = {
      run1: loadImage("run-1"),
      run2: loadImage("run-2"),
      sit: loadImage("sit"),
      bark: loadImage("bark"),
    };

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
      let pose = images.run1;
      let bob = 0; // px, little hop while running

      if (sitting && dist > STOP_DIST + WAKE_DIST) {
        // The mouse moved away from a sitting puppy: get up and bark.
        sitting = false;
        barkStart = now;
      }

      if (now - barkStart < BARK_TIME) {
        pose = images.bark; // stand still and bark
      } else if (dist > STOP_DIST + 1 && !sitting) {
        // Run toward a point STOP_DIST away from the cursor, so it doesn't sit on it.
        const step = (dist - STOP_DIST) * EASE;
        dog.x += (dx / dist) * step;
        dog.y += (dy / dist) * step;
        if (Math.abs(dx) > 5) facing = dx > 0 ? 1 : -1;
        lastMoved = now;
        // Swap between the two running pictures every 120 ms.
        pose = Math.floor(now / 120) % 2 === 0 ? images.run1 : images.run2;
        bob = Math.abs(Math.sin(now / 60)) * 4;
      } else if (sitting || now - lastMoved > SIT_DELAY) {
        sitting = true;
        pose = images.sit;
      }

      // Clear the screen.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, innerWidth, innerHeight);

      // Draw the puppy, feet at dog.x / dog.y. Flip it to look left.
      if (pose.complete) {
        ctx.save();
        ctx.translate(dog.x, dog.y - bob);
        ctx.scale(facing, 1);
        ctx.drawImage(pose, -DOG_W / 2, -DOG_H, DOG_W, DOG_H);
        ctx.restore();
      }

      // "멍!" speech bubble, fading out a little after the bark.
      const barkAge = now - barkStart;
      if (barkAge < BARK_TIME + 500) {
        const alpha = Math.min(1, (BARK_TIME + 500 - barkAge) / 500);
        drawBark(dog.x + facing * 50, dog.y - DOG_H - 25, alpha);
      }

      frame = requestAnimationFrame(draw);
    }

    // A white bubble with "멍!".
    function drawBark(x: number, y: number, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.roundRect(x - 34, y - 20, 68, 40, 16);
      ctx.fill();
      ctx.fillStyle = "black";
      ctx.font = "bold 20px sans-serif";
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

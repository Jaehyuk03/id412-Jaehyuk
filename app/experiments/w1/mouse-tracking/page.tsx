"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

// Tracks the mouse. A crosshair follows the cursor, a trail shows where it has
// been, and a dot eases after it. The x / y position and speed are printed.
const TRAIL = 60; // how many past positions are kept for the trail
const EASE = 0.12; // how fast the follower dot catches up (0 to 1)
const DOT = 10; // px, radius of the follower dot
const COLOR = "57, 255, 20"; // neon green, as r, g, b

type Point = { x: number; y: number };

export default function MouseTracking() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = 1;
    let mouse: Point = { x: innerWidth / 2, y: innerHeight / 2 }; // where the mouse is now
    const follower: Point = { ...mouse }; // the dot that eases after the mouse
    const trail: Point[] = []; // past mouse positions, newest last
    let speed = 0; // px per frame, smoothed

    function resize() {
      dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
    }

    function onMouseMove(event: MouseEvent) {
      mouse = { x: event.clientX, y: event.clientY };
    }

    let frame = 0;

    function draw() {
      // Remember this frame's position, drop the oldest when the trail is full.
      const prev = trail[trail.length - 1] ?? mouse;
      trail.push({ ...mouse });
      if (trail.length > TRAIL) trail.shift();

      // Speed = distance moved since last frame, smoothed so the number is readable.
      const moved = Math.hypot(mouse.x - prev.x, mouse.y - prev.y);
      speed += (moved - speed) * 0.1;

      // The follower moves a fraction of the way to the mouse every frame.
      follower.x += (mouse.x - follower.x) * EASE;
      follower.y += (mouse.y - follower.y) * EASE;

      // Clear the screen.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, innerWidth, innerHeight);

      // Crosshair: one line across, one line down, through the mouse.
      ctx.strokeStyle = `rgba(${COLOR}, 0.25)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mouse.y);
      ctx.lineTo(innerWidth, mouse.y);
      ctx.moveTo(mouse.x, 0);
      ctx.lineTo(mouse.x, innerHeight);
      ctx.stroke();

      // Trail: older segments are thinner and more transparent.
      for (let i = 1; i < trail.length; i++) {
        const age = i / trail.length; // 0 = oldest, 1 = newest
        ctx.strokeStyle = `rgba(${COLOR}, ${age})`;
        ctx.lineWidth = 1 + age * 4;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }

      // Follower dot with a neon glow.
      ctx.fillStyle = `rgb(${COLOR})`;
      ctx.shadowColor = `rgb(${COLOR})`;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(follower.x, follower.y, DOT, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Position and speed, next to the cursor.
      ctx.font = "14px ui-monospace, Menlo, monospace";
      ctx.fillStyle = `rgb(${COLOR})`;
      ctx.fillText(`x ${Math.round(mouse.x)}  y ${Math.round(mouse.y)}`, mouse.x + 14, mouse.y - 14);
      ctx.fillText(`speed ${speed.toFixed(1)}`, mouse.x + 14, mouse.y + 4);

      frame = requestAnimationFrame(draw);
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

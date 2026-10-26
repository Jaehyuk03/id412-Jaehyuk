"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

// A number that counts from 0 to 100, one step every 100 ms, then starts over.
const MAX_COUNT = 100;
const INTERVAL = 100; // ms

export default function TimeInterval() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((previous) => (previous >= MAX_COUNT ? 0 : previous + 1));
    }, INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <main className={styles.container}>
      <div className={styles.counter}>{count}</div>
    </main>
  );
}

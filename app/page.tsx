"use client";

import { useEffect, useState } from "react";

const KEY = "notion_stopwatch_time";
const RUNNING_KEY = "notion_stopwatch_running";

export default function Page() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    const isRunning = localStorage.getItem(RUNNING_KEY) === "true";
    if (saved) setSeconds(Number(saved));
    if (isRunning) setRunning(true);
  }, []);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        localStorage.setItem(KEY, String(next));
        return next;
      });
    }, 1000);

    localStorage.setItem(RUNNING_KEY, "true");
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) {
      localStorage.setItem(RUNNING_KEY, "false");
      localStorage.setItem(KEY, String(seconds));
    }
  }, [running, seconds]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const onClear = () => {
    setSeconds(0);
    setRunning(false);
    localStorage.setItem(KEY, "0");
    localStorage.setItem(RUNNING_KEY, "false");
  };

  return (
    <div className="card">
      <div className="topbar">
        <button className="clearBtn" onClick={onClear}>
          CLEAR
        </button>
      </div>

      <div className="body">
        <div className="time">
          {minutes}
          <span className="colon">:</span>
          {secs}
        </div>

        <div className="buttons">
          <button className="btn" onClick={() => setRunning(true)} disabled={running}>
            START
          </button>
          <button className="btn" onClick={() => setRunning(false)} disabled={!running}>
            STOP
          </button>
        </div>
      </div>
    </div>
  );
}

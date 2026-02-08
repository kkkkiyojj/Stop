"use client";

import { useEffect, useState } from "react";

const KEY = "notion_stopwatch_time";
const RUNNING_KEY = "notion_stopwatch_running";

export default function Page() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  // 초기 로드
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    const isRunning = localStorage.getItem(RUNNING_KEY) === "true";

    if (saved) setSeconds(Number(saved));
    if (isRunning) setRunning(true);
  }, []);

  // 타이머
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

  // 스탑 시 상태 저장
  useEffect(() => {
    if (!running) {
      localStorage.setItem(RUNNING_KEY, "false");
      localStorage.setItem(KEY, String(seconds));
    }
  }, [running, seconds]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="outer">
      <div className="widget">
        <button className="clear" onClick={() => {
          setSeconds(0);
          setRunning(false);
          localStorage.setItem(KEY, "0");
          localStorage.setItem(RUNNING_KEY, "false");
        }}>
          CLEAR
        </button>

        <div className="time">
          {minutes} : {secs}
        </div>

        <div className="buttons">
          <button onClick={() => setRunning(true)}>START</button>
          <button onClick={() => setRunning(false)}>STOP</button>
        </div>
      </div>
    </div>
  );
}

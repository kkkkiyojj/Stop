"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StoredState = {
  elapsedMs: number;     // 누적 경과 시간
  isRunning: boolean;    // 동작 중인지
  lastStartTs: number | null; // 마지막으로 start 누른 시각(Date.now)
};

const STORAGE_KEY = "notion_stopwatch_v1";

function safeParse(json: string | null): StoredState | null {
  if (!json) return null;
  try {
    const obj = JSON.parse(json);
    if (
      typeof obj?.elapsedMs === "number" &&
      typeof obj?.isRunning === "boolean" &&
      (typeof obj?.lastStartTs === "number" || obj?.lastStartTs === null)
    ) {
      return obj as StoredState;
    }
  } catch {}
  return null;
}

function formatMinSec(totalMs: number) {
  const totalSec = Math.floor(totalMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;

  // 예시가 1:20 형태라서 초는 2자리로 맞춤
  const ss = String(s).padStart(2, "0");
  return `${m}:${ss}`;
}

export default function Page() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const lastStartTsRef = useRef<number | null>(null);

  // 저장: 매 tick마다 너무 자주 저장하지 않도록 마지막 저장 시각 관리
  const lastPersistRef = useRef<number>(0);

  const persist = (next: StoredState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const computeNowElapsed = () => {
    const base = elapsedMs;
    if (!isRunning || lastStartTsRef.current == null) return base;
    return base + (Date.now() - lastStartTsRef.current);
  };

  // 최초 로드: 저장된 상태 복원 + 실행 중이면 “닫았다 열어도” 이어가기
  useEffect(() => {
    const stored = safeParse(localStorage.getItem(STORAGE_KEY));
    if (!stored) return;

    if (stored.isRunning && stored.lastStartTs != null) {
      // 실행 중이던 상태면, 지난 시간만큼 누적해 반영하고 계속 running 유지
      const extra = Date.now() - stored.lastStartTs;
      setElapsedMs(Math.max(0, stored.elapsedMs + extra));
      setIsRunning(true);
      lastStartTsRef.current = Date.now(); // 여기부터 다시 카운트 이어가기
      persist({ elapsedMs: Math.max(0, stored.elapsedMs + extra), isRunning: true, lastStartTs: Date.now() });
    } else {
      setElapsedMs(Math.max(0, stored.elapsedMs));
      setIsRunning(false);
      lastStartTsRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 타이머 tick
  useEffect(() => {
    if (!isRunning) return;

    const id = window.setInterval(() => {
      setElapsedMs((prev) => prev); // 렌더 유도용(표시는 아래 memo에서 now 계산)
      const now = Date.now();
      // 1초에 한 번 정도만 저장
      if (now - lastPersistRef.current > 900) {
        lastPersistRef.current = now;
        const currentElapsed = computeNowElapsed();
        persist({ elapsedMs: currentElapsed, isRunning: true, lastStartTs: lastStartTsRef.current });
        // elapsedMs state에 누적값 반영(드리프트 줄이기)
        setElapsedMs(currentElapsed);
        lastStartTsRef.current = now;
      }
    }, 250);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // 탭/노션 화면 전환 등으로 숨겨질 때도 안전하게 저장
  useEffect(() => {
    const onVis = () => {
      try {
        const currentElapsed = computeNowElapsed();
        if (isRunning) {
          persist({ elapsedMs: currentElapsed, isRunning: true, lastStartTs: Date.now() });
          setElapsedMs(currentElapsed);
          lastStartTsRef.current = Date.now();
        } else {
          persist({ elapsedMs: elapsedMs, isRunning: false, lastStartTs: null });
        }
      } catch {}
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedMs, isRunning]);

  const display = useMemo(() => {
    const nowElapsed = isRunning && lastStartTsRef.current != null
      ? elapsedMs + (Date.now() - lastStartTsRef.current)
      : elapsedMs;
    return formatMinSec(nowElapsed);
  }, [elapsedMs, isRunning]);

  const onStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    lastStartTsRef.current = Date.now();
    persist({ elapsedMs, isRunning: true, lastStartTs: lastStartTsRef.current });
  };

  const onStop = () => {
    if (!isRunning) return;
    const now = Date.now();
    const extra = lastStartTsRef.current ? (now - lastStartTsRef.current) : 0;
    const nextElapsed = elapsedMs + extra;

    setElapsedMs(nextElapsed);
    setIsRunning(false);
    lastStartTsRef.current = null;

    persist({ elapsedMs: nextElapsed, isRunning: false, lastStartTs: null });
  };

  const onClear = () => {
    setElapsedMs(0);
    setIsRunning(false);
    lastStartTsRef.current = null;
    persist({ elapsedMs: 0, isRunning: false, lastStartTs: null });
  };

  return (
    <main className="widget">
      <div className="time">{display}</div>
      <div className="sub">분:초 스톱워치 (노션 embed용)</div>

      <div className="badge">
        <span className={`dot ${isRunning ? "running" : ""}`} />
        <span>{isRunning ? "RUNNING" : "STOPPED"}</span>
      </div>

      <div className="row">
        <button onClick={onStart} disabled={isRunning}>Start</button>
        <button onClick={onStop} disabled={!isRunning}>Stop</button>
        <button onClick={onClear}>Clear</button>
      </div>
    </main>
  );
}

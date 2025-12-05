"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TimerDisplay from "@/components/countdown/timer-display";
import { useAppContext } from "@/contexts/app-context";
import SessionList from "@/components/countdown/session-list";
import TotalTimeDisplay from "@/components/countdown/completed-tasks";

export default function CountdownPage() {
  const {
    activeSessionId,
    // sessionTimeRemaining,
    timeRemaining,
    isRunning,
    pauseTimer,
    resumeTimer,
    // startCountdown,
    sessions,
    fetchHistory,
    completeSession,
    switchToSession,
    isBreakTime,
    breakDuration,
    completedSessionsCount,
    shortBreakMinutes,
    longBreakMinutes,
    setShortBreakMinutes,
    setLongBreakMinutes,
    skipBreak,
  } = useAppContext();

  const [isPausedLocal, setIsPausedLocal] = useState(!isRunning);

  const hasAutoResumedRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    setIsPausedLocal(!isRunning);
  }, [isRunning]);

  useEffect(() => {
    if (isBreakTime || !activeSessionId) {
      return;
    }

    if (hasAutoResumedRef.current.has(activeSessionId)) {
      return;
    }

    const activeSession = sessions.find((s) => s.id === activeSessionId);

    if (
      activeSession?.status === "running" &&
      !isRunning &&
      timeRemaining > 0
    ) {
      console.log("🛠️ Auto-Resume Triggered for session:", activeSessionId);

      hasAutoResumedRef.current.add(activeSessionId);

      const timeoutId = setTimeout(async () => {
        await resumeTimer();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    activeSessionId,
    isBreakTime,
    isRunning,
    timeRemaining,
    sessions,
    resumeTimer,
  ]);

  useEffect(() => {
    return () => {
      if (activeSessionId) {
        hasAutoResumedRef.current.delete(activeSessionId);
      }
    };
  }, [activeSessionId]);

  const handleStartPause = useCallback(async () => {
    console.log("🎯 handleStartPause clicked, isRunning:", isRunning);

    if (isRunning) {
      await pauseTimer();
      setIsPausedLocal(true);
    } else {
      if (timeRemaining > 0) {
        await resumeTimer();
        setIsPausedLocal(false);
      } else {
        console.warn("⚠️ No time remaining to resume");
      }
    }
  }, [isRunning, pauseTimer, resumeTimer, timeRemaining]);

  const handleSwitchSession = useCallback(
    async (sessionId: string) => {
      console.log("🔄 handleSwitchSession: Switching to session:", sessionId);

      if (isBreakTime) {
        console.log("  - Currently in break, will stop break and switch");
      }

      const targetSession = sessions.find((s) => s.id === sessionId);
      if (!targetSession) {
        console.warn("⚠️ Target session not found:", sessionId);
        return;
      }

      const shouldAutoStart = targetSession.status === "running";

      console.log("  - Target session:", targetSession.taskName);
      console.log("  - Target status:", targetSession.status);
      console.log("  - Will auto-start:", shouldAutoStart);

      if (activeSessionId) {
        hasAutoResumedRef.current.delete(activeSessionId);
      }

      await switchToSession(sessionId, shouldAutoStart);

      if (shouldAutoStart) {
        setIsPausedLocal(false);
        hasAutoResumedRef.current.add(sessionId);
      } else {
        setIsPausedLocal(true);
      }

      console.log("  - ✅ Switch completed");
    },
    [sessions, switchToSession, activeSessionId, isBreakTime]
  );

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const pendingSessions = sessions.filter((s) => s.status !== "completed");
  const completedSessions = sessions.filter((s) => s.status === "completed");

  return (
    <div className="flex w-full h-full p-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-4">
        <div className="flex flex-col items-center">
          <div className="max-w-md w-full">
            <TimerDisplay
              session={activeSession}
              timeRemaining={timeRemaining}
              isRunning={isRunning}
              isBreak={isBreakTime}
              breakTime={breakDuration}
              onStartPause={handleStartPause}
              onComplete={() =>
                activeSessionId && completeSession(activeSessionId)
              }
              shortBreakMinutes={shortBreakMinutes}
              longBreakMinutes={longBreakMinutes}
              onSetShortBreak={setShortBreakMinutes}
              onSetLongBreak={setLongBreakMinutes}
              onSkipBreak={skipBreak}
              completedSessionsCount={completedSessionsCount}
            />
          </div>

          <h2 className="text-xl font-bold mt-8 mb-4 text-slate-800 dark:text-white">
            Danh sách phiên học
          </h2>

          <div className="w-full max-w-xl">
            <SessionList
              sessions={pendingSessions}
              activeSessionId={activeSessionId}
              onSwitchSession={handleSwitchSession}
            />
          </div>
        </div>
      </div>

      <div className="w-80 border-l pl-4 border-slate-200 dark:border-slate-800 overflow-y-auto">
        <TotalTimeDisplay sessions={completedSessions} />
      </div>
    </div>
  );
}

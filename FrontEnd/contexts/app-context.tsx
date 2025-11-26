// app-context.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Task, Session } from "@/types/index";
import {
  pomodoroStart,
  pomodoroStop,
  pomodoroHistory,
  pomodoroPause,
  pomodoroResume,
} from "@/services/apiServices";

/**
 * AppContext (FULL) - Dual timers (session + break) + Tasks + History
 *
 * Assumptions based on your choices:
 * - Session object shape matches your interface (duration in minutes, timeRemaining in seconds optional)
 * - When starting a session we create it on backend via pomodoroStart (so backend returns id)
 * - Breaks are local-only (not persisted)
 * - Long break after every 3 completed sessions (newCount % 3 === 0)
 * - Auto flow: session end -> auto start break; break end -> auto start next pending session (if any)
 */

interface AppContextType {
  // TASKS
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  addTask: (t: Task) => void;
  updateTask: (t: Task) => void;
  removeTask: (id: string) => void;
  startTask: (t: Task) => Promise<void>;

  // SESSIONS + HISTORY
  sessions: Session[];
  setSessions: (s: Session[]) => void;
  fetchHistory: () => Promise<void>;
  startSession: (s: Partial<Session>) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;

  // ACTIVE / TIMERS
  activeSessionId: string | null;

  // Dual timers
  sessionTimeRemaining: number; // seconds (session)
  breakTimeRemaining: number; // seconds (break)
  // legacy convenience alias used by some UI: (if you used timeRemaining previously)
  timeRemaining: number;

  // run state
  isRunning: boolean; // indicates if any timer (session OR break) currently running
  // pause/resume operate with knowledge of break vs session
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  startCountdown: () => void;

  // session switching + cleanup
  getTotalTime: () => number;
  cleanupActiveSession: () => Promise<void>;
  switchToSession: (sessionId: string, autoStart?: boolean) => Promise<void>;

  // BREAK CONTROL
  isBreakTime: boolean;
  breakDuration: number; // minutes (current configured break duration)
  completedSessionsCount: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  setShortBreakMinutes: (m: number) => void;
  setLongBreakMinutes: (m: number) => void;
  skipBreak: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ==================== TASKS ====================
  const [tasks, setTasks] = useState<Task[]>([]);
  const addTask = useCallback(
    (task: Task) => setTasks((p) => [...p, task]),
    []
  );
  const updateTask = useCallback(
    (updated: Task) =>
      setTasks((p) => p.map((t) => (t._id === updated._id ? updated : t))),
    []
  );
  const removeTask = useCallback(
    (id: string) => setTasks((p) => p.filter((t) => t._id !== id)),
    []
  );

  // Helper: start a task -> create session and start it
  const startTask = useCallback(
    async (task: Task) => {
      // build sessionFromUI (we create session on backend)
      const sessionFromUI: Partial<Session> = {
        taskName: task.title,
        duration: task.duration ?? 25,
      };
      // remove the task from task list (your previous behavior)
      removeTask(task._id);
      await startSession(sessionFromUI);
    },
    [removeTask]
  );

  // ==================== SESSIONS & TIMERS ====================
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Dual timers in seconds
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(0);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState<number>(0);

  // Running state: indicates timer running (either session or break)
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Refs for intervals (separate)
  const sessionIntervalRef = useRef<number | null>(null);
  const breakIntervalRef = useRef<number | null>(null);

  // Defaults
  const DEFAULT_POMODORO_MIN = 25;

  // BREAK state and config
  const [isBreakTime, setIsBreakTime] = useState<boolean>(false);
  const [breakDuration, setBreakDuration] = useState<number>(5); // minutes (current active break minutes)
  const [completedSessionsCount, setCompletedSessionsCount] =
    useState<number>(0);
  const [shortBreakMinutes, setShortBreakMinutes] = useState<number>(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState<number>(15);

  // Convenience alias for legacy UI
  const timeRemaining = isBreakTime ? breakTimeRemaining : sessionTimeRemaining;

  // ------------------- Clear helpers -------------------
  const clearSessionInterval = useCallback(() => {
    if (sessionIntervalRef.current) {
      window.clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
  }, []);
  const clearBreakInterval = useCallback(() => {
    if (breakIntervalRef.current) {
      window.clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }
  }, []);

  // ------------------- Start session timer (local) -------------------
  const startSessionTimer = useCallback(
    (sessionId: string) => {
      // safety
      clearSessionInterval();
      // ensure we're not in break mode
      setIsBreakTime(false);
      setIsRunning(true);

      sessionIntervalRef.current = window.setInterval(() => {
        setSessionTimeRemaining((prev) => {
          // when session ends
          if (prev <= 1) {
            clearSessionInterval();
            setIsRunning(false);
            // mark session completed locally & call completion flow
            // Use completeSession to ensure backend is marked
            // But call with try/catch to avoid unhandled rejection
            (async () => {
              try {
                await completeSession(sessionId);
              } catch (err) {
                console.error("completeSession on timer end failed", err);
              }
            })();

            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // store interval id in ref (already done)
    },
    [clearSessionInterval]
  );

  // ------------------- Start break timer (local) -------------------
  const startBreakTimer = useCallback(() => {
    clearBreakInterval();
    setIsBreakTime(true);
    setIsRunning(true);

    breakIntervalRef.current = window.setInterval(() => {
      setBreakTimeRemaining((prev) => {
        if (prev <= 1) {
          clearBreakInterval();
          setIsRunning(false);
          setIsBreakTime(false);
          // After break ends -> auto start next session if exists
          setTimeout(() => {
            startNextSession();
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearBreakInterval]);

  // ------------------- Start next pending session -------------------
  const startNextSession = useCallback(() => {
    setSessions((currentSessions) => {
      const pending = currentSessions.filter((s) => s.status !== "completed");
      if (pending.length === 0) {
        // nothing to start
        setIsBreakTime(false);
        return currentSessions;
      }
      const next = pending[0];
      // set active session & set session time remaining
      setIsBreakTime(false);
      setActiveSessionId(next.id);
      setSessionTimeRemaining(next.timeRemaining ?? next.duration * 60);
      setIsRunning(false); // will auto-start after backend resume
      // auto-start it via backend resume + startSessionTimer
      setTimeout(async () => {
        try {
          await pomodoroResume(next.id);
          // ensure no leftover interval
          clearSessionInterval();
          startSessionTimer(next.id);
        } catch (err) {
          console.error("Failed to auto-resume next session", err);
        }
      }, 300);
      return currentSessions;
    });
  }, [clearSessionInterval, startSessionTimer]);

  // ------------------- PUBLIC: startBreak -------------------
  // isLong param chooses long/short break
  const startBreak = useCallback(
    (isLong: boolean) => {
      const minutes = isLong ? longBreakMinutes : shortBreakMinutes;
      setBreakDuration(minutes);
      setBreakTimeRemaining(minutes * 60);
      // auto-start break timer
      setTimeout(() => {
        startBreakTimer();
      }, 200);
    },
    [longBreakMinutes, shortBreakMinutes, startBreakTimer]
  );

  // ------------------- COMPLETE SESSION (manual or auto) -------------------
  const completeSession = useCallback(
    async (sessionId: string) => {
      try {
        // If this was active session locally, stop its timer
        if (activeSessionId === sessionId) {
          clearSessionInterval();
          setIsRunning(false);
          setActiveSessionId(null);
          setSessionTimeRemaining(0);
        }

        // Call backend to stop/complete the session
        // (pomodoroStop should return the completed session data)
        const completed = await pomodoroStop(sessionId);

        // map completedAt and duration/timeRemaining safely
        setSessions((prev) =>
          prev.map((s) =>
            s.id !== sessionId
              ? s
              : {
                  ...s,
                  status: "completed",
                  duration: completed.duration ?? s.duration,
                  completedAt: completed.completedAt
                    ? new Date(completed.completedAt)
                    : new Date(),
                  timeRemaining: 0,
                }
          )
        );

        // increment completed sessions count and trigger break
        setCompletedSessionsCount((count) => {
          const newCount = count + 1;
          const isLong = newCount % 3 === 0; // your chosen rule
          // schedule break
          setTimeout(() => startBreak(isLong), 500);
          return newCount;
        });
      } catch (err) {
        console.error("completeSession error:", err);
        throw err;
      }
    },
    [activeSessionId, clearSessionInterval, startBreak]
  );

  // ------------------- START SESSION (create on backend) -------------------
  const startSession = useCallback(async (sessionFromUI: Partial<Session>) => {
    try {
      const duration = sessionFromUI.duration ?? DEFAULT_POMODORO_MIN;
      // create session on backend
      const created = await pomodoroStart(
        sessionFromUI.taskName ?? "Task",
        duration
      );

      // Normalize fields (ensure startedAt is Date)
      const normalized: Session = {
        id: created.id,
        taskName: created.taskName ?? sessionFromUI.taskName ?? "Task",
        duration: created.duration ?? duration,
        status: created.status ?? "running",
        startedAt: created.startedAt ? new Date(created.startedAt) : new Date(),
        completedAt: created.completedAt
          ? new Date(created.completedAt)
          : undefined,
        timeRemaining: (created.timeRemaining ??
          created.duration * 60) as number,
      };

      setSessions((prev) => [...prev, normalized]);
      setActiveSessionId(normalized.id);
      setSessionTimeRemaining(
        (normalized.timeRemaining ?? normalized.duration * 60) as number
      );
      setIsBreakTime(false);
      setIsRunning(false);

      // Do not auto-immediately start countdown here; caller can call startCountdown or resumeTimer.
    } catch (err) {
      console.error("startSession error:", err);
      throw err;
    }
  }, []);

  // ------------------- PAUSE (session or break) -------------------
  const pauseTimer = useCallback(async () => {
    // If break -> just pause local break timer
    if (isBreakTime) {
      clearBreakInterval();
      setIsRunning(false);
      return;
    }

    // if session -> stop interval and call backend pause
    clearSessionInterval();
    setIsRunning(false);

    if (activeSessionId) {
      try {
        await pomodoroPause(activeSessionId);
        // update session timeRemaining on local state
        setSessions((prev) =>
          prev.map((s) =>
            s.id !== activeSessionId
              ? s
              : { ...s, timeRemaining: sessionTimeRemaining }
          )
        );
      } catch (err) {
        console.error("pomodoroPause failed:", err);
      }
    }
  }, [
    activeSessionId,
    isBreakTime,
    sessionTimeRemaining,
    clearSessionInterval,
  ]);

  // ------------------- RESUME (session OR break) -------------------
  const resumeTimer = useCallback(async () => {
    // If break -> resume local break timer (don't call backend)
    if (isBreakTime) {
      // if breakTimeRemaining > 0 start break interval
      if (breakTimeRemaining > 0 && !breakIntervalRef.current) {
        startBreakTimer();
      }
      return;
    }

    // Session resume: call backend resume + start local session timer
    if (!activeSessionId) {
      console.warn("resumeTimer called but no activeSessionId");
      return;
    }

    try {
      await pomodoroResume(activeSessionId);
    } catch (err) {
      console.error("pomodoroResume failed:", err);
    }

    // ensure fresh local timers
    clearSessionInterval();
    startSessionTimer(activeSessionId);
  }, [
    isBreakTime,
    breakTimeRemaining,
    startBreakTimer,
    activeSessionId,
    clearSessionInterval,
    startSessionTimer,
  ]);

  // ------------------- startCountdown (convenience) -------------------
  const startCountdown = useCallback(() => {
    if (isBreakTime) {
      if (breakTimeRemaining > 0) startBreakTimer();
      return;
    }
    if (activeSessionId && sessionTimeRemaining > 0) {
      // Note: assumes backend resume already handled by caller. We'll start local timer.
      clearSessionInterval();
      startSessionTimer(activeSessionId);
    }
  }, [
    isBreakTime,
    breakTimeRemaining,
    activeSessionId,
    sessionTimeRemaining,
    startBreakTimer,
    clearSessionInterval,
    startSessionTimer,
  ]);

  // ------------------- switchToSession -------------------
  // Switch context to another session (optionally autoStart)
  const switchToSession = useCallback(
    async (sessionId: string, autoStart: boolean = false) => {
      try {
        // if currently running a different session -> pause it
        if (
          activeSessionId &&
          activeSessionId !== sessionId &&
          isRunning &&
          !isBreakTime
        ) {
          await pauseTimer();
        }

        const target = sessions.find((s) => s.id === sessionId);
        if (!target) {
          console.warn("switchToSession: session not found", sessionId);
          return;
        }

        const newTimeRemaining = target.timeRemaining ?? target.duration * 60;
        // switch active
        setActiveSessionId(sessionId);
        setSessionTimeRemaining(newTimeRemaining);
        setIsBreakTime(false);
        setIsRunning(false);

        if (autoStart) {
          // resume on backend then start local timer
          try {
            await pomodoroResume(sessionId);
            clearSessionInterval();
            startSessionTimer(sessionId);
          } catch (err) {
            console.error("switchToSession autoStart error:", err);
          }
        }
      } catch (err) {
        console.error("switchToSession error:", err);
      }
    },
    [
      activeSessionId,
      isRunning,
      isBreakTime,
      sessions,
      pauseTimer,
      clearSessionInterval,
      startSessionTimer,
    ]
  );

  // ------------------- fetchHistory -------------------
  const fetchHistory = useCallback(async () => {
    try {
      const mapped = await pomodoroHistory();
      // Normalize incoming sessions: ensure startedAt/completedAt are Date and timeRemaining in seconds
      const normalized: Session[] = (mapped || []).map((s: any) => ({
        id: s.id,
        taskName: s.taskName,
        duration: s.duration,
        status: s.status,
        startedAt: s.startedAt ? new Date(s.startedAt) : new Date(),
        completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
        timeRemaining:
          s.timeRemaining !== undefined ? s.timeRemaining : s.duration * 60,
      }));

      setSessions(normalized);

      // restore running session if any
      const running = normalized.find(
        (s) => s.status === "running" && (s.timeRemaining ?? 0) > 0
      );
      if (running) {
        setActiveSessionId(running.id);
        setSessionTimeRemaining(running.timeRemaining ?? running.duration * 60);
        setIsRunning(false); // don't automatically start until user resumes
      }
    } catch (err) {
      console.error("fetchHistory error:", err);
    }
  }, []);

  // ------------------- cleanupActiveSession -------------------
  const cleanupActiveSession = useCallback(async () => {
    // Called on unmount or when needed: ensure backend pause if session running
    if (activeSessionId && isRunning && !isBreakTime) {
      try {
        clearSessionInterval();
        setIsRunning(false);
        // call pause API to persist remaining time
        await pomodoroPause(activeSessionId);
      } catch (err) {
        console.warn("cleanupActiveSession warning:", err);
      }
    } else {
      // if break running, just clear
      if (isBreakTime) {
        clearBreakInterval();
        setIsRunning(false);
      }
    }
  }, [activeSessionId, isRunning, isBreakTime]);

  // ------------------- skipBreak -------------------
  const skipBreak = useCallback(() => {
    // cancel break and go to next session
    clearBreakInterval();
    setIsBreakTime(false);
    setIsRunning(false);
    setBreakTimeRemaining(0);
    // start next pending session
    setTimeout(() => startNextSession(), 200);
  }, [startNextSession]);

  // ------------------- getTotalTime -------------------
  const getTotalTime = useCallback(
    () =>
      sessions
        .filter((s) => s.status === "completed")
        .reduce((acc, s) => acc + (s.duration ?? 0), 0),
    [sessions]
  );

  // ------------------- effects: beforeunload and unmount cleanup -------------------
  useEffect(() => {
    // when user closes tab, try to pause active session if running
    const handleBeforeUnload = () => {
      if (activeSessionId && isRunning && !isBreakTime) {
        const token = localStorage.getItem("token");
        if (!token) return;
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        // fire-and-forget pause
        navigator.sendBeacon?.(
          `${apiUrl}/api/pomodoro/pause`,
          JSON.stringify({ sessionId: activeSessionId })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeSessionId, isRunning, isBreakTime]);

  useEffect(() => {
    // cleanup intervals on unmount
    return () => {
      clearSessionInterval();
      clearBreakInterval();
      // best-effort persist active session
      (async () => {
        if (activeSessionId && isRunning && !isBreakTime) {
          try {
            await pomodoroPause(activeSessionId);
          } catch (err) {
            // ignore
          }
        }
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty deps for unmount only

  // ------------------- Expose context -------------------
  const value: AppContextType = {
    // tasks
    tasks,
    setTasks,
    addTask,
    updateTask,
    removeTask,
    startTask,

    // sessions
    sessions,
    setSessions,
    fetchHistory,
    startSession,
    completeSession,

    // active/timers
    activeSessionId,
    sessionTimeRemaining,
    breakTimeRemaining,
    timeRemaining, // convenience alias

    isRunning,
    pauseTimer,
    resumeTimer,
    startCountdown,

    getTotalTime,
    cleanupActiveSession,
    switchToSession,

    // break
    isBreakTime,
    breakDuration,
    completedSessionsCount,
    shortBreakMinutes,
    longBreakMinutes,
    setShortBreakMinutes,
    setLongBreakMinutes,
    skipBreak,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};

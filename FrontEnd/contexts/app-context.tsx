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
  logStudySession,
} from "@/services/apiServices";
import { useSoundContext } from "@/contexts/sound-context";

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
  sessionTimeRemaining: number;
  breakTimeRemaining: number;
  timeRemaining: number;

  // run state
  isRunning: boolean;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  startCountdown: () => void;

  // session switching + cleanup
  getTotalTime: () => number;
  cleanupActiveSession: () => Promise<void>;
  switchToSession: (sessionId: string, autoStart?: boolean) => Promise<void>;

  // BREAK CONTROL
  isBreakTime: boolean;
  breakDuration: number;
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
  //Sound
  const { playCompletionSound } = useSoundContext();

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

  const startTask = useCallback(
    async (task: Task) => {
      const sessionFromUI: Partial<Session> = {
        taskName: task.title,
        duration: task.duration ?? 25,
      };
      removeTask(task._id);
      await startSession(sessionFromUI);
    },
    [removeTask]
  );

  // ==================== SESSIONS & TIMERS ====================
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(0);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState<number>(0);

  const [isRunning, setIsRunning] = useState<boolean>(false);

  const sessionIntervalRef = useRef<number | null>(null);
  const breakIntervalRef = useRef<number | null>(null);

  const DEFAULT_POMODORO_MIN = 25;

  const [isBreakTime, setIsBreakTime] = useState<boolean>(false);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [completedSessionsCount, setCompletedSessionsCount] =
    useState<number>(0);
  const [shortBreakMinutes, setShortBreakMinutes] = useState<number>(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState<number>(15);

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

  // ✅ FIX: SỬ DỤNG 'let' CHO TẤT CẢ CÁC FORWARD DECLARATION VÀ AS UNKNOWN AS TYPE
  let startNextSession = useCallback(() => {}, []) as unknown as () => void;
  let startBreakTimer = useCallback(() => {}, []) as unknown as () => void;
  let completeSession = useCallback(() => {}, []) as unknown as (
    sessionId: string
  ) => Promise<void>;
  let startSessionTimer = useCallback(() => {}, []) as unknown as (
    sessionId: string
  ) => void;
  let startBreak = useCallback(() => {}, []) as unknown as () => void;
  let resumeTimer = useCallback(() => {}, []) as unknown as () => Promise<void>;

  // ------------------- Start session timer (local) -------------------
  startSessionTimer = useCallback(
    (sessionId: string) => {
      clearSessionInterval();
      setIsBreakTime(false);
      setIsRunning(true);

      sessionIntervalRef.current = window.setInterval(() => {
        setSessionTimeRemaining((prev) => {
          if (prev <= 1) {
            clearSessionInterval();
            setIsRunning(false);
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
    },
    [clearSessionInterval, completeSession]
  );

  // ------------------- Start break timer (local) -------------------
  startBreakTimer = useCallback(() => {
    clearBreakInterval();
    setIsBreakTime(true);
    setIsRunning(true);

    breakIntervalRef.current = window.setInterval(() => {
      setBreakTimeRemaining((prev) => {
        if (prev <= 1) {
          clearBreakInterval();
          setIsRunning(false);
          setIsBreakTime(false);

          setTimeout(() => {
            startNextSession();
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearBreakInterval, startNextSession]);

  // ------------------- Start next pending session -------------------
  startNextSession = useCallback(() => {
    setSessions((currentSessions) => {
      const pending = currentSessions.filter((s) => s.status !== "completed");
      if (pending.length === 0) {
        setIsBreakTime(false);
        return currentSessions;
      }
      const next = pending[0];
      setIsBreakTime(false);
      setActiveSessionId(next.id);
      setSessionTimeRemaining(next.timeRemaining ?? next.duration * 60);
      setIsRunning(false);

      setTimeout(async () => {
        try {
          await pomodoroResume(next.id);
          clearSessionInterval();
          startSessionTimer(next.id);
        } catch (err) {
          console.error("Failed to auto-resume next session", err);
        }
      }, 300);
      return currentSessions;
    });
  }, [clearSessionInterval, startSessionTimer]);

  // ------------------- PUBLIC: startBreak (Không nhận đối số) -------------------
  startBreak = useCallback(() => {
    const isLong = (completedSessionsCount + 1) % 4 === 0;
    const minutes = isLong ? longBreakMinutes : shortBreakMinutes;

    setBreakDuration(minutes);
    setBreakTimeRemaining(minutes * 60);
    setIsBreakTime(true);
    clearSessionInterval();
    clearBreakInterval();
    setTimeout(() => {
      startBreakTimer();
    }, 500);
  }, [
    longBreakMinutes,
    shortBreakMinutes,
    startBreakTimer,
    completedSessionsCount,
    clearSessionInterval,
    clearBreakInterval,
  ]);

  // ------------------- COMPLETE SESSION -------------------
  completeSession = useCallback(
    async (sessionId: string) => {
      try {
        if (activeSessionId === sessionId) {
          clearSessionInterval();
          setIsRunning(false);
          setActiveSessionId(null);
          setSessionTimeRemaining(0);
        }

        const completed = await pomodoroStop(sessionId);

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
        await playCompletionSound();
        console.log("✅ Sound finished playing, now starting break...");

        setCompletedSessionsCount((count) => {
          const newCount = count + 1;

          setTimeout(() => startBreak(), 500);
          return newCount;
        });
      } catch (err) {
        console.error("completeSession error:", err);
        throw err;
      }
    },
    [activeSessionId, clearSessionInterval, startBreak, playCompletionSound]
  );

  // ------------------- START SESSION -------------------
  const startSession = useCallback(async (sessionFromUI: Partial<Session>) => {
    try {
      const duration = sessionFromUI.duration ?? DEFAULT_POMODORO_MIN;
      const created = await pomodoroStart(
        sessionFromUI.taskName ?? "Task",
        duration
      );

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
    } catch (err) {
      console.error("startSession error:", err);
      throw err;
    }
  }, []);

  // ------------------- PAUSE (THÊM LOG) -------------------
  const pauseTimer = useCallback(async () => {
    console.log("⏸️ pauseTimer: STARTING EXECUTION...");
    console.log(`  - isRunning: ${isRunning}, isBreakTime: ${isBreakTime}`);

    // 1. Dừng tất cả interval và trạng thái chạy
    clearSessionInterval();
    clearBreakInterval();
    setIsRunning(false);
    console.log("  - ACTION: Cleared both intervals and set isRunning=false.");

    // 2. Xử lý Break Time
    if (isBreakTime) {
      console.log("  - ACTION: Paused Break Timer (No API call needed).");
      return;
    }

    // 3. Xử lý Session Time (Chỉ khi có activeSessionId)
    if (activeSessionId) {
      // Cập nhật trạng thái Session cục bộ TRƯỚC KHI gọi API
      setSessions((prev) =>
        prev.map((s) =>
          s.id !== activeSessionId
            ? s
            : {
                ...s,
                status: "paused",
                timeRemaining: sessionTimeRemaining,
              }
        )
      );
      console.log(
        `  - UI Update: Session ${activeSessionId} status set to 'paused'. Time remaining saved: ${sessionTimeRemaining}s`
      );

      try {
        await pomodoroPause(activeSessionId);
        console.log("  - API SUCCESS: pomodoroPause successful.");
      } catch (err) {
        console.error("pomodoroPause failed, but local state paused:", err);
      }
    } else {
      console.log(
        "  - WARNING: activeSessionId is null. Nothing to save/pause."
      );
    }
  }, [
    activeSessionId,
    isRunning,
    isBreakTime,
    sessionTimeRemaining,
    clearSessionInterval,
    clearBreakInterval,
    setSessions,
  ]);

  // ------------------- RESUME (THÊM LOG) -------------------
  resumeTimer = useCallback(async () => {
    console.log("▶️ resumeTimer: STARTING EXECUTION...");
    console.log(
      `  - isBreakTime: ${isBreakTime}, activeSessionId: ${activeSessionId}`
    );

    if (isBreakTime) {
      if (breakTimeRemaining > 0 && breakIntervalRef.current === null) {
        startBreakTimer();
        console.log("  - ACTION: Resumed Break Timer.");
      }
      return;
    }

    if (!activeSessionId) {
      console.warn("resumeTimer called but no activeSessionId");
      return;
    }

    // Logic API và UI update
    setSessions((prev) =>
      prev.map((s) =>
        s.id !== activeSessionId ? s : { ...s, status: "running" }
      )
    );
    console.log(
      `  - UI Update: Session ${activeSessionId} status set to 'running'.`
    );

    try {
      await pomodoroResume(activeSessionId);
      console.log("  - API SUCCESS: pomodoroResume successful.");
    } catch (err) {
      console.error("pomodoroResume failed:", err);
    }

    clearSessionInterval();
    startSessionTimer(activeSessionId);
    console.log(
      `  - FINAL ACTION: Called startSessionTimer(${activeSessionId}). Timer should now be running.`
    );
  }, [
    isBreakTime,
    breakTimeRemaining,
    startBreakTimer,
    activeSessionId,
    clearSessionInterval,
    startSessionTimer,
    setSessions,
  ]);

  // ------------------- startCountdown (convenience) (THÊM LOG) -------------------
  const startCountdown = useCallback(() => {
    console.log("🔥 startCountdown: Clicked. State check:");
    console.log(`  - isBreakTime: ${isBreakTime}`);
    console.log(`  - activeSessionId: ${activeSessionId}`);

    if (isBreakTime) {
      if (breakTimeRemaining > 0) startBreakTimer();
      console.log("  - ACTION: Started Break Timer.");
      return;
    }
    if (activeSessionId && sessionTimeRemaining > 0) {
      resumeTimer();
      console.log("  - ACTION: Called resumeTimer (Starting Session).");
    } else {
      console.log(
        "  - WARNING: No active session or time remaining <= 0. Doing nothing."
      );
    }
  }, [
    isBreakTime,
    breakTimeRemaining,
    activeSessionId,
    sessionTimeRemaining,
    startBreakTimer,
    resumeTimer,
  ]);

  // ------------------- switchToSession -------------------
  const switchToSession = useCallback(
    async (sessionId: string, autoStart: boolean = false) => {
      try {
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
        setActiveSessionId(sessionId);
        setSessionTimeRemaining(newTimeRemaining);
        setIsBreakTime(false);
        setIsRunning(false);

        if (autoStart) {
          try {
            setSessions((prev) =>
              prev.map((s) =>
                s.id !== sessionId ? s : { ...s, status: "running" }
              )
            );
            await pomodoroResume(sessionId);
            clearSessionInterval();
            startSessionTimer(sessionId);
          } catch (err) {
            console.error("switchToSession autoStart error:", err);
          }
        } else {
          setSessions((prev) =>
            prev.map((s) =>
              s.id !== sessionId ? s : { ...s, status: "paused" }
            )
          );
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

  // ------------------- fetchHistory (FIXED RUNNING STATE SYNC) -------------------
  const fetchHistory = useCallback(async () => {
    try {
      const mapped = await pomodoroHistory();
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

      const completedCount = normalized.filter(
        (s) => s.status === "completed"
      ).length;
      setCompletedSessionsCount(completedCount);

      const running = normalized.find(
        (s) => s.status === "running" && (s.timeRemaining ?? 0) > 0
      );
      if (running) {
        setActiveSessionId(running.id);
        setSessionTimeRemaining(running.timeRemaining ?? running.duration * 60);
      } else {
        setActiveSessionId(null);
        setSessionTimeRemaining(0);
        setIsRunning(false);
        if (isBreakTime) {
          clearBreakInterval();
        }
      }
    } catch (err) {
      console.error("fetchHistory error:", err);
    }
  }, [clearBreakInterval, isBreakTime]);

  // ------------------- cleanupActiveSession -------------------
  const cleanupActiveSession = useCallback(async () => {
    if (activeSessionId && isRunning && !isBreakTime) {
      try {
        clearSessionInterval();
        setIsRunning(false);
        await pomodoroPause(activeSessionId);
      } catch (err) {
        console.warn("cleanupActiveSession warning:", err);
      }
    } else {
      if (isBreakTime) {
        clearBreakInterval();
        setIsRunning(false);
      }
    }
  }, [activeSessionId, isRunning, isBreakTime]);

  // ------------------- skipBreak -------------------
  const skipBreak = useCallback(() => {
    clearBreakInterval();
    setIsBreakTime(false);
    setIsRunning(false);
    setBreakTimeRemaining(0);
    startNextSession();
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
    const handleBeforeUnload = () => {
      if (activeSessionId && isRunning && !isBreakTime) {
        const token = localStorage.getItem("token");
        if (!token) return;
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
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
    return () => {
      clearSessionInterval();
      clearBreakInterval();
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
  }, []);

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
    timeRemaining,

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

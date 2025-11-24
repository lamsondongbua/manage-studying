"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Task, Session } from "@/types/index";
import {
  pomodoroStart,
  pomodoroStop,
  pomodoroHistory,
  pomodoroPause,
  pomodoroResume,
} from "@/services/apiServices";

interface AppContextType {
  // TASKS
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  startTask: (task: Task) => Promise<void>;

  // SESSION
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  fetchHistory: () => Promise<void>;
  startSession: (sessionFromUI: Session) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;

  // TIMER
  activeSessionId: string | null;
  timeRemaining: number;
  isRunning: boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
  startCountdown: () => void;

  getTotalTime: () => number;
  cleanupActiveSession: () => Promise<void>;
  switchToSession: (sessionId: string, autoStart?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ==================== TASKS ====================
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = useCallback(
    (task: Task) => setTasks((prev) => [...prev, task]),
    []
  );

  const updateTask = useCallback(
    (updated: Task) =>
      setTasks((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      ),
    []
  );

  const removeTask = useCallback(
    (id: string) => setTasks((prev) => prev.filter((t) => t._id !== id)),
    []
  );

  // ==================== SESSIONS ====================
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const DEFAULT_POMODORO_MIN = 25;

  // ==================== TIMER FUNCTIONS ====================
  // 1. Clear interval helper
  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  // 2. Complete session (needed by startLocalTimer)
  const completeSession = useCallback(
    async (sessionId: string) => {
      try {
        // Stop timer nếu đây là active session
        if (activeSessionId === sessionId) {
          clearTimerInterval();
          setIsRunning(false);
          setActiveSessionId(null);
          setTimeRemaining(0);
        }

        // Gọi API để đánh dấu hoàn thành
        const completedSession = await pomodoroStop(sessionId);

        // ✅ Cập nhật session trong state
        setSessions((prev) =>
          prev.map((s) =>
            s.id !== sessionId
              ? s
              : {
                  ...s,
                  status: "completed",
                  duration: completedSession.duration,
                  completedAt: completedSession.completedAt,
                  timeRemaining: 0, // ✅ Set về 0 khi hoàn thành
                }
          )
        );

        console.log("✅ Session completed:", sessionId);
      } catch (err) {
        console.error("completeSession error:", err);
      }
    },
    [activeSessionId, clearTimerInterval]
  );

  // 3. Start local countdown timer - KHÔNG dùng useCallback
  const startLocalTimer = () => {
    console.log("🚀 startLocalTimer called");

    // Clear existing interval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        console.log("⏱️ Tick:", prev);

        if (prev <= 1) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          setIsRunning(false);

          // Get current activeSessionId from ref để tránh stale closure
          setActiveSessionId((currentId) => {
            if (currentId) {
              console.log(
                "⏰ Timer finished! Auto-completing session:",
                currentId
              );
              completeSession(currentId).catch(console.error);
            }
            return null;
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setIsRunning(true);
    console.log("✅ Local timer started, interval ID:", intervalRef.current);
  };

  // 4. Pause timer and save to backend
  const pauseTimer = useCallback(async () => {
    clearTimerInterval();
    setIsRunning(false);

    if (activeSessionId) {
      try {
        await pomodoroPause(activeSessionId);
        console.log("⏸️ Timer paused and saved to backend");
      } catch (err) {
        console.error("Failed to pause on backend:", err);
      }
    }
  }, [activeSessionId, clearTimerInterval]);

  // 5. Resume timer from backend - KHÔNG dùng useCallback dependencies
  const resumeTimer = useCallback(async () => {
    console.log("🔄 resumeTimer called");

    // Get fresh values từ state
    setActiveSessionId((currentId) => {
      if (!currentId) {
        console.error("❌ No active session ID");
        return currentId;
      }

      console.log("▶️ Resuming session:", currentId);

      // Call API và start timer
      pomodoroResume(currentId)
        .then(() => {
          console.log("✅ Backend resumed, starting countdown");
          startLocalTimer();
        })
        .catch((err) => {
          console.error("❌ Failed to resume:", err);
        });

      return currentId;
    });
  }, []);

  // 6. Start countdown (for UI button)
  const startCountdown = useCallback(() => {
    if (activeSessionId && timeRemaining > 0) {
      startLocalTimer();
    }
  }, [activeSessionId, timeRemaining, startLocalTimer]);

  // 7. Cleanup active session (for logout/unmount)
  const cleanupActiveSession = useCallback(async () => {
    if (activeSessionId && isRunning) {
      try {
        clearTimerInterval();
        setIsRunning(false);

        // ✅ Chỉ gọi API nếu session còn tồn tại
        const session = sessions.find(
          (s) => s.id === activeSessionId && s.status !== "completed"
        );
        if (session) {
          await pomodoroPause(activeSessionId);
          console.log("🔒 Auto-paused session on cleanup");
        } else {
          console.log("⚠️ Session not found or already completed, skip pause");
        }
      } catch (err) {
        // ✅ Silent fail - không quan trọng nếu cleanup fail
        console.warn("⚠️ Failed to auto-pause (non-critical):", err.message);
      }
    }
  }, [activeSessionId, isRunning, clearTimerInterval, sessions]);

  // 8. Switch to a different session
  const switchToSession = useCallback(
    async (sessionId: string, autoStart: boolean = false) => {
      try {
        console.log("🔄 switchToSession called:", {
          sessionId,
          autoStart,
          currentActive: activeSessionId,
        });

        // Pause current active session if running
        if (activeSessionId && activeSessionId !== sessionId && isRunning) {
          console.log("⏸️ Pausing current session:", activeSessionId);
          await pauseTimer();
        }

        // Find the target session
        const targetSession = sessions.find((s) => s.id === sessionId);
        if (!targetSession) {
          console.error("❌ Session not found:", sessionId);
          return;
        }

        const newTimeRemaining =
          targetSession.timeRemaining ?? targetSession.duration * 60;

        console.log("📝 Setting new session state:", {
          sessionId,
          timeRemaining: newTimeRemaining,
          duration: targetSession.duration,
        });

        // Set new active session
        setActiveSessionId(sessionId);
        setTimeRemaining(newTimeRemaining);
        setIsRunning(false);

        // ✅ Auto-start nếu được yêu cầu
        if (autoStart && newTimeRemaining > 0) {
          console.log("▶️ Auto-starting session in 100ms:", sessionId);
          // Delay để đảm bảo state đã cập nhật
          setTimeout(async () => {
            console.log("🚀 Executing auto-start for:", sessionId);
            try {
              await pomodoroResume(sessionId);
              console.log("✅ Backend resumed, calling startLocalTimer");

              // Gọi trực tiếp setInterval thay vì qua callback
              clearTimerInterval();

              intervalRef.current = window.setInterval(() => {
                setTimeRemaining((prev) => {
                  if (prev <= 1) {
                    if (intervalRef.current)
                      window.clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    setIsRunning(false);

                    console.log(
                      "⏰ Timer finished! Auto-completing session:",
                      sessionId
                    );
                    completeSession(sessionId).catch(console.error);

                    setActiveSessionId(null);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);

              setIsRunning(true);
              console.log("✅ Timer started successfully");
            } catch (err) {
              console.error("❌ Failed to auto-start:", err);
            }
          }, 100);
        }

        console.log("✅ Switched to session successfully");
      } catch (err) {
        console.error("❌ Failed to switch session:", err);
      }
    },
    [
      activeSessionId,
      isRunning,
      pauseTimer,
      sessions,
      clearTimerInterval,
      completeSession,
    ]
  );

  // ==================== SESSION MANAGEMENT ====================
  // Fetch history and restore active session
  const fetchHistory = useCallback(async () => {
    try {
      console.log("🔄 Fetching history...");
      const mapped = await pomodoroHistory();
      setSessions(mapped);

      // Find running session and restore timer
      const runningSession = mapped.find(
        (s) =>
          s.status === "running" &&
          s.timeRemaining !== undefined &&
          s.timeRemaining > 0
      );

      if (runningSession) {
        console.log("🔄 Restoring active session:", runningSession);
        setActiveSessionId(runningSession.id);
        setTimeRemaining(runningSession.timeRemaining ?? 0);
        setIsRunning(false);
      }
    } catch (err) {
      console.error("fetchHistory error:", err);
    }
  }, []);

  // Start a new session
  const startSession = useCallback(
    async (sessionFromUI: Session) => {
      try {
        const duration = sessionFromUI.duration ?? DEFAULT_POMODORO_MIN;
        console.log("🎯 Starting session with - FE:", {
          taskName: sessionFromUI.taskName,
          duration,
        });

        const newSession = await pomodoroStart(
          sessionFromUI.taskName,
          duration
        );
        console.log("📥 Received session:", newSession);

        setSessions((prev) => [...prev, newSession]);
        setActiveSessionId(newSession.id);
        setTimeRemaining(newSession.duration * 60);
        setIsRunning(false);

        console.log("⏱️ Timer set to:", newSession.duration * 60, "seconds");
      } catch (err) {
        console.error("startSession error:", err);
        throw err;
      }
    },
    [DEFAULT_POMODORO_MIN]
  );

  // Start task from dashboard
  const startTask = useCallback(
    async (task: Task) => {
      const duration =
        task.duration ||
        (task.dueDate
          ? Math.max(
              Math.ceil(
                (new Date(task.dueDate).getTime() - Date.now()) / 60000
              ),
              1
            )
          : DEFAULT_POMODORO_MIN);

      const newSession: Session = {
        id: crypto.randomUUID(),
        taskName: task.title,
        duration,
        startedAt: new Date(),
        status: "running",
      };

      removeTask(task._id);
      await startSession(newSession);
    },
    [removeTask, startSession, DEFAULT_POMODORO_MIN]
  );

  // Get total completed time
  const getTotalTime = useCallback(
    () =>
      sessions
        .filter((s) => s.status === "completed")
        .reduce((acc, s) => acc + (s.duration ?? 0), 0),
    [sessions]
  );

  // ==================== EFFECTS ====================

  // Auto-pause on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeSessionId && isRunning) {
        const token = localStorage.getItem("token");
        if (token) {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

          // ✅ Silent fail với keepalive request
          fetch(`${apiUrl}/api/pomodoro/pause`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId: activeSessionId }),
            keepalive: true,
          }).catch(() => {
            // ✅ Bỏ qua lỗi - không quan trọng khi unload
          });
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeSessionId, isRunning]);

  // ❌ REMOVED: Auto-sync timer với backend mỗi 10s
  // Đoạn này gây conflict với countdown local

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      cleanupActiveSession();
    };
  }, [cleanupActiveSession]);

  // ==================== PROVIDER ====================
  return (
    <AppContext.Provider
      value={{
        tasks,
        setTasks,
        addTask,
        updateTask,
        removeTask,
        startTask,
        sessions,
        setSessions,
        fetchHistory,
        startSession,
        completeSession,
        activeSessionId,
        timeRemaining,
        isRunning,
        pauseTimer,
        resumeTimer,
        startCountdown,
        getTotalTime,
        cleanupActiveSession,
        switchToSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

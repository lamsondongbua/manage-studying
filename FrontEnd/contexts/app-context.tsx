"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Task, Session } from "@/types/index";

interface AppContextType {
  tasks: Task[];
  sessions: Session[];

  setTasks: (tasks: Task[]) => void;
  setSessions: (sessions: Session[]) => void;

  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;

  startSession: (session: Session) => void;
  completeSession: (sessionId: string) => void;
  getTotalTime: () => number;

  startTask: (task: Task) => void; // 🔹 thêm startTask
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // -------------------------------
  // TASK FUNCTIONS
  // -------------------------------
  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }, []);

  // -------------------------------
  // SESSION FUNCTIONS
  // -------------------------------
  const startSession = useCallback((session: Session) => {
    setSessions((prev) => [...prev, session]);
  }, []);

  const completeSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, status: "completed", completedAt: new Date() }
          : s
      )
    );
  }, []);

  const getTotalTime = useCallback(() => {
    return sessions
      .filter((s) => s.status === "completed")
      .reduce((total, s) => total + s.duration, 0);
  }, [sessions]);

  // 🔹 START TASK FUNCTION
  const startTask = useCallback(
    (task: Task) => {
      // Tạo session từ task
      const newSession: Session = {
        id: crypto.randomUUID(),
        taskName: task.title,
        duration: task.dueDate
          ? Math.max(
              Math.ceil(
                (new Date(task.dueDate).getTime() - Date.now()) / 60000
              ),
              1
            )
          : 25, // default 25 phút nếu không có dueDate
        startedAt: new Date(),
        status: "running",
      };

      // Bỏ task khỏi danh sách task
      removeTask(task._id);

      // Thêm session mới
      startSession(newSession);
    },
    [removeTask, startSession]
  );

  return (
    <AppContext.Provider
      value={{
        tasks,
        sessions,
        setTasks,
        setSessions,
        addTask,
        updateTask,
        removeTask,
        startSession,
        completeSession,
        getTotalTime,
        startTask, // 🔹 cung cấp startTask
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

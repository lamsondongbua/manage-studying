"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/app-context";
import TimerDisplay from "@/components/countdown/timer-display";
import SessionCard from "@/components/countdown/session-card";
import CompletedTasks from "@/components/countdown/completed-tasks";

export default function CountdownPage() {
  const {
    sessions,
    fetchHistory,
    activeSessionId,
    completeSession,
    timeRemaining,
    isRunning,
    pauseTimer,
    resumeTimer,
    switchToSession,
    // ✅ POMODORO CYCLE
    isBreakTime,
    breakDuration,
    completedSessionsCount,
    shortBreakMinutes,
    longBreakMinutes,
    setShortBreakMinutes,
    setLongBreakMinutes,
    skipBreak,
  } = useAppContext();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  // Load sessions on mount
  useEffect(() => {
    fetchHistory().catch(console.error);
  }, [fetchHistory]);

  // Auto-select active session
  useEffect(() => {
    if (activeSessionId && activeSessionId !== selectedSessionId) {
      console.log("🔄 Auto-selecting new active session:", activeSessionId);
      setSelectedSessionId(activeSessionId);
    }
  }, [activeSessionId, selectedSessionId]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  // ✅ SIMPLIFIED: Lấy thông tin hiển thị trực tiếp từ context
  const displayTimeRemaining =
    selectedSessionId === activeSessionId
      ? timeRemaining
      : selectedSession?.timeRemaining ?? (selectedSession?.duration ?? 0) * 60;

  const displayIsRunning = selectedSessionId === activeSessionId && isRunning;

  // DEBUG
  useEffect(() => {
    console.log("=== COUNTDOWN PAGE STATE ===");
    console.log("Selected session ID:", selectedSessionId);
    console.log("Active session ID:", activeSessionId);
    console.log("Context timeRemaining:", timeRemaining);
    console.log("Context isRunning:", isRunning);
    console.log("Display timeRemaining:", displayTimeRemaining);
    console.log("Display isRunning:", displayIsRunning);
    console.log("Selected session:", selectedSession);
  }, [
    selectedSessionId,
    activeSessionId,
    timeRemaining,
    isRunning,
    displayTimeRemaining,
    displayIsRunning,
    selectedSession,
  ]);

  // ✅ SIMPLIFIED: Handle start/pause
  const handleStartPause = async () => {
    if (!selectedSessionId || !selectedSession) {
      console.error("❌ No session selected");
      return;
    }

    console.log("🎯 handleStartPause:", {
      selectedSessionId,
      activeSessionId,
      isActive: selectedSessionId === activeSessionId,
      isRunning,
    });

    // Nếu là active session → toggle pause/resume
    if (selectedSessionId === activeSessionId) {
      if (isRunning) {
        console.log("⏸️ Pausing");
        await pauseTimer();
      } else {
        console.log("▶️ Resuming");
        await resumeTimer();
      }
    } else {
      // Khác session → switch và auto-start
      console.log("🔄 Switching and starting");
      await switchToSession(selectedSessionId, true);
    }
  };

  const handleComplete = () => {
    if (selectedSessionId) {
      completeSession(selectedSessionId);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    console.log("📌 Selecting session:", sessionId);

    // Nếu đang chạy session khác, pause nó trước
    if (activeSessionId && activeSessionId !== sessionId && isRunning) {
      console.log("⏸️ Auto-pausing current session");
      await pauseTimer();
    }

    setSelectedSessionId(sessionId);

    // Switch context để sync timeRemaining
    if (sessionId !== activeSessionId) {
      await switchToSession(sessionId, false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-blue-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 dark:from-purple-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
            Countdown Timer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Tập trung vào công việc hiện tại và quản lý thời gian hiệu quả
          </p>
        </div>

        {/* GRID 2/3 - 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Timer + Session list */}
          <div className="lg:col-span-2">
            {/* TIMER */}
            <TimerDisplay
              session={selectedSession}
              timeRemaining={displayTimeRemaining}
              isRunning={displayIsRunning}
              isBreak={isBreakTime}
              breakTime={breakDuration}
              onStartPause={handleStartPause}
              onComplete={handleComplete}
              onSetBreakTime={(minutes) => {
                // Not used anymore - using context state
              }}
              shortBreakMinutes={shortBreakMinutes}
              longBreakMinutes={longBreakMinutes}
              onSetShortBreak={setShortBreakMinutes}
              onSetLongBreak={setLongBreakMinutes}
              onSkipBreak={skipBreak}
              completedSessionsCount={completedSessionsCount}
            />

            {/* SESSION LIST */}
            <div className="mt-8 animate-slide-up">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">
                Danh sách phiên học
              </h2>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {sessions
                  .filter((s) => s.status !== "completed")
                  .map((s, idx) => (
                    <div
                      key={s.id}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className="animate-scale-in relative"
                    >
                      <SessionCard
                        session={s}
                        isActive={s.id === selectedSessionId}
                        onClick={() => handleSelectSession(s.id)}
                      />

                      {/* Badge cho session đang chạy */}
                      {s.id === activeSessionId && isRunning && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-full">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          <span className="text-[10px] text-white font-bold uppercase tracking-wide">
                            Running
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Completed tasks */}
          <div className="lg:col-span-1">
            <CompletedTasks
              sessions={sessions.filter((s) => s.status === "completed")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

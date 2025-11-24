"use client";

import { useState } from "react";
import { Session } from "@/types/index";

interface TimerDisplayProps {
  session: Session | undefined;
  timeRemaining: number;
  isRunning: boolean;
  isBreak: boolean;
  breakTime: number;
  onStartPause: () => void;
  onComplete: () => void;
  onSetBreakTime: (time: number) => void;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  onSetShortBreak: (minutes: number) => void;
  onSetLongBreak: (minutes: number) => void;
  onSkipBreak: () => void;
  completedSessionsCount: number;
}

export default function TimerDisplay({
  session,
  timeRemaining,
  isRunning,
  isBreak,
  breakTime,
  onStartPause,
  onComplete,
  onSetBreakTime,
  shortBreakMinutes,
  longBreakMinutes,
  onSetShortBreak,
  onSetLongBreak,
  onSkipBreak,
  completedSessionsCount,
}: TimerDisplayProps) {
  const [showBreakSettings, setShowBreakSettings] = useState(false);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const displayTime = () => {
    return formatTime(timeRemaining);
  };

  const calculateProgress = () => {
    if (isBreak) {
      const totalSeconds = breakTime * 60;
      const elapsed = totalSeconds - timeRemaining;
      return Math.min(Math.max((elapsed / totalSeconds) * 100, 0), 100);
    }

    if (!session) return 0;
    const totalSeconds = (session.duration ?? 0) * 60;
    const elapsed = totalSeconds - timeRemaining;
    return Math.min(Math.max((elapsed / totalSeconds) * 100, 0), 100);
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m > 0 ? m + "m" : ""}`;
    return `${m}m`;
  };

  // ✅ Xác định loại break hiện tại
  const isLongBreak =
    completedSessionsCount % 3 === 0 && completedSessionsCount > 0;

  return (
    <div
      className={`${isRunning ? "animate-pulse-glow" : ""} bg-gradient-to-br ${
        isBreak
          ? "from-emerald-500 via-teal-500 to-cyan-600 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-800"
          : "from-purple-500 via-indigo-500 to-blue-600 dark:from-purple-700 dark:via-indigo-700 dark:to-blue-800"
      } rounded-3xl p-12 text-white shadow-lg-soft backdrop-blur-sm animate-scale-in border border-white/20 transition-all duration-500`}
    >
      <div className="text-center mb-10 animate-fade-in">
        <p className="text-purple-100 text-xs uppercase tracking-widest mb-3 font-semibold animate-slide-in-left">
          {isBreak
            ? isLongBreak
              ? "☕ Long Break Time"
              : "☕ Short Break Time"
            : "📚 Current Task"}
        </p>
        <h2 className="text-4xl font-bold animate-slide-in-right text-white drop-shadow-lg">
          {isBreak
            ? isLongBreak
              ? `Long Break (${longBreakMinutes}m)`
              : `Short Break (${shortBreakMinutes}m)`
            : session?.taskName || "Select a task"}
        </h2>
        {!isBreak && session && (
          <p className="text-purple-200 text-sm mt-2 font-medium">
            Duration: {formatDuration(session.duration ?? 0)}
            {session.status === "completed" && " • ✓ Completed"}
          </p>
        )}
        {isBreak && (
          <p className="text-emerald-100 text-sm mt-2 font-medium">
            🎉 Completed: {completedSessionsCount} session
            {completedSessionsCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="text-center mb-14 animate-bounce-in">
        <div
          className={`text-9xl font-bold font-mono tracking-tighter mb-6 ${
            isRunning ? "animate-pulse" : ""
          } drop-shadow-lg`}
        >
          {displayTime()}
        </div>

        {/* Progress bar */}
        <div className="h-2 w-40 bg-white/30 mx-auto rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
          <div
            className={`h-full transition-all duration-500 ${
              isBreak
                ? "bg-gradient-to-r from-emerald-300 to-teal-300"
                : "bg-gradient-to-r from-cyan-300 to-emerald-300"
            }`}
            style={{
              width: `${calculateProgress()}%`,
            }}
          ></div>
        </div>

        {/* Status text */}
        <div className="mt-4 text-sm text-purple-200">
          {isBreak ? (
            isRunning ? (
              <p>Đang nghỉ ngơi... Còn lại: {formatTime(timeRemaining)}</p>
            ) : (
              <p>Nhấn Start để bắt đầu nghỉ ngơi</p>
            )
          ) : (
            <>
              {isRunning ? (
                <p>Còn lại: {formatTime(timeRemaining)}</p>
              ) : session?.status === "completed" ? (
                <p>Đã hoàn thành</p>
              ) : timeRemaining > 0 ? (
                <p>Tạm dừng - Còn lại: {formatTime(timeRemaining)}</p>
              ) : (
                <p>Nhấn Start để bắt đầu</p>
              )}
            </>
          )}
        </div>
      </div>

      <div
        className="flex gap-4 justify-center mb-8 animate-slide-up flex-wrap"
        style={{ animationDelay: "0.2s" }}
      >
        {isBreak ? (
          <>
            <button
              onClick={onStartPause}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-lg transition-all border border-white/40 flex items-center gap-2 hover:shadow-lg hover:shadow-white/20 active:scale-95 duration-300 backdrop-blur-md"
            >
              {isRunning ? "⏸️ Pause" : "▶️ Start Break"}
            </button>
            <button
              onClick={onSkipBreak}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-lg transition-all border border-white/40 hover:shadow-lg hover:shadow-white/20 active:scale-95 duration-300 backdrop-blur-md"
            >
              ⏭️ Skip Break
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onStartPause}
              disabled={!session || session.status === "completed"}
              className={`px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-lg transition-all border border-white/40 flex items-center gap-2 hover:shadow-lg hover:shadow-white/20 active:scale-95 duration-300 backdrop-blur-md ${
                !session || session.status === "completed"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isRunning ? "⏸️ Pause" : "▶️ Start"}
            </button>
            <button
              onClick={onComplete}
              disabled={!session || session.status === "completed"}
              className={`px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-lg transition-all border border-white/40 hover:shadow-lg hover:shadow-white/20 active:scale-95 duration-300 backdrop-blur-md ${
                !session || session.status === "completed"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              ✓ Complete
            </button>
          </>
        )}
        <button
          onClick={() => setShowBreakSettings(!showBreakSettings)}
          className="px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-lg transition-all border border-white/40 hover:shadow-lg hover:shadow-white/20 active:scale-95 duration-300 backdrop-blur-md"
        >
          ⚙️ Settings
        </button>
      </div>

      {showBreakSettings && (
        <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/30 animate-slide-up shadow-lg">
          <h3 className="font-bold mb-5 text-lg text-white">Cấu hình Break</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold">
                Short Break (phút)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={shortBreakMinutes || 5}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onSetShortBreak(isNaN(val) ? 5 : val);
                }}
                className="w-full px-3 py-2 bg-white/20 rounded-lg border border-white/40 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-300 focus:outline-none transition-all backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold">
                Long Break (phút)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={longBreakMinutes || 15}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onSetLongBreak(isNaN(val) ? 15 : val);
                }}
                className="w-full px-3 py-2 bg-white/20 rounded-lg border border-white/40 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-300 focus:outline-none transition-all backdrop-blur-sm"
              />
            </div>
          </div>
          <p className="text-xs text-white/70 mt-4">
            💡 Short break sau mỗi session • Long break sau mỗi 3 sessions
          </p>
        </div>
      )}

      <div
        className="bg-white/15 backdrop-blur-md rounded-2xl p-5 text-center text-sm animate-slide-up border border-white/30 shadow-lg"
        style={{ animationDelay: "0.3s" }}
      >
        {isBreak ? (
          <p className="font-medium">
            Thời gian nghỉ ngơi - Bạn đã làm việc tuyệt vời! 🎉
          </p>
        ) : session ? (
          <p>
            Tập trung vào:{" "}
            <strong className="text-cyan-200">{session.taskName}</strong>
            {" • "}
            <span className="text-purple-200">
              {formatDuration(session.duration ?? 0)}
            </span>
          </p>
        ) : (
          <p>Chọn một phiên học để bắt đầu</p>
        )}
      </div>
    </div>
  );
}

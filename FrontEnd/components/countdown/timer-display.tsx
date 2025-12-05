"use client";

import { useState, useEffect } from "react";
import { Session } from "@/types/index";
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle,
  Settings,
  X,
} from "lucide-react";

interface TimerDisplayProps {
  session: Session | undefined;
  timeRemaining: number;
  isRunning: boolean;
  isBreak: boolean;
  breakTime: number;
  onStartPause: () => void;
  onComplete: () => void;
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
  shortBreakMinutes,
  longBreakMinutes,
  onSetShortBreak,
  onSetLongBreak,
  onSkipBreak,
  completedSessionsCount,
}: TimerDisplayProps) {
  const [showSettings, setShowSettings] = useState(false);

  const [localShortBreak, setLocalShortBreak] = useState(shortBreakMinutes);
  const [localLongBreak, setLocalLongBreak] = useState(longBreakMinutes);

  useEffect(() => {
    setLocalShortBreak(shortBreakMinutes);
    setLocalLongBreak(longBreakMinutes);
  }, [shortBreakMinutes, longBreakMinutes]);

  const handleSaveSettings = () => {
    onSetShortBreak(localShortBreak);
    onSetLongBreak(localLongBreak);
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalDuration = isBreak
    ? breakTime * 60
    : (session?.duration ?? 25) * 60;

  const safeTotal = totalDuration > 0 ? totalDuration : 1;
  const progress = ((safeTotal - timeRemaining) / safeTotal) * 100;
  const circumference = 283; // 2 * PI * 45
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  const isLongBreakNext = (completedSessionsCount + 1) % 4 === 0;

  const currentBreakType = isBreak
    ? breakTime >= longBreakMinutes
      ? "Long Break"
      : "Short Break"
    : null;

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square bg-white dark:bg-slate-900 rounded-full shadow-2xl flex flex-col items-center justify-center p-8 border-4 border-slate-100 dark:border-slate-800">
      <svg
        className="absolute w-full h-full transform -rotate-90 pointer-events-none"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="3"
          className="text-slate-200 dark:text-slate-800"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="3"
          className={`${
            isBreak ? "text-emerald-500" : "text-indigo-600"
          } transition-all duration-1000 ease-linear`}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {showSettings && (
        <div className="absolute inset-0 z-20 bg-white/98 dark:bg-slate-900/98 rounded-full flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <button
            onClick={() => setShowSettings(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>

          <h3 className="text-lg font-bold mb-6 text-slate-700 dark:text-slate-200">
            Break Settings
          </h3>

          <div className="space-y-4 w-full max-w-[220px]">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Short Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={localShortBreak}
                onChange={(e) =>
                  setLocalShortBreak(Math.max(1, Number(e.target.value)))
                }
                className="w-full p-3 border rounded-lg text-center dark:bg-slate-800 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Long Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={localLongBreak}
                onChange={(e) =>
                  setLocalLongBreak(Math.max(1, Number(e.target.value)))
                }
                className="w-full p-3 border rounded-lg text-center dark:bg-slate-800 dark:border-slate-700 font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition-colors"
          >
            Save Settings
          </button>
        </div>
      )}

      <div className="z-10 text-center flex flex-col items-center">
        <div
          className={`mb-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
            isBreak
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
          }`}
        >
          {isBreak ? currentBreakType : session?.taskName || "Focus Time"}
        </div>

        <div className="text-7xl font-bold tracking-tighter text-slate-800 dark:text-white font-mono mb-2">
          {formatTime(timeRemaining)}
        </div>

        {!isBreak && session && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Session #{completedSessionsCount + 1}
          </p>
        )}
        {isBreak && (
          <div className="mb-6">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              Relax & Recharge ☕
            </p>
            {!isRunning && (
              <p className="text-xs text-slate-400 mt-1">
                Press play to start break
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Timer Settings"
          >
            <Settings size={22} />
          </button>

          <button
            onClick={onStartPause}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transform transition-all hover:scale-105 active:scale-95 ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            title={isRunning ? "Pause" : "Start"}
          >
            {isRunning ? (
              <Pause fill="white" size={24} />
            ) : (
              <Play fill="white" className="ml-1" size={24} />
            )}
          </button>

          {isBreak ? (
            <button
              onClick={onSkipBreak}
              className="p-3 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              title="Skip Break"
            >
              <SkipForward size={22} />
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="p-3 rounded-full text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
              title="Complete Session Early"
            >
              <CheckCircle size={22} />
            </button>
          )}
        </div>

        {!isBreak && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            Next break:{" "}
            {isLongBreakNext
              ? `${longBreakMinutes}m (Long)`
              : `${shortBreakMinutes}m (Short)`}
          </p>
        )}
      </div>
    </div>
  );
}

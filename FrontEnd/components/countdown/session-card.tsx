"use client";

import { Session } from "@/types/index";

interface SessionCardProps {
  session: Session;
  isActive: boolean;
  onClick: () => void;
}

export default function SessionCard({
  session,
  isActive,
  onClick,
}: SessionCardProps) {
  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-5 rounded-2xl transition-all text-left font-medium transform duration-300 ${
        isActive
          ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg scale-105 border border-cyan-300/50 animate-pulse-glow"
          : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-md dark:hover:shadow-cyan-500/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">{session.taskName}</h3>
          <p
            className={`text-sm mt-1 ${
              isActive ? "text-cyan-100" : "text-gray-600 dark:text-gray-400"
            }`}
          >
            ⏱️ {formatDuration(session.duration)}
          </p>
        </div>
        <div
          className={`text-2xl transition-all ${
            isActive ? "animate-bounce scale-110" : "opacity-60"
          }`}
        >
          {isActive ? "▶️" : "⏸️"}
        </div>
      </div>
    </button>
  );
}

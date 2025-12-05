// components/countdown/session-card.tsx
"use client";

import { Session } from "@/types/index";
import { Play, Pause, Clock } from "lucide-react";

interface SessionCardProps {
  session: Session | null;
  isActive: boolean;
  onClick: () => void;
}

export default function SessionCard({
  session,
  isActive,
  onClick,
}: SessionCardProps) {
  if (!session) {
    return null;
  }

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatTimeRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  let statusIcon;
  let iconClass = "";
  let statusBadge = null;

  if (session.status === "running") {
    statusIcon = <Pause size={18} fill="currentColor" />;
    iconClass = "bg-amber-400 text-slate-900 shadow-md animate-pulse";
    statusBadge = (
      <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-full">
        RUNNING
      </span>
    );
  } else if (session.status === "paused") {
    statusIcon = <Play size={18} fill="currentColor" className="ml-0.5" />;
    iconClass =
      "bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400";
    statusBadge = (
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Paused
      </span>
    );
  } else {
    statusIcon = <Clock size={18} />;
    iconClass = "bg-slate-100 dark:bg-slate-700 text-slate-500";
    statusBadge = (
      <span className="text-xs font-semibold text-slate-400">Pending</span>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl transition-all text-left font-medium transform duration-200 ${
        isActive
          ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg scale-[1.02] border-2 border-cyan-300/50"
          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-md"
      }`}
      title={`Chuyển sang ${session.taskName}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-base mb-1">{session.taskName}</h3>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={
                isActive
                  ? "text-cyan-100"
                  : "text-slate-600 dark:text-slate-400"
              }
            >
              ⏱️ {formatDuration(session.duration)}
            </span>
            {session.timeRemaining !== undefined &&
              session.timeRemaining > 0 && (
                <span
                  className={
                    isActive
                      ? "text-cyan-200"
                      : "text-slate-500 dark:text-slate-500"
                  }
                >
                  • {formatTimeRemaining(session.timeRemaining)} left
                </span>
              )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusBadge}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${iconClass}`}
          >
            {statusIcon}
          </div>
        </div>
      </div>
    </button>
  );
}

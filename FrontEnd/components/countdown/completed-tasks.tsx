"use client";

import { Session } from "@/types/index";

interface CompletedTasksProps {
  sessions: Session[];
}

export default function CompletedTasks({ sessions }: CompletedTasksProps) {
  console.log("Sessions: ", sessions);
  const getTotalTime = () =>
    sessions.reduce((total, s) => total + (s.duration ?? 0), 0);
  const formatTimeFromSeconds = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-lg-soft p-8 sticky top-8 animate-slide-in-right backdrop-blur-sm">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 animate-fade-in flex items-center gap-2">
        <span className="text-2xl">✓</span> Hoàn thành
      </h3>
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Chưa có công việc hoàn thành
          </p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl p-6 mb-6 animate-bounce-in border border-emerald-200 dark:border-emerald-700/50">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-semibold">
              Tổng thời gian
            </p>
            <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              {formatTimeFromSeconds(getTotalTime())}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
              ✓ {sessions.length} công việc hoàn thành
            </p>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-xl text-sm animate-scale-in hover:shadow-md transition-all duration-300"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {session.taskName}
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 text-xs mt-2 flex items-center gap-1">
                  ⏱️ {formatTimeFromSeconds(session.duration)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

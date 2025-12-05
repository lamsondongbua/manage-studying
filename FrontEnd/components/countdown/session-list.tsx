// components/countdown/session-list.tsx
"use client";

import { Session } from "@/types/index";
import SessionCard from "./session-card";

interface SessionListProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSwitchSession: (sessionId: string) => Promise<void>;
}

export default function SessionList({
  sessions,
  activeSessionId,
  onSwitchSession,
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
        <p className="font-medium">🎉 Bạn đã hoàn thành tất cả các phiên!</p>
        <p className="text-sm mt-1">Hãy thêm một công việc mới để bắt đầu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          isActive={session.id === activeSessionId}
          onClick={() => onSwitchSession(session.id)}
        />
      ))}
    </div>
  );
}

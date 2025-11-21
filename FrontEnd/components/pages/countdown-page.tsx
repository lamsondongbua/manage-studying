'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/app-context';
import TimerDisplay from '@/components/countdown/timer-display';
import SessionCard from '@/components/countdown/session-card';
import CompletedTasks from '@/components/countdown/completed-tasks';

export default function CountdownPage() {
  const { sessions, completeSession } = useAppContext();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [breakTime, setBreakTime] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeRunningSession = sessions.find(s => s.status === 'running' && s.id === activeSessionId);
  const completedSessions = sessions.filter(s => s.status === 'completed');

  useEffect(() => {
    if (!isRunning || !activeSessionId) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          playNotificationSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, activeSessionId]);

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleSelectSession = (sessionId: string) => {
    if (activeSessionId === sessionId) return;

    setActiveSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setTimeRemaining(session.duration * 60);
      setIsRunning(false);
      setIsBreak(false);
      setBreakTime(0);
    }
  };

  const handleStartPause = () => {
    if (!activeSessionId) {
      const firstSession = sessions.find(s => s.status === 'running');
      if (firstSession) {
        handleSelectSession(firstSession.id);
      }
      return;
    }
    setIsRunning(!isRunning);
  };

  const handleComplete = () => {
    if (activeSessionId) {
      completeSession(activeSessionId);
      setActiveSessionId(null);
      setTimeRemaining(0);
      setIsRunning(false);
    }
  };

  const runningAndPendingSessions = sessions.filter(s => s.status === 'running');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-blue-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 dark:from-purple-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
            Countdown Timer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Tập trung vào công việc hiện tại và quản lý thời gian hiệu quả</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer Display */}
          <div className="lg:col-span-2">
            <TimerDisplay
              session={activeSession}
              timeRemaining={timeRemaining}
              isRunning={isRunning}
              isBreak={isBreak}
              breakTime={breakTime}
              onStartPause={handleStartPause}
              onComplete={handleComplete}
              onSetBreakTime={setBreakTime}
            />

            {/* Session List */}
            <div className="mt-8 animate-slide-up">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Danh sách phiên học</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {runningAndPendingSessions.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 shadow-soft">
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Không có phiên học nào đang chờ. Hãy thêm từ Dashboard!</p>
                  </div>
                ) : (
                  runningAndPendingSessions.map((session, idx) => (
                    <div key={session.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-scale-in">
                      <SessionCard
                        session={session}
                        isActive={activeSessionId === session.id}
                        onClick={() => handleSelectSession(session.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Completed Tasks */}
          <div className="lg:col-span-1">
            <CompletedTasks sessions={completedSessions} />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Session } from '@/types/index';

interface TimerDisplayProps {
  session: Session | undefined;
  timeRemaining: number;
  isRunning: boolean;
  isBreak: boolean;
  breakTime: number;
  onStartPause: () => void;
  onComplete: () => void;
  onSetBreakTime: (time: number) => void;
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
}: TimerDisplayProps) {
  const [showBreakSettings, setShowBreakSettings] = useState(false);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${isRunning ? 'animate-pulse-glow' : ''} bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 dark:from-purple-700 dark:via-indigo-700 dark:to-blue-800 rounded-3xl p-12 text-white shadow-lg-soft backdrop-blur-sm animate-scale-in border border-white/20`}>
      {/* Task Name */}
      <div className="text-center mb-10 animate-fade-in">
        <p className="text-purple-100 text-xs uppercase tracking-widest mb-3 font-semibold animate-slide-in-left">
          {isBreak ? '☕ Break Time' : '📚 Current Task'}
        </p>
        <h2 className="text-4xl font-bold animate-slide-in-right text-white drop-shadow-lg">{session?.taskName || 'Select a task'}</h2>
      </div>

      {/* Large Timer */}
      <div className="text-center mb-14 animate-bounce-in">
        <div className={`text-9xl font-bold font-mono tracking-tighter mb-6 ${isRunning ? 'animate-pulse' : ''} drop-shadow-lg`}>
          {formatTime(timeRemaining)}
        </div>
        <div className="h-2 w-40 bg-white/30 mx-auto rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
          <div
            className="h-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all duration-500 shadow-lg"
            style={{
              width: session
                ? `${((session.duration * 60 - timeRemaining) / (session.duration * 60)) * 100}%`
                : '0%',
            }}
          ></div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 justify-center mb-8 animate-slide-up flex-wrap" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={onStartPause}
          className="px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-lg transition-all border border-white/40 flex items-center gap-2 hover:shadow-lg hover:shadow-white/20 active:scale-95 duration-300 backdrop-blur-md"
        >
          {isRunning ? '⏸️ Pause' : '▶️ Start'}
        </button>
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-lg transition-all border border-white/40 hover:shadow-lg hover:shadow-white/20 active:scale-95 duration-300 backdrop-blur-md"
        >
          ✓ Complete
        </button>
        <button
          onClick={() => setShowBreakSettings(!showBreakSettings)}
          className="px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-lg transition-all border border-white/40 hover:shadow-lg hover:shadow-white/20 active:scale-95 duration-300 backdrop-blur-md"
        >
          ☕ Break
        </button>
      </div>

      {/* Break Settings */}
      {showBreakSettings && (
        <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/30 animate-slide-up shadow-lg">
          <h3 className="font-bold mb-5 text-lg text-white">Cấu hình Break</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold">Short Break (phút)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={shortBreak}
                  onChange={e => setShortBreak(parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 bg-white/20 rounded-lg border border-white/40 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-300 focus:outline-none transition-all backdrop-blur-sm"
                />
                <button
                  onClick={() => {
                    onSetBreakTime(shortBreak * 60);
                    setShowBreakSettings(false);
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all active:scale-95 border border-white/40 font-semibold"
                >
                  Set
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold">Long Break (phút)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreak}
                  onChange={e => setLongBreak(parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 bg-white/20 rounded-lg border border-white/40 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-300 focus:outline-none transition-all backdrop-blur-sm"
                />
                <button
                  onClick={() => {
                    onSetBreakTime(longBreak * 60);
                    setShowBreakSettings(false);
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all active:scale-95 border border-white/40 font-semibold"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 text-center text-sm animate-slide-up border border-white/30 shadow-lg" style={{ animationDelay: '0.3s' }}>
        {isBreak ? (
          <p className="font-medium">Thời gian nghỉ ngơi - Bạn đã làm việc tuyệt vời!</p>
        ) : session ? (
          <p>Tập trung vào: <strong className="text-cyan-200">{session.taskName}</strong></p>
        ) : (
          <p>Chọn một phiên học để bắt đầu</p>
        )}
      </div>
    </div>
  );
}

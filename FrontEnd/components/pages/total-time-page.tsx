'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/app-context';

export default function TotalTimePage() {
  const { sessions } = useAppContext();
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [elapsedToday, setElapsedToday] = useState(0);

  useEffect(() => {
    const completed = sessions.filter(s => s.status === 'completed');
    const total = completed.reduce((sum, s) => sum + s.duration * 60, 0);
    setTotalSeconds(total);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCompleted = completed.filter(s => {
      const dateToCheck = s.completedAt || s.startedAt;
      if (!dateToCheck) return false; 
      const completedDate = new Date(dateToCheck);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
    const todayTotal = todayCompleted.reduce((sum, s) => sum + s.duration * 60, 0);
    setElapsedToday(todayTotal);
  }, [sessions]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return { hours, minutes, secs };
  };

  const total = formatTime(totalSeconds);
  const today = formatTime(elapsedToday);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Tổng thời gian
          </h1>
          <p className="text-gray-600">Theo dõi tổng thời gian học tập của bạn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl">
            <p className="text-amber-100 text-sm uppercase tracking-widest mb-2">Hôm nay</p>
            <div className="text-6xl font-bold font-mono mb-2">
              {String(today.hours).padStart(2, '0')}:{String(today.minutes).padStart(2, '0')}:{String(today.secs).padStart(2, '0')}
            </div>
            <p className="text-amber-100">Thời gian học từ khi mở ứng dụng</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
            <p className="text-indigo-100 text-sm uppercase tracking-widest mb-2">Tổng cộng</p>
            <div className="text-6xl font-bold font-mono mb-2">
              {String(total.hours).padStart(2, '0')}:{String(total.minutes).padStart(2, '0')}:{String(total.secs).padStart(2, '0')}
            </div>
            <p className="text-indigo-100">Toàn bộ thời gian học</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">💡 Mẹo tối ưu hóa</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <p className="font-semibold">Tắt thông báo</p>
                <p className="text-sm text-gray-600">Bật chế độ "Do Not Disturb" trong hệ điều hành để tập trung vào công việc</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-semibold">Giữ điện thoại ở chế độ yên tĩnh</p>
                <p className="text-sm text-gray-600">Đặt thiết bị của bạn ở chế độ Im lặng để tránh bị gián đoạn</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">⏸️</span>
              <div>
                <p className="font-semibold">Sử dụng Break Time</p>
                <p className="text-sm text-gray-600">Hãy nghỉ ngơi đúng cách để duy trì năng suất</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-semibold">Đặt mục tiêu hàng ngày</p>
                <p className="text-sm text-gray-600">Cố gắng vượt qua mục tiêu hôm qua để tăng động lực</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

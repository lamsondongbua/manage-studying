'use client';

import { AdminUser, TaskRecord } from '@/types/admin';
import { useAdmin } from '@/contexts/admin-context';
import { Calendar, Clock, Target, TrendingUp, X } from 'lucide-react';

interface AdminUsersDetailProps {
  userId: string;
  onClose: () => void;
}

export default function AdminUsersDetail({ userId, onClose }: AdminUsersDetailProps) {
  const { users, getUserTasks } = useAdmin();
  const user = users.find(u => u.id === userId);
  const userTasks = getUserTasks(userId);

  if (!user) return null;

  const completedTasks = userTasks.filter(t => t.status === 'completed');
  const completionRate = userTasks.length > 0 ? (completedTasks.length / userTasks.length * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto glass-effect animate-scale-in">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-slate-800/50 backdrop-blur">
          <h2 className="text-2xl font-bold text-white">Chi tiết người dùng</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="space-y-2">
            <p className="text-slate-400 text-sm">Email</p>
            <p className="text-xl font-semibold text-white">{user.email}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Target size={18} className="text-cyan-400" />
                <p className="text-slate-400 text-sm">Công Việc Hoàn Thành</p>
              </div>
              <p className="text-2xl font-bold text-cyan-400">{completedTasks.length}/{userTasks.length}</p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-purple-400" />
                <p className="text-slate-400 text-sm">Tỉ Lệ Hoàn Thành</p>
              </div>
              <p className="text-2xl font-bold text-purple-400">{completionRate}%</p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-orange-400" />
                <p className="text-slate-400 text-sm">Tổng Thời Gian</p>
              </div>
              <p className="text-2xl font-bold text-orange-400">{Math.round(user.stats.totalStudyTime / 60)}h</p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-pink-400" />
                <p className="text-slate-400 text-sm">Đã Đăng Ký</p>
              </div>
              <p className="text-sm font-semibold text-pink-400">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          {/* Recent Tasks */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Công Việc Gần Đây</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {userTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <span className="text-white font-medium text-sm">{task.title}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    task.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {task.status === 'completed' ? 'Hoàn Thành' : 'Đang Làm'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

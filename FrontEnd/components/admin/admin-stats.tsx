"use client";

import { useAdmin } from "@/contexts/admin-context";
import { Users, Zap, Clock, TrendingUp } from "lucide-react";

export default function AdminStats() {
  const { users, tasks, adminSessions, totalCompletedSessions } = useAdmin();

  const totalUser = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;

  // ✅ Tính tổng thời gian từ adminSessions (tất cả user)
  const totalFocusMinutes = adminSessions
    ? adminSessions.reduce((total, session) => {
        return total + (session.duration || 0);
      }, 0)
    : 0;

  // ✅ Chuyển đổi sang giờ (làm tròn 1 chữ số thập phân)
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  const stats = [
    {
      icon: Users,
      label: "Tổng Người Dùng",
      value: totalUser,
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Zap,
      label: "Công Việc Hoàn Thành",
      value: totalCompletedSessions, // ✅ Số session hoàn thành từ tất cả user
      color: "from-cyan-500 to-cyan-600",
    },
    {
      icon: Clock,
      label: "Tổng Thời Gian (giờ)",
      value: totalFocusHours, // ✅ Tổng thời gian học của tất cả user
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: TrendingUp,
      label: "Người Dùng Hoạt Động",
      value: activeUsers,
      color: "from-pink-500 to-pink-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="glass-effect p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-1 group animate-bounce-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div
            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} p-3 mb-4 group-hover:scale-110 transition-transform`}
          >
            <stat.icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
          <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

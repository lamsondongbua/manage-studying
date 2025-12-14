"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/contexts/admin-context";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { getUserStatistics } from "@/services/apiServices";

interface TaskStats {
  completed: number;
  incomplete: number;
}

interface SessionStats {
  total: number;
  completed: number;
  totalMinutes: number;
}

export default function AdminTasksChart() {
  const { users } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [allTasksData, setAllTasksData] = useState<any[]>([]);
  const [allSessionsData, setAllSessionsData] = useState<any[]>([]);

  useEffect(() => {
    loadAllUserData();
  }, [users]);

  const loadAllUserData = async () => {
    try {
      setLoading(true);

      const allTasks: any[] = [];
      const allSessions: any[] = [];

      // Load data for all users
      for (const user of users) {
        try {
          const stats = await getUserStatistics(user.id);

          // Collect tasks
          stats.tasks.tasks.forEach((task: any) => {
            allTasks.push({
              ...task,
              userId: user.id,
              userEmail: user.email,
              userName: user.name || user.email.split("@")[0],
            });
          });

          // Collect sessions
          stats.sessions.sessions.forEach((session: any) => {
            allSessions.push({
              ...session,
              userId: user.id,
              userEmail: user.email,
              userName: user.name || user.email.split("@")[0],
            });
          });
        } catch (error) {
          console.error(`Failed to load data for user ${user.id}:`, error);
        }
      }

      setAllTasksData(allTasks);
      setAllSessionsData(allSessions);
    } catch (error) {
      console.error("❌ Failed to load all user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Task status distribution from real data
  const statusData = [
    {
      name: "Hoàn Thành",
      value: allTasksData.filter((t) => t.completed === true).length,
      color: "#10b981",
    },
    {
      name: "Chưa Xong",
      value: allTasksData.filter((t) => t.completed !== true).length,
      color: "#f59e0b",
    },
  ];

  // ✅ Tasks and Sessions per user from real data
  const userDataChart = users.map((user) => {
    const userTasks = allTasksData.filter((t) => t.userId === user.id);
    const userSessions = allSessionsData.filter((s) => s.userId === user.id);

    return {
      name: user.name || user.email.split("@")[0],
      tasks: userTasks.length,
      completedTasks: userTasks.filter((t) => t.completed).length,
      sessions: userSessions.length,
      completedSessions: userSessions.filter((s) => s.isCompleted).length,
      totalMinutes: userSessions
        .filter((s) => s.isCompleted)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
    };
  });

  // ✅ Daily sessions trend (last 7 days) from real data
  const getLast7DaysData = () => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const sessionsOnDay = allSessionsData.filter((session) => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= date && sessionDate < nextDate;
      });

      days.push({
        date: date.toLocaleDateString("vi-VN", {
          month: "2-digit",
          day: "2-digit",
        }),
        sessions: sessionsOnDay.length,
        completed: sessionsOnDay.filter((s) => s.isCompleted).length,
        minutes: sessionsOnDay
          .filter((s) => s.isCompleted)
          .reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
      });
    }

    return days;
  };

  const dailyData = getLast7DaysData();

  // ✅ Top performers
  const topPerformers = [...userDataChart]
    .sort((a, b) => b.completedSessions - a.completedSessions)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-effect p-4 rounded-xl border border-white/10">
          <p className="text-slate-400 text-sm mb-1">Tổng Tasks</p>
          <p className="text-3xl font-bold text-purple-400">
            {allTasksData.length}
          </p>
        </div>
        <div className="glass-effect p-4 rounded-xl border border-white/10">
          <p className="text-slate-400 text-sm mb-1">Tasks Hoàn Thành</p>
          <p className="text-3xl font-bold text-green-400">
            {allTasksData.filter((t) => t.completed).length}
          </p>
        </div>
        <div className="glass-effect p-4 rounded-xl border border-white/10">
          <p className="text-slate-400 text-sm mb-1">Tổng Sessions</p>
          <p className="text-3xl font-bold text-blue-400">
            {allSessionsData.length}
          </p>
        </div>
        <div className="glass-effect p-4 rounded-xl border border-white/10">
          <p className="text-slate-400 text-sm mb-1">Tổng Phút</p>
          <p className="text-3xl font-bold text-orange-400">
            {allSessionsData
              .filter((s) => s.isCompleted)
              .reduce((sum, s) => sum + (s.durationMinutes || 0), 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Task Status */}
        <div className="glass-effect p-6 rounded-xl border border-white/10 animate-slide-up">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Phân Bố Trạng Thái Tasks
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Tasks Per User */}
        <div
          className="glass-effect p-6 rounded-xl border border-white/10 animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <h3 className="text-lg font-semibold mb-4 text-white">
            Tasks Theo Người Dùng
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userDataChart}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="tasks" fill="#a78bfa" name="Tổng Tasks" />
              <Bar dataKey="completedTasks" fill="#10b981" name="Hoàn Thành" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart - Daily Sessions Trend */}
      <div
        className="glass-effect p-6 rounded-xl border border-white/10 animate-slide-up"
        style={{ animationDelay: "200ms" }}
      >
        <h3 className="text-lg font-semibold mb-4 text-white">
          Xu Hướng Sessions (7 Ngày Gần Đây)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="sessions"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ fill: "#06b6d4", r: 5 }}
              activeDot={{ r: 7 }}
              name="Tổng Sessions"
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: "#10b981", r: 5 }}
              activeDot={{ r: 7 }}
              name="Hoàn Thành"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart - Sessions & Minutes Per User */}
      <div
        className="glass-effect p-6 rounded-xl border border-white/10 animate-slide-up"
        style={{ animationDelay: "300ms" }}
      >
        <h3 className="text-lg font-semibold mb-4 text-white">
          Sessions & Thời Gian Theo Người Dùng
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={userDataChart}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.5)"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="sessions" fill="#3b82f6" name="Tổng Sessions" />
            <Bar
              dataKey="completedSessions"
              fill="#10b981"
              name="Sessions Hoàn Thành"
            />
            <Bar dataKey="totalMinutes" fill="#f59e0b" name="Tổng Phút" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performers Table */}
      <div
        className="glass-effect p-6 rounded-xl border border-white/10 animate-slide-up"
        style={{ animationDelay: "400ms" }}
      >
        <h3 className="text-lg font-semibold mb-4 text-white">
          🏆 Top 5 Người Dùng Xuất Sắc
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                  Hạng
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                  Người Dùng
                </th>
                <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                  Sessions
                </th>
                <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                  Tổng Phút
                </th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((user, index) => (
                <tr
                  key={user.name}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : index === 1
                          ? "bg-slate-400/20 text-slate-300"
                          : index === 2
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-white">
                    {user.name}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-blue-400 font-semibold">
                      {user.completedSessions}
                    </span>
                    <span className="text-slate-500">/{user.sessions}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-orange-400 font-semibold">
                      {user.totalMinutes}m
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

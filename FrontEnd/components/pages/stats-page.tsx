'use client';

import { useAppContext } from '@/contexts/app-context';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function StatsPage() {
  const { sessions } = useAppContext();
  const completedSessions = sessions.filter(s => s.status === 'completed');

  // Calculate statistics
  const dailyStats = {} as Record<string, number>;
  const weeklyStats = {} as Record<string, number>;
  const monthlyStats = {} as Record<string, number>;

  completedSessions.forEach(session => {
    const date = new Date(session.completedAt || session.startedAt);
    const dayKey = date.toLocaleDateString('vi-VN');
    const weekKey = `Week ${Math.ceil(date.getDate() / 7)}`;
    const monthKey = date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

    dailyStats[dayKey] = (dailyStats[dayKey] || 0) + session.duration;
    weeklyStats[weekKey] = (weeklyStats[weekKey] || 0) + session.duration;
    monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + session.duration;
  });

  const dailyData = Object.entries(dailyStats).map(([date, minutes]) => ({
    name: date,
    hours: parseFloat((minutes / 60).toFixed(2)),
  }));

  const weeklyData = Object.entries(weeklyStats).map(([week, minutes]) => ({
    name: week,
    hours: parseFloat((minutes / 60).toFixed(2)),
  }));

  const monthlyData = Object.entries(monthlyStats).map(([month, minutes]) => ({
    name: month,
    hours: parseFloat((minutes / 60).toFixed(2)),
  }));

  const taskStats = Object.entries(
    completedSessions.reduce((acc, s) => {
      acc[s.taskName] = (acc[s.taskName] || 0) + s.duration;
      return acc;
    }, {} as Record<string, number>)
  ).map(([task, minutes]) => ({
    name: task,
    value: parseFloat((minutes / 60).toFixed(2)),
  }));

  const COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#ea580c', '#ca8a04'];

  const totalHours = completedSessions.reduce((total, s) => total + s.duration, 0) / 60;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Thống kê
        </h1>
        <p className="text-gray-600">Phân tích thời gian học tập của bạn</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm mb-1">Tổng thời gian</p>
          <p className="text-3xl font-bold text-indigo-600">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm mb-1">Công việc hoàn thành</p>
          <p className="text-3xl font-bold text-purple-600">{completedSessions.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm mb-1">Trung bình/ngày</p>
          <p className="text-3xl font-bold text-pink-600">
            {(totalHours / Math.max(1, dailyData.length)).toFixed(1)}h
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm mb-1">Công việc nhiều nhất</p>
          <p className="text-3xl font-bold text-orange-600">{taskStats[0]?.name.split('').slice(0, 8).join('') || 'N/A'}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Daily Stats */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Theo ngày</h2>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Task Distribution */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Phân bố công việc</h2>
          {taskStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={taskStats} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {taskStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Weekly Stats */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Theo tuần</h2>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#7c3aed" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Monthly Stats */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Theo tháng</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#db2777" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
}

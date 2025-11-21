'use client';

import { useAdmin } from '@/contexts/admin-context';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminTasksChart() {
  const { tasks, users } = useAdmin();

  // Task status distribution
  const statusData = [
    { name: 'Hoàn Thành', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' },
    { name: 'Đang Làm', value: tasks.filter(t => t.status === 'ongoing').length, color: '#3b82f6' },
    { name: 'Bỏ Dở', value: tasks.filter(t => t.status === 'abandoned').length, color: '#ef4444' }
  ];

  // Tasks per user
  const userTaskData = users.map(user => ({
    name: user.email.split('@')[0],
    tasks: tasks.filter(t => t.userId === user.id).length,
    completed: tasks.filter(t => t.userId === user.id && t.status === 'completed').length
  }));

  // Daily tasks trend (last 7 days)
  const dailyData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }),
      tasks: Math.floor(Math.random() * 20) + 5
    };
  }).reverse();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Task Status */}
        <div className="glass-effect p-6 rounded-xl border border-white/10 animate-slide-up">
          <h3 className="text-lg font-semibold mb-4 text-white">Phân Bố Trạng Thái Công Việc</h3>
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Tasks Per User */}
        <div className="glass-effect p-6 rounded-xl border border-white/10 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-lg font-semibold mb-4 text-white">Công Việc Theo Người Dùng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userTaskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="tasks" fill="#a78bfa" name="Tổng Công Việc" />
              <Bar dataKey="completed" fill="#10b981" name="Hoàn Thành" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart - Daily Trend */}
      <div className="glass-effect p-6 rounded-xl border border-white/10 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-lg font-semibold mb-4 text-white">Xu Hướng Công Việc (7 Ngày Gần Đây)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip 
              contentStyle={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="tasks" 
              stroke="#06b6d4" 
              strokeWidth={3}
              dot={{ fill: '#06b6d4', r: 5 }}
              activeDot={{ r: 7 }}
              name="Công Việc Mới"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

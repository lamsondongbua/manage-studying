"use client";

import { useEffect, useState } from "react";
import { pomodoroHistory } from "../../services/apiServices";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDateVN, formatDateVNISO } from "../../util/date";

interface StudyStat {
  [key: string]: string | number;
  name: string;
  hours: number;
  minutes: number;
}

export default function StatsPage() {
  const [dailyData, setDailyData] = useState<StudyStat[]>([]);
  const [weeklyData, setWeeklyData] = useState<StudyStat[]>([]);
  const [monthlyData, setMonthlyData] = useState<StudyStat[]>([]);
  const [taskStats, setTaskStats] = useState<StudyStat[]>([]);
  const [showMinutes, setShowMinutes] = useState(false);
  const [totalStudyTime, setTotalStudyTime] = useState(0);

  const COLORS = ["#4f46e5", "#7c3aed", "#db2777", "#ea580c", "#ca8a04"];

  // ✅ Formatter để tránh NaN trong Tooltip
  const formatTooltipValue = (value: number) => {
    if (isNaN(value) || value === undefined || value === null) {
      return "0";
    }
    return value.toFixed(4);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessions = await pomodoroHistory();
        const now = new Date();
        const todayVNStr = formatDateVNISO(now);

        // ==================== DAILY DATA ====================
        const todaySessions = sessions.filter(
          (s) => s.completedAt && formatDateVNISO(s.completedAt) === todayVNStr
        );
        const totalMinutesToday = todaySessions.reduce(
          (sum, s) => sum + (s.duration || 0),
          0
        );

        // ✅ Pass Date object vào formatDateVN
        setDailyData([
          {
            name: formatDateVN(now),
            hours: totalMinutesToday ? totalMinutesToday / 60 : 0,
            minutes: totalMinutesToday || 0,
          },
        ]);

        // ==================== TASK STATS ====================
        const taskMap: { [key: string]: number } = {};
        todaySessions.forEach((s) => {
          taskMap[s.taskName] = (taskMap[s.taskName] || 0) + (s.duration || 0);
        });

        const mappedTasks: StudyStat[] = Object.entries(taskMap).map(
          ([name, minutes]) => ({
            name,
            hours: minutes ? minutes / 60 : 0,
            minutes: minutes || 0,
          })
        );

        mappedTasks.sort((a, b) => b.minutes - a.minutes);
        setTaskStats(mappedTasks);

        // ==================== WEEKLY DATA ====================
        const startWeek = new Date(now);
        startWeek.setDate(now.getDate() - 6);
        startWeek.setHours(0, 0, 0, 0);

        // ✅ Lưu cả Date object và minutes
        const weeklyMap: { [key: string]: { date: Date; minutes: number } } =
          {};

        for (let i = 0; i < 7; i++) {
          const d = new Date(
            startWeek.getFullYear(),
            startWeek.getMonth(),
            startWeek.getDate() + i
          );
          const key = formatDateVNISO(d);
          weeklyMap[key] = { date: d, minutes: 0 };
        }

        sessions.forEach((s) => {
          if (s.completedAt) {
            const key = formatDateVNISO(s.completedAt);
            if (weeklyMap[key]) {
              weeklyMap[key].minutes += s.duration || 0;
            }
          }
        });

        // ✅ Pass Date object vào formatDateVN
        const mappedWeekly: StudyStat[] = Object.values(weeklyMap).map(
          ({ date, minutes }) => ({
            name: formatDateVN(date),
            minutes: minutes || 0,
            hours: minutes ? minutes / 60 : 0,
          })
        );
        setWeeklyData(mappedWeekly);

        // ==================== MONTHLY DATA ====================
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthMap: { [key: string]: number } = {};

        sessions.forEach((s) => {
          if (s.completedAt) {
            const d = new Date(s.completedAt);
            if (d >= startMonth) {
              const key = `${d.getFullYear()}-${d.getMonth()}`;
              monthMap[key] = (monthMap[key] || 0) + (s.duration || 0);
            }
          }
        });

        const mappedMonthly: StudyStat[] = Object.entries(monthMap).map(
          ([key, minutes]) => {
            const [year, month] = key.split("-").map(Number);
            return {
              name: formatDateVN(new Date(year, month), {
                month: "long",
                year: "numeric",
              }),
              minutes: minutes || 0,
              hours: minutes ? minutes / 60 : 0,
            };
          }
        );
        setMonthlyData(mappedMonthly);

        // ==================== TOTAL STUDY TIME ====================
        const totalMinutes = sessions.reduce(
          (sum, s) => sum + (s.duration || 0),
          0
        );
        setTotalStudyTime(totalMinutes);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const totalHours = totalStudyTime / 60;
  const weeklyTotalMinutes = weeklyData.reduce(
    (sum, d) => sum + (d.minutes || 0),
    0
  );
  const weeklyTotalHours = weeklyTotalMinutes / 60;
  const daysWithData = weeklyData.filter((d) => d.minutes > 0).length;
  const avgHoursPerDay = daysWithData > 0 ? weeklyTotalHours / daysWithData : 0;

  const maxMinutes = taskStats.length > 0 ? taskStats[0].minutes : 0;
  const topTasks = taskStats.filter((task) => task.minutes === maxMinutes);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Thống kê</h1>
            <p className="text-gray-600 mt-2">
              Phân tích thời gian học tập của bạn
            </p>
          </div>
          <button
            onClick={() => setShowMinutes(!showMinutes)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {showMinutes ? "Hiển thị theo giờ" : "Hiển thị theo phút"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-2">Tổng thời gian</p>
            <p className="text-3xl font-bold text-indigo-600">
              {totalHours.toFixed(3)}h
            </p>
            <p className="text-xs text-gray-500 mt-1">Từ khi bắt đầu</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-2">Công việc hoàn thành</p>
            <p className="text-3xl font-bold text-green-600">
              {taskStats.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Hôm nay</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-2">Trung bình/ngày</p>
            <p className="text-3xl font-bold text-indigo-600">
              {avgHoursPerDay.toFixed(5)}h
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Tuần này ({daysWithData} ngày học)
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-2">
              {topTasks.length > 1
                ? "Công việc nhiều nhất (ngang nhau)"
                : "Công việc nhiều nhất"}
            </p>
            {topTasks.length > 0 ? (
              <div className="space-y-1">
                {topTasks.map((task, index) => (
                  <p
                    key={index}
                    className="text-lg font-bold text-purple-600 truncate"
                    title={task.name}
                  >
                    {task.name}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xl font-bold text-gray-400">N/A</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Theo ngày</h2>
            {dailyData.length > 0 && dailyData[0].minutes > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={formatTooltipValue} />
                  <Bar
                    dataKey={showMinutes ? "minutes" : "hours"}
                    fill="#4f46e5"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Chưa có dữ liệu hôm nay
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Phân bố công việc hôm nay ({showMinutes ? "phút" : "giờ"})
            </h2>
            {taskStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskStats}
                    dataKey={showMinutes ? "minutes" : "hours"}
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {taskStats.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatTooltipValue} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Chưa có dữ liệu
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Theo tuần</h2>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={formatTooltipValue} />
                  <Line
                    type="monotone"
                    dataKey={showMinutes ? "minutes" : "hours"}
                    stroke="#4f46e5"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Chưa có dữ liệu
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Theo tháng</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={formatTooltipValue} />
                  <Line
                    type="monotone"
                    dataKey={showMinutes ? "minutes" : "hours"}
                    stroke="#4f46e5"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

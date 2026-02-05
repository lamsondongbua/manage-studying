"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/contexts/admin-context";
import {
  CheckSquare,
  Clock,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import instance from "@/util/axiosCustomize";
import { createTaskForUser, deleteTaskForUser, getUserStatistics, updateTaskForUser } from "@/services/apiServices";

interface AllTasksData {
  _id: string;
  title: string;
  description: string;
  duration: number;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  user: string;
  userName: string;
  userEmail: string;
}

interface AllSessionsData {
  id: string;
  taskName: string;
  durationMinutes: number;
  startTime: string;
  endTime?: string;
  isCompleted: boolean;
  user: string;
  userName: string;
  userEmail: string;
}

export default function AdminAllDataPage() {
  const { users } = useAdmin();
  const [activeTab, setActiveTab] = useState<"tasks" | "sessions">("tasks");
  const [loading, setLoading] = useState(true);

  // Tasks state
  const [allTasks, setAllTasks] = useState<AllTasksData[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<AllTasksData[]>([]);
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [taskFilterStatus, setTaskFilterStatus] = useState<
    "all" | "completed" | "incomplete"
  >("all");

  // Sessions state
  const [allSessions, setAllSessions] = useState<AllSessionsData[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<AllSessionsData[]>(
    []
  );
  const [sessionSearchTerm, setSessionSearchTerm] = useState("");
  const [sessionFilterStatus, setSessionFilterStatus] = useState<
    "all" | "completed" | "incomplete"
  >("all");

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<AllTasksData | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    duration: 25,
    dueDate: "",
    userId: "",
  });

  // Load all data
  useEffect(() => {
    loadAllData();
  }, [users]);

  // Filter tasks
  useEffect(() => {
    let filtered = [...allTasks];

    if (taskSearchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
          task.userName.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
          task.userEmail.toLowerCase().includes(taskSearchTerm.toLowerCase())
      );
    }

    if (taskFilterStatus === "completed") {
      filtered = filtered.filter((task) => task.completed === true);
    } else if (taskFilterStatus === "incomplete") {
      filtered = filtered.filter((task) => task.completed !== true);
    }

    setFilteredTasks(filtered);
  }, [allTasks, taskSearchTerm, taskFilterStatus]);

  // Filter sessions
  useEffect(() => {
    let filtered = [...allSessions];

    if (sessionSearchTerm) {
      filtered = filtered.filter(
        (session) =>
          session.taskName
            .toLowerCase()
            .includes(sessionSearchTerm.toLowerCase()) ||
          session.userName
            .toLowerCase()
            .includes(sessionSearchTerm.toLowerCase()) ||
          session.userEmail
            .toLowerCase()
            .includes(sessionSearchTerm.toLowerCase())
      );
    }

    if (sessionFilterStatus === "completed") {
      filtered = filtered.filter((session) => session.isCompleted === true);
    } else if (sessionFilterStatus === "incomplete") {
      filtered = filtered.filter((session) => session.isCompleted !== true);
    }

    setFilteredSessions(filtered);
  }, [allSessions, sessionSearchTerm, sessionFilterStatus]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const tasks: AllTasksData[] = [];
      const sessions: AllSessionsData[] = [];

      for (const user of users) {
        try {
          const stats = await getUserStatistics(user.id);

          stats.tasks.tasks.forEach((task: any) => {
            tasks.push({
              ...task,
              user: user.id,
              userName: user.name || user.email.split("@")[0],
              userEmail: user.email,
            });
          });

          stats.sessions.sessions.forEach((session: any) => {
            sessions.push({
              ...session,
              user: user.id,
              userName: user.name || user.email.split("@")[0],
              userEmail: user.email,
            });
          });
        } catch (error) {
          console.error(`Failed to load data for user ${user.id}:`, error);
        }
      }

      setAllTasks(
        tasks.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setAllSessions(
        sessions.sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )
      );
    } catch (error) {
      console.error("❌ Failed to load all data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.userId) {
      alert("Vui lòng chọn người dùng!");
      return;
    }

    try {
      // ✅ GỌI API QUA SERVICE
      await createTaskForUser({
        userId: taskForm.userId,
        title: taskForm.title,
        description: taskForm.description,
        duration: taskForm.duration,
        dueDate: taskForm.dueDate,
      });

      alert("Tạo task thành công!");
      setShowTaskForm(false);
      setTaskForm({
        title: "",
        description: "",
        duration: 25,
        dueDate: "",
        userId: "",
      });
      await loadAllData();
    } catch (error: any) {
      console.error("❌ Failed to create task:", error);
      alert(
        `Không thể tạo task: ${error.response?.data?.msg || error.message}`
      );
    }
  };

  // ✅ SỬA HÀM UPDATE
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      await updateTaskForUser(editingTask._id, {
        title: taskForm.title,
        description: taskForm.description,
        duration: taskForm.duration,
        dueDate: taskForm.dueDate,
      });

      alert("Cập nhật task thành công!");
      setEditingTask(null);
      setShowTaskForm(false);
      setTaskForm({
        title: "",
        description: "",
        duration: 25,
        dueDate: "",
        userId: "",
      });
      await loadAllData();
    } catch (error: any) {
      console.error("❌ Failed to update task:", error);
      alert(
        `Không thể cập nhật task: ${error.response?.data?.msg || error.message}`
      );
    }
  };

  // ✅ SỬA HÀM DELETE
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa task này?")) return;

    try {
      await deleteTaskForUser(taskId);
      alert("Xóa task thành công!");
      await loadAllData();
    } catch (error: any) {
      console.error("❌ Failed to delete task:", error);
      alert(
        `Không thể xóa task: ${error.response?.data?.msg || error.message}`
      );
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa session này?")) return;

    try {
      await instance.delete(`/api/pomodoro/admin/session/${sessionId}`);
      alert("Xóa session thành công!");
      await loadAllData();
    } catch (error: any) {
      console.error("❌ Failed to delete session:", error);
      alert(
        `Không thể xóa session: ${error.response?.data?.msg || error.message}`
      );
    }
  };

  const handleEditTask = (task: AllTasksData) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      duration: task.duration || 25,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      userId: task.user,
    });
    setShowTaskForm(true);
  };

  const handleCancelForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    setTaskForm({
      title: "",
      description: "",
      duration: 25,
      dueDate: "",
      userId: "",
    });
  };

  const stats = {
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter((t) => t.completed).length,
    totalSessions: allSessions.length,
    completedSessions: allSessions.filter((s) => s.isCompleted).length,
    totalMinutes: allSessions
      .filter((s) => s.isCompleted)
      .reduce((sum, s) => sum + s.durationMinutes, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-effect p-4 rounded-xl border border-white/10">
          <p className="text-slate-400 text-sm mb-1">Tổng Tasks</p>
          <p className="text-3xl font-bold text-purple-400">
            {stats.totalTasks}
          </p>
        </div>
        <div className="glass-effect p-4 rounded-xl border border-white/10">
          <p className="text-slate-400 text-sm mb-1">Tổng Sessions</p>
          <p className="text-3xl font-bold text-blue-400">
            {stats.totalSessions}
          </p>
        </div>
        <div className="glass-effect p-4 rounded-xl border border-white/10">
          <p className="text-slate-400 text-sm mb-1">Sessions Hoàn Thành</p>
          <p className="text-3xl font-bold text-cyan-400">
            {stats.completedSessions}
          </p>
        </div>
        <div className="glass-effect p-4 rounded-xl border border-white/10">
          <p className="text-slate-400 text-sm mb-1">Tổng Phút</p>
          <p className="text-3xl font-bold text-orange-400">
            {stats.totalMinutes}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
            activeTab === "tasks"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CheckSquare size={18} />
          Tasks ({filteredTasks.length})
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
            activeTab === "sessions"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Clock size={18} />
          Sessions ({filteredSessions.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-3 flex-1 w-full md:w-auto">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Tìm task hoặc người dùng..."
                      value={taskSearchTerm}
                      onChange={(e) => setTaskSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Filter */}
                  <select
                    value={taskFilterStatus}
                    onChange={(e) => setTaskFilterStatus(e.target.value as any)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">Tất cả</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="incomplete">Chưa xong</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={loadAllData}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
                  >
                    <RefreshCw size={18} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white font-semibold"
                  >
                    <Plus size={18} />
                    Thêm Task
                  </button>
                </div>
              </div>

              {/* Task Form Modal */}
              {showTaskForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-slate-800 rounded-xl border border-white/10 p-6 max-w-md w-full">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      {editingTask ? "Chỉnh Sửa Task" : "Tạo Task Mới"}
                    </h3>
                    <form
                      onSubmit={
                        editingTask ? handleUpdateTask : handleCreateTask
                      }
                      className="space-y-4"
                    >
                      {!editingTask && (
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Người dùng *
                          </label>
                          <select
                            value={taskForm.userId}
                            onChange={(e) =>
                              setTaskForm({
                                ...taskForm,
                                userId: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                            required
                          >
                            <option value="">-- Chọn người dùng --</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name || user.email}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Tiêu đề *
                        </label>
                        <input
                          type="text"
                          value={taskForm.title}
                          onChange={(e) =>
                            setTaskForm({ ...taskForm, title: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Mô tả
                        </label>
                        <textarea
                          value={taskForm.description}
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Thời lượng (phút)
                          </label>
                          <input
                            type="number"
                            value={taskForm.duration}
                            onChange={(e) =>
                              setTaskForm({
                                ...taskForm,
                                duration: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Hạn chót
                          </label>
                          <input
                            type="date"
                            value={taskForm.dueDate}
                            onChange={(e) =>
                              setTaskForm({
                                ...taskForm,
                                dueDate: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <Save size={16} />
                          {editingTask ? "Cập nhật" : "Tạo"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelForm}
                          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-semibold transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Tasks Table */}
              <div className="glass-effect rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                          Tiêu đề
                        </th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                          Người dùng
                        </th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                          Thời lượng
                        </th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                          Hạn chót
                        </th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                          Trạng thái
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-semibold">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                          <tr
                            key={task._id}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="font-medium text-white">
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-xs text-slate-400 mt-1 truncate max-w-xs">
                                  {task.description}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-slate-400" />
                                <div>
                                  <div className="text-white text-sm">
                                    {task.userName}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {task.userEmail}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {task.duration || 0}m
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString(
                                    "vi-VN"
                                  )
                                : "-"}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                  task.completed
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {task.completed ? "Hoàn thành" : "Chưa xong"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit size={16} className="text-blue-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 size={16} className="text-red-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center text-slate-400"
                          >
                            <AlertCircle
                              size={48}
                              className="mx-auto mb-4 opacity-50"
                            />
                            <p>Không tìm thấy task nào</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-3 flex-1 w-full md:w-auto">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Tìm session hoặc người dùng..."
                      value={sessionSearchTerm}
                      onChange={(e) => setSessionSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Filter */}
                  <select
                    value={sessionFilterStatus}
                    onChange={(e) =>
                      setSessionFilterStatus(e.target.value as any)
                    }
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">Tất cả</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="incomplete">Chưa xong</option>
                  </select>
                </div>

                <button
                  onClick={loadAllData}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
              </div>

              {/* Sessions Table */}
              <div className="glass-effect rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                          Tên task
                        </th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                          Người dùng
                        </th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                          Thời lượng
                        </th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                          Bắt đầu
                        </th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                          Trạng thái
                        </th>
                        <th className="text-center py-3 px-4 text-slate-400 font-semibold">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.length > 0 ? (
                        filteredSessions.map((session) => (
                          <tr
                            key={session.id}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="font-medium text-white">
                                {session.taskName}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-slate-400" />
                                <div>
                                  <div className="text-white text-sm">
                                    {session.userName}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {session.userEmail}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {session.durationMinutes}m
                            </td>
                            <td className="py-3 px-4 text-slate-300 text-xs">
                              {new Date(session.startTime).toLocaleString(
                                "vi-VN"
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                  session.isCompleted
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {session.isCompleted
                                  ? "Hoàn thành"
                                  : "Chưa xong"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() =>
                                    handleDeleteSession(session.id)
                                  }
                                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 size={16} className="text-red-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center text-slate-400"
                          >
                            <AlertCircle
                              size={48}
                              className="mx-auto mb-4 opacity-50"
                            />
                            <p>Không tìm thấy session nào</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAdmin } from "@/contexts/admin-context";
import {
  Shield,
  Check,
  Trash2,
  Edit,
  AlertCircle,
  X,
  Save,
  Eye,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { formatDateVN } from "../../util/date";
import { getUserStatistics } from "@/services/apiServices";

interface UserStatistics {
  tasks: {
    tasks: any[];
    completed: any[];
    incomplete: any[];
    stats: {
      total: number;
      completed: number;
      incomplete: number;
    };
  };
  sessions: {
    sessions: any[];
    completed: any[];
    incomplete: any[];
    stats: {
      total: number;
      completed: number;
      incomplete: number;
      totalMinutes: number;
    };
  };
}

export default function AdminUsersTable() {
  const { users, updateUserStatus, deleteUser, updateUser, loading } =
    useAdmin();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    role: "user",
  });

  // ✅ NEW: Statistics Modal State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "inactive":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "suspended":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const handleStatusChange = async (
    userId: string,
    newStatus: "active" | "inactive" | "suspended"
  ) => {
    try {
      setActionLoading(userId);
      await updateUserStatus(userId, newStatus);
      console.log(`✅ Status updated successfully for user ${userId}`);
    } catch (error: any) {
      console.error("❌ Failed to update status:", error);
      alert(
        `Không thể cập nhật trạng thái: ${error.message}\nKiểm tra console để xem chi tiết`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setActionLoading(userId);
      await deleteUser(userId);
      setShowDeleteConfirm(null);
      console.log(`✅ User ${userId} deleted successfully`);
    } catch (error: any) {
      console.error("❌ Failed to delete user:", error);
      alert(`Không thể xóa người dùng: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (user: any) => {
    setSelectedUserId(user.id || user._id);
    setEditFormData({
      username: user.name || user.username || "",
      email: user.email || "",
      role: user.role || "user",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      setActionLoading(selectedUserId);
      await updateUser(selectedUserId, editFormData);
      console.log(`✅ User ${selectedUserId} updated successfully`);
      setSelectedUserId(null);
      alert("Cập nhật người dùng thành công!");
    } catch (error: any) {
      console.error("❌ Failed to update user:", error);
      alert(`Không thể cập nhật người dùng: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ NEW: Handle view statistics
  const handleViewStats = async (userId: string, userName: string) => {
    try {
      setStatsLoading(true);
      setShowStatsModal(true);
      setSelectedUserName(userName);
      setUserStats(null);

      const stats = await getUserStatistics(userId);
      setUserStats(stats);
      console.log("📊 User statistics loaded:", stats);
    } catch (error: any) {
      console.error("❌ Failed to load statistics:", error);
      alert(`Không thể tải thống kê: ${error.message}`);
      setShowStatsModal(false);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-effect p-6 rounded-xl border border-white/10 overflow-x-auto animate-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Danh Sách Người Dùng ({users.length})
          </h3>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
              Đang tải...
            </div>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">
                Username
              </th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">
                Email
              </th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">
                Role
              </th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">
                Status
              </th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">
                Tasks
              </th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">
                Created At
              </th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const userId = user.id || index.toString();
              const userName = user.name || user.email.split("@")[0];

              return (
                <tr
                  key={userId}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="py-4 px-4">
                    <div className="font-medium text-white">{userName}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-slate-300">{user.email}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {user.role === "admin" && (
                        <Shield size={12} className="mr-1" />
                      )}
                      {user.role || "user"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status === "active" && (
                        <Check size={14} className="mr-1" />
                      )}
                      {user.status === "active"
                        ? "Hoạt Động"
                        : user.status === "inactive"
                        ? "Không Hoạt Động"
                        : "Bị Khóa"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleViewStats(userId, userName)}
                      className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors duration-200 group"
                    >
                      <Eye
                        size={14}
                        className="text-purple-400 group-hover:scale-110 transition-transform"
                      />
                    </button>
                  </td>
                  <td className="py-4 px-4 text-slate-400 text-xs">
                    {formatDateVN(user.createdAt)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 hover:scale-110"
                        title="Chỉnh sửa"
                        disabled={actionLoading === userId}
                      >
                        <Edit size={16} className="text-blue-400" />
                      </button>

                      {/* Status Dropdown */}
                      <select
                        value={user.status}
                        onChange={(e) =>
                          handleStatusChange(userId, e.target.value as any)
                        }
                        className="px-2 py-1 bg-slate-700 rounded text-sm border border-slate-600 text-white cursor-pointer hover:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={actionLoading === userId}
                      >
                        <option value="active">Hoạt Động</option>
                        <option value="inactive">Không Hoạt Động</option>
                        <option value="suspended">Bị Khóa</option>
                      </select>

                      {/* Delete Button */}
                      {showDeleteConfirm === userId ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(userId)}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs text-red-400 transition-colors"
                            disabled={actionLoading === userId}
                          >
                            {actionLoading === userId ? "..." : "Xác nhận"}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-2 py-1 bg-slate-600/50 hover:bg-slate-600/70 rounded text-xs text-slate-300 transition-colors"
                            disabled={actionLoading === userId}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(userId)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Xóa"
                          disabled={actionLoading === userId}
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      )}

                      {/* Loading Indicator */}
                      {actionLoading === userId && (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>Không có người dùng nào</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-effect p-6 rounded-xl border border-white/10 max-w-md w-full mx-4 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Edit size={20} className="text-blue-400" />
                Chỉnh Sửa Người Dùng
              </h3>
              <button
                onClick={() => setSelectedUserId(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                disabled={actionLoading === selectedUserId}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tên người dùng
                </label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      username: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Nhập tên người dùng"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Nhập email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Vai trò
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={actionLoading === selectedUserId}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === selectedUserId ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserId(null)}
                  disabled={actionLoading === selectedUserId}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ NEW: Statistics Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="glass-effect p-6 rounded-xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Eye size={20} className="text-purple-400" />
                Thống Kê Của {selectedUserName}
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {statsLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-slate-400">Đang tải thống kê...</p>
              </div>
            ) : userStats ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-lg border border-purple-500/30">
                    <div className="text-slate-400 text-xs mb-1">
                      Tổng Tasks
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {userStats.tasks.stats.total}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-lg border border-blue-500/30">
                    <div className="text-slate-400 text-xs mb-1">
                      Tổng Sessions
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {userStats.sessions.stats.total}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-4 rounded-lg border border-orange-500/30">
                    <div className="text-slate-400 text-xs mb-1">Tổng Phút</div>
                    <div className="text-2xl font-bold text-white">
                      {userStats.sessions.stats.totalMinutes}
                    </div>
                  </div>
                </div>

                {/* Tasks Section */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-400" />
                    Tasks ({userStats.tasks.stats.total})
                  </h4>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          Hoàn thành
                        </div>
                        <div className="text-lg font-semibold text-green-400">
                          {userStats.tasks.stats.completed}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          Chưa hoàn thành
                        </div>
                        <div className="text-lg font-semibold text-yellow-400">
                          {userStats.tasks.stats.incomplete}
                        </div>
                      </div>
                    </div>

                    {userStats.tasks.tasks.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userStats.tasks.tasks.slice(0, 5).map((task: any) => (
                          <div
                            key={task._id}
                            className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-white/5"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  task.completed
                                    ? "bg-green-400"
                                    : "bg-yellow-400"
                                }`}
                              />
                              <span className="text-sm text-slate-200 truncate">
                                {task.title}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {task.duration || 0}m
                            </span>
                          </div>
                        ))}
                        {userStats.tasks.tasks.length > 5 && (
                          <div className="text-center text-xs text-slate-400 pt-2">
                            + {userStats.tasks.tasks.length - 5} tasks khác
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-sm">
                        Chưa có tasks nào
                      </div>
                    )}
                  </div>
                </div>

                {/* Sessions Section */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock size={18} className="text-blue-400" />
                    Pomodoro Sessions ({userStats.sessions.stats.total})
                  </h4>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          Hoàn thành
                        </div>
                        <div className="text-lg font-semibold text-green-400">
                          {userStats.sessions.stats.completed}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          Chưa hoàn thành
                        </div>
                        <div className="text-lg font-semibold text-yellow-400">
                          {userStats.sessions.stats.incomplete}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          Tổng thời gian
                        </div>
                        <div className="text-lg font-semibold text-purple-400">
                          {userStats.sessions.stats.totalMinutes}m
                        </div>
                      </div>
                    </div>

                    {userStats.sessions.sessions.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userStats.sessions.sessions
                          .slice(0, 5)
                          .map((session: any) => (
                            <div
                              key={session._id}
                              className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-white/5"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    session.isCompleted
                                      ? "bg-green-400"
                                      : "bg-yellow-400"
                                  }`}
                                />
                                <span className="text-sm text-slate-200 truncate">
                                  {session.taskName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  {session.durationMinutes}m
                                </span>
                                <Calendar
                                  size={12}
                                  className="text-slate-500"
                                />
                              </div>
                            </div>
                          ))}
                        {userStats.sessions.sessions.length > 5 && (
                          <div className="text-center text-xs text-slate-400 pt-2">
                            + {userStats.sessions.sessions.length - 5} sessions
                            khác
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-sm">
                        Chưa có sessions nào
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>Không thể tải thống kê</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowStatsModal(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { AdminUser, TaskRecord, UserStatistics } from "@/types/admin";
import {
  getAllUser,
  pomodoroAdminAllSessions,
  pomodoroHistory,
  updateUserStatus as apiUpdateUserStatus,
  deleteUser as apiDeleteUser,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
} from "@/services/apiServices";
import { Session } from "@/types";

interface AdminContextType {
  users: AdminUser[];
  tasks: TaskRecord[];
  adminSessions?: any[];
  loading: boolean;
  error: string | null;
  completedCount: number;
  totalCompletedSessions: number;
  totalFocusMinutes: number;
  updateUserStatus: (
    userId: string,
    status: "active" | "inactive" | "suspended"
  ) => Promise<void>;
  getUserTasks: (userId: string) => TaskRecord[];
  deleteUser: (userId: string) => Promise<void>;
  createUser: (data: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) => Promise<void>;
  updateUser: (
    userId: string,
    data: {
      username?: string;
      email?: string;
      password?: string;
      role?: string;
    }
  ) => Promise<void>;
  refreshUsers: () => Promise<void>;
  getUserStatistics: (userId: string) => Promise<UserStatistics>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminSessions, setAdminSessions] = useState<Session[]>([]);
  const [totalCompletedSessions, setTotalCompletedSessions] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);

  const reduxUser = useSelector((state: RootState) => state.user);

  // Load admin sessions
  useEffect(() => {
    async function loadAdminSessions() {
      if (!reduxUser.loggedIn || reduxUser.role !== "admin") return;

      try {
        const sessions = await pomodoroAdminAllSessions();
        setAdminSessions(sessions);

        const completed = sessions.filter((s) => s.isCompleted);
        setTotalCompletedSessions(completed.length);

        console.log("📌 Admin loaded all sessions:", sessions);
      } catch (err) {
        console.error("❌ Admin load sessions failed:", err);
      }
    }

    loadAdminSessions();
  }, [reduxUser.loggedIn, reduxUser.role]);

  // Load personal stats
  useEffect(() => {
    async function loadStats() {
      if (!reduxUser.loggedIn || !reduxUser.accessToken) {
        return;
      }

      try {
        const history = await pomodoroHistory();

        if (!Array.isArray(history)) {
          console.warn("⚠️ History không phải là mảng:", history);
          return;
        }

        const completedSessions = history.filter((s) => s.isCompleted === true);
        const totalMinutes = completedSessions.reduce((total, session) => {
          return total + (session.duration || 0);
        }, 0);

        setCompletedCount(completedSessions.length);
        setTotalFocusMinutes(totalMinutes);

        console.log("✅ Thống kê đã cập nhật:", {
          count: completedSessions.length,
          minutes: totalMinutes,
        });
      } catch (error) {
        console.error("❌ Lỗi khi tải thống kê Pomodoro:", error);
      }
    }

    loadStats();
  }, [reduxUser.loggedIn, reduxUser.accessToken]);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!reduxUser.loggedIn || !reduxUser.accessToken) {
        console.log("⏳ [AdminProvider] Waiting for user authentication...");
        setLoading(false);
        return;
      }

      if (reduxUser.role !== "admin") {
        console.log(
          "⛔ [AdminProvider] User is not admin, skipping getAllUser"
        );
        setLoading(false);
        setError("Access denied. Admin privileges required.");
        return;
      }

      console.log("✅ [AdminProvider] User is admin, fetching all users...");
      const res = await getAllUser();

      console.log("📋 [AdminProvider] Fetch result:", res);

      if (res && res.users) {
        setUsers(res.users);
        localStorage.setItem("adminUsers", JSON.stringify(res.users));
      }
    } catch (err: any) {
      console.error("❌ [AdminProvider] Fetch users failed:", err);

      if (err.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
      } else {
        setError(err.response?.data?.msg || "Failed to fetch users");
      }

      // fallback localStorage
      const saved = localStorage.getItem("adminUsers");
      if (saved) {
        console.log("📦 [AdminProvider] Loading users from localStorage");
        setUsers(JSON.parse(saved));
      }
    } finally {
      // load tasks
      const savedTasks = localStorage.getItem("adminTasks");
      if (savedTasks) setTasks(JSON.parse(savedTasks));

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [reduxUser.loggedIn, reduxUser.accessToken, reduxUser.role]);

  // ✅ Update user status via API
  const updateUserStatus = async (
    userId: string,
    status: "active" | "inactive" | "suspended"
  ) => {
    try {
      setLoading(true);
      await apiUpdateUserStatus(userId, status);

      // Refresh users list after update
      await fetchUsers();

      console.log(`✅ User ${userId} status updated to ${status}`);
    } catch (err: any) {
      console.error("❌ Update user status failed:", err);
      setError(err.response?.data?.msg || "Failed to update user status");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete user via API
  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      await apiDeleteUser(userId);

      // Remove from local state immediately
      const updated = users.filter((u) => u.id !== userId);
      setUsers(updated);
      localStorage.setItem("adminUsers", JSON.stringify(updated));

      console.log(`✅ User ${userId} deleted successfully`);
    } catch (err: any) {
      console.error("❌ Delete user failed:", err);
      setError(err.response?.data?.msg || "Failed to delete user");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Create user via API
  const createUser = async (data: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    try {
      setLoading(true);
      await apiCreateUser(data);

      // Refresh users list after creation
      await fetchUsers();

      console.log(`✅ User created successfully`);
    } catch (err: any) {
      console.error("❌ Create user failed:", err);
      setError(err.response?.data?.msg || "Failed to create user");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update user via API
  const updateUser = async (
    userId: string,
    data: {
      username?: string;
      email?: string;
      password?: string;
      role?: string;
    }
  ) => {
    try {
      setLoading(true);
      await apiUpdateUser(userId, data);

      // Refresh users list after update
      await fetchUsers();

      console.log(`✅ User ${userId} updated successfully`);
    } catch (err: any) {
      console.error("❌ Update user failed:", err);
      setError(err.response?.data?.msg || "Failed to update user");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserTasks = (userId: string) => {
    return tasks.filter((t) => t.userId === userId);
  };

  // ✅ Refresh users function
  const refreshUsers = async () => {
    await fetchUsers();
  };

  const getUserStatistics = async (userId: string): Promise<UserStatistics> => {
    try {
      const data = await getUserStatistics(userId);
      return data;
    } catch (err: any) {
      console.error("❌ Failed to get user statistics:", err);
      throw err;
    }
  };

  return (
    <AdminContext.Provider
      value={{
        users,
        tasks,
        loading,
        error,
        completedCount,
        totalFocusMinutes,
        updateUserStatus,
        getUserTasks,
        adminSessions,
        totalCompletedSessions,
        deleteUser,
        createUser,
        updateUser,
        refreshUsers,
        getUserStatistics
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within AdminProvider");
  return context;
}

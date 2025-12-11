"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux"; // ✅ Import useSelector
import { RootState } from "@/redux/store"; // ✅ Import RootState
import { AdminUser, TaskRecord } from "@/types/admin";
import { getAllUser, pomodoroHistory } from "@/services/apiServices";

interface AdminContextType {
  users: AdminUser[];
  tasks: TaskRecord[];
  loading: boolean;
  error: string | null;
  completedCount: number; // ✅ thêm dòng này
  updateUserStatus: (userId: string, status: "active" | "inactive") => void;
  getUserTasks: (userId: string) => TaskRecord[];
  deleteUser: (userId: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Lấy user từ Redux thay vì AuthContext
  const reduxUser = useSelector((state: RootState) => state.user);


  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    async function load() {
      const sessions = await pomodoroHistory();
      console.log("Số session trong lịch sử: ",sessions);
      const completed = sessions.filter((s) => s.status === 'completed');
      setCompletedCount(completed.length);
      console.log(completed.length);
      console.log('completedCount:', completedCount);
    }
    load();
  }, []);


  // 📌 Fetch từ backend - CHỈ KHI LÀ ADMIN
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);

        // ✅ KIỂM TRA USER TỪ REDUX
        if (!reduxUser.loggedIn || !reduxUser.accessToken) {
          console.log("⏳ [AdminProvider] Waiting for user authentication...");
          setLoading(false);
          return;
        }

        // ✅ KIỂM TRA ROLE
        if (reduxUser.role !== "admin") {
          console.log(
            "⛔ [AdminProvider] User is not admin, skipping getAllUser"
          );
          setLoading(false);
          setError("Access denied. Admin privileges required.");
          return;
        }

        // ✅ CHỈ GỌI API NẾU LÀ ADMIN
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
    }

    fetchUsers();
  }, [reduxUser.loggedIn, reduxUser.accessToken, reduxUser.role]); // ✅ Dependencies

  const updateUserStatus = (userId: string, status: "active" | "inactive") => {
    const updated = users.map((u) => (u.id === userId ? { ...u, status } : u));
    setUsers(updated);
    localStorage.setItem("adminUsers", JSON.stringify(updated));
  };

  const getUserTasks = (userId: string) => {
    return tasks.filter((t) => t.userId === userId);
  };

  const deleteUser = (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    localStorage.setItem("adminUsers", JSON.stringify(updated));
  };

  return (
    <AdminContext.Provider
      value={{
        users,
        tasks,
        loading,
        error,
        completedCount, // ✅ thêm dòng này vào
        updateUserStatus,
        getUserTasks,
        deleteUser,
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

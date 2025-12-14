"use client";

import { useState } from "react";
import { useAdmin } from "@/contexts/admin-context";
import AdminUsersTable from "./admin-users-table";
import AdminTasksChart from "./admin-tasks-chart";
import AdminStats from "./admin-stats";
import AdminAllDataPage from "./admin-all-data-page"; // ✅ Import component mới
import { BarChart3, Users, LayoutGrid, Database } from "lucide-react";

export default function AdminPage() {
  const { users, tasks } = useAdmin();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "charts" | "data"
  >("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-orange-400 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-400">
          Quản lý người dùng, công việc và thống kê toàn hệ thống
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-4 mb-8 flex-wrap">
        {[
          { id: "overview", label: "Tổng Quan", icon: LayoutGrid },
          { id: "users", label: "Người Dùng", icon: Users },
          { id: "charts", label: "Biểu Đồ", icon: BarChart3 },
          { id: "data", label: "Quản Lý Dữ Liệu", icon: Database }, // ✅ Tab mới
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/50"
                : "bg-slate-700/50 hover:bg-slate-600/50"
            }`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-slide-up">
        {activeTab === "overview" && <AdminStats />}
        {activeTab === "users" && <AdminUsersTable />}
        {activeTab === "charts" && <AdminTasksChart />}
        {activeTab === "data" && <AdminAllDataPage />} {/* ✅ Component mới */}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app-context";
import "./sidebar.css";

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: any) => void;
  user: any;
  onLogout: () => void;
}

export default function Sidebar({
  currentPage,
  setCurrentPage,
  user,
  onLogout,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { cleanupActiveSession, isRunning, activeSessionId } = useAppContext();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "countdown", label: "Countdown", icon: "⏱️" },
    { id: "stats", label: "Thống kê", icon: "📈" },
    { id: "settings", label: "Cài đặt", icon: "⚙️" },
    { id: "admin", label: "Admin", icon: "🔧" },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      if (isRunning && activeSessionId) {
        const confirmed = window.confirm(
          "Bạn đang có session đang chạy. Session sẽ được tạm dừng khi đăng xuất. Tiếp tục?"
        );

        if (!confirmed) {
          setIsLoggingOut(false);
          return;
        }

        console.log("⏸️ Pausing active session before logout...");
        await cleanupActiveSession();
      }

      onLogout();

      console.log("✅ Logged out successfully");
    } catch (err) {
      console.error("❌ Logout error:", err);

      onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-gradient-to-b from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-900 dark:via-indigo-900 dark:to-blue-900 text-white transition-all duration-500 flex flex-col border-r border-white/10 animate-slide-in-left shadow-lg-soft`}
    >
      <div className="p-4 border-b border-white/20 flex items-center justify-between backdrop-blur-sm">
        {isOpen && (
          <h1 className="font-bold text-xl bg-gradient-to-r from-cyan-200 to-purple-200 bg-clip-text text-transparent animate-fade-in">
            StudyFlow
          </h1>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-white/20 rounded-lg transition-all active:scale-95 duration-200"
        >
          {isOpen ? "✕" : "≡"}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
              currentPage === item.id
                ? "bg-white/25 border border-white/40 shadow-lg backdrop-blur-md animate-pulse-glow"
                : "hover:bg-white/15 border border-transparent"
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="text-xl">{item.icon}</span>
            {isOpen && (
              <span className="text-sm font-semibold">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-white/20 p-4 space-y-3 animate-slide-up backdrop-blur-sm">
        {isOpen && (
          <div className="text-sm animate-fade-in">
            <p className="text-white/70 text-xs uppercase tracking-wider">
              Đang đăng nhập
            </p>
            <p className="font-bold text-white truncate mt-1">
              {user?.name || user?.email}
            </p>

            {isRunning && (
              <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-green-500/20 border border-green-400/30 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-200 font-medium">
                  Timer đang chạy
                </span>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 font-semibold transition-all active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <>{isOpen ? "⏳ Đang đăng xuất..." : "⏳"}</>
          ) : (
            <>{isOpen ? "🚪 Đăng xuất" : "🚪"}</>
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/reducer+action/userSlice";
import Sidebar from "@/components/layout/sidebar";
import Dashboard from "@/components/pages/dashboard";
import CountdownPage from "@/components/pages/countdown-page";
import StatsPage from "@/components/pages/stats-page";
import { AdminProvider } from "@/contexts/admin-context";
import AdminPage from "@/components/admin/admin-page";
import Settings from "./pages/settings";
import { MusicLibrary } from "@/components/music/music-library";

interface MainAppProps {
  user: any;
  setUser: (user: any) => void;
}

type PageType =
  | "dashboard"
  | "countdown"
  | "stats"
  | "settings"
  | "admin"
  | "music";

export default function MainApp({ user, setUser }: MainAppProps) {
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const dispatch = useDispatch();

  const handleLogout = () => {
    console.log("🚪 [MainApp] Logging out");

    // ✅ Dispatch logout action để clear Redux state
    dispatch(logout());

    // ✅ Clear React state
    setUser(null);
  };

  return (
    <AdminProvider>
      <div className="flex h-screen bg-background">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-auto">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "countdown" && <CountdownPage />}
          {currentPage === "stats" && <StatsPage />}
          {currentPage === "settings" && <Settings />}
          {currentPage === "admin" && <AdminPage />}
          {currentPage === "music" && (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6 pb-32">
              <div className="max-w-6xl">
                <MusicLibrary />
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminProvider>
  );
}

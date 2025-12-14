"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { AppProvider } from "@/contexts/app-context";
import AuthPage from "@/components/auth/auth-page";
import MainApp from "@/components/main-app";
import { toast } from "react-toastify";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Lấy user từ Redux store
  const reduxUser = useSelector((state: RootState) => state.user);

  useEffect(() => {
    console.log("🔍 [Home] Redux user state:", reduxUser);

    // ✅ Đồng bộ Redux state với React state
    if (reduxUser.loggedIn && reduxUser.accessToken) {
      console.log("✅ [Home] User logged in from Redux, setting user");
      setUser({
        username: reduxUser.username,
        email: reduxUser.email,
        role: reduxUser.role,
        status: reduxUser.status,
      });
    } else {
      console.log("❌ [Home] No logged in user in Redux");
      setUser(null);
    }

    setLoading(false);
  }, [
    reduxUser.loggedIn,
    reduxUser.username,
    reduxUser.email,
    reduxUser.role,
    reduxUser.status,
    reduxUser.accessToken,
  ]);

  // Hiển thị loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="animate-pulse text-white text-center">
          <div className="w-12 h-12 bg-white rounded-full mx-auto mb-4 animate-spin"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  // ✅ Nếu user = null → Hiển thị trang đăng nhập
  if (!user || reduxUser.status === 'inactive') {
    return <AuthPage setUser={setUser} />;
  }

  // ✅ Nếu có user (sau login) → Hiển thị MainApp
  return (
    <AppProvider>
      <MainApp user={user} setUser={setUser} />
    </AppProvider>
  );
}

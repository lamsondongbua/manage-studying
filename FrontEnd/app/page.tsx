"use client";

import { useEffect, useState } from "react";
import { AppProvider } from "@/contexts/app-context";
import AuthPage from "@/components/auth/auth-page";
import MainApp from "@/components/main-app";

export default function Home() {
  // ✅ Khởi tạo user = null, KHÔNG đọc từ localStorage
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Trong thực tế, đây là nơi kiểm tra session từ backend
    // Ví dụ: axios.get('/api/verify-session').then(...)

    // Giả lập thời gian check session
    const timer = setTimeout(() => {
      // ✅ Không làm gì cả, để user = null
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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
  if (!user) {
    return <AuthPage setUser={setUser} />;
  }

  // ✅ Nếu có user (sau login) → Hiển thị MainApp
  return (
    <AppProvider>
      <MainApp user={user} setUser={setUser} />
    </AppProvider>
  );
}

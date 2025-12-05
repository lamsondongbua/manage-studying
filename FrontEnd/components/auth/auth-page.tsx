"use client";

import { useState } from "react";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";

interface AuthPageProps {
  setUser: (user: any) => void;
}

export default function AuthPage({ setUser }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = (userData: any) => {
    setUser(userData);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-md mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-300 to-orange-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">⏱</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">StudyFlow</h1>
          <p className="text-white/70">
            Quản lý thời gian học tập của bạn một cách thông minh
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl animate-scale-in">
          {isLogin ? (
            <LoginForm onAuth={handleAuth} onSwitch={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitch={handleSwitchToLogin} />
          )}
        </div>

        <p className="text-center text-white/60 mt-6 text-sm">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-white font-semibold hover:text-amber-300 transition-colors"
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.6s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}

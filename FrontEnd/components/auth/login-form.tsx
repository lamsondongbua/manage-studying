"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { postLogin, postGoogleLogin } from "../../services/apiServices";
import { useDispatch } from "react-redux";
import {
  loginSuccess,
  loginFailure,
} from "../../redux/reducer+action/userSlice";

interface LoginFormProps {
  onAuth: (user: any) => void;
  onSwitch: () => void;
}

export default function LoginForm({ onAuth, onSwitch }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password)
        throw new Error("Vui lòng điền đầy đủ thông tin");

      const data = await postLogin(email, password);

      toast.success(data.msg || "Đăng nhập thành công!");

      dispatch(
        loginSuccess({
          username: data.user.username,
          email: data.user.email,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
      );

      onAuth(data.user);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.msg || err.message || "Đăng nhập thất bại";
      setError(errorMessage);
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      const token = credentialResponse.credential;
      const data = await postGoogleLogin(token);

      dispatch(
        loginSuccess({
          username: data.user.username,
          email: data.user.email,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
      );

      toast.success("Đăng nhập Google thành công!");
      onAuth(data.user);
    } catch (err: any) {
      console.error(err);
      toast.error("Đăng nhập Google thất bại");
      dispatch(loginFailure("Google login failed"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Đăng Nhập</h2>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
        />
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Mật khẩu
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-70"
      >
        {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/30"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white/10 text-white/60">hoặc</span>
        </div>
      </div>
      <div className="w-full">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            console.error("Google Login Failed");
            toast.error("Google authentication failed at API call");
          }}
        />
      </div>
    </form>
  );
}

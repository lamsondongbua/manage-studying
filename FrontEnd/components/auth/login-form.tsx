"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import {
  postLogin,
  postGoogleLogin,
  postForgotPassword,
  postVerifyOTP,
  postResetPassword,
} from "../../services/apiServices";
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

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "reset">(
    "email"
  );

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

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotStep("email");
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!forgotEmail) throw new Error("Vui lòng nhập email");

      const data = await postForgotPassword(forgotEmail);
      toast.success(data.msg || "Mã OTP đã được gửi về email!");
      setForgotStep("otp");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.msg || err.message || "Gửi OTP thất bại";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!otp) throw new Error("Vui lòng nhập mã OTP");

      const data = await postVerifyOTP(forgotEmail, otp);
      toast.success(data.msg || "Xác thực OTP thành công!");
      setForgotStep("reset");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.msg || err.message || "OTP không hợp lệ";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!newPassword || !confirmPassword) {
        throw new Error("Vui lòng điền đầy đủ thông tin");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }

      if (newPassword.length < 6) {
        throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
      }

      const data = await postResetPassword(forgotEmail, newPassword);
      toast.success(data.msg || "Đặt lại mật khẩu thành công!");

      setShowForgotPassword(false);
      setForgotStep("email");
      setForgotEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.msg || err.message || "Đặt lại mật khẩu thất bại";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotStep("email");
    setError("");
  };

  if (showForgotPassword) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-6">Quên Mật Khẩu</h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {forgotStep === "email" && (
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              Nhập email của bạn để nhận mã OTP khôi phục mật khẩu
            </p>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
            </div>

            <Button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-70"
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </Button>
          </div>
        )}

        {forgotStep === "otp" && (
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              Mã OTP đã được gửi đến{" "}
              <span className="font-semibold text-white">{forgotEmail}</span>
            </p>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Mã OTP (6 số)
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-center text-2xl tracking-widest"
              />
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-70"
            >
              {loading ? "Đang xác thực..." : "Xác thực OTP"}
            </Button>

            <button
              onClick={() => setForgotStep("email")}
              className="w-full text-white/70 text-sm hover:text-white transition-colors"
            >
              Gửi lại mã OTP
            </button>
          </div>
        )}

        {forgotStep === "reset" && (
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-70"
            >
              {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </Button>
          </div>
        )}

        <button
          onClick={handleBackToLogin}
          className="w-full text-white/70 text-sm hover:text-white transition-colors mt-4"
        >
          ← Quay lại đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        <div className="flex justify-between items-center mb-2">
          <label className="block text-white text-sm font-medium">
            Mật khẩu
          </label>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
        />
      </div>
      <button
        onClick={handleForgotPassword}
        className="text-amber-400 text-sm hover:text-amber-300 transition-colors"
      >
        Quên mật khẩu?
      </button>

      <Button
        onClick={handleSubmit}
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
    </div>
  );
}

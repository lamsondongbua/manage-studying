"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { postRegister } from "../../services/apiServices";

interface RegisterFormProps {
  onSwitch: () => void; // ✅ Chỉ cần onSwitch để chuyển sang login
}

export default function RegisterForm({ onSwitch }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!name || !email || !password || !confirmPassword)
        throw new Error("Vui lòng điền đầy đủ thông tin");

      if (password !== confirmPassword)
        throw new Error("Mật khẩu không trùng khớp");

      if (password.length < 6)
        throw new Error("Mật khẩu phải có ít nhất 6 ký tự");

      // 🔥 Call API đăng ký
      const data = await postRegister(name, email, password);

      console.log("✅ Register response:", data);

      // ✅ Hiển thị toast thành công
      toast.success(data.msg || "Đăng ký thành công! Vui lòng đăng nhập.", {
        position: "top-right",
        autoClose: 2000,
      });

      // ✅ KHÔNG lưu user vào localStorage
      // ✅ KHÔNG gọi onAuth

      // ✅ Chờ 1.5 giây để user thấy toast, rồi chuyển sang login
      setTimeout(() => {
        onSwitch(); // Chuyển sang form login
      }, 1500);
    } catch (err: any) {
      console.error("❌ Register error:", err);

      // Xử lý lỗi từ backend
      const errorMessage =
        err.response?.data?.msg || err.message || "Đăng ký thất bại";

      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Đăng Ký</h2>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Tên của bạn
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nguyễn Văn A"
          className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
          required
        />
      </div>

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
          required
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
          required
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
          required
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-70"
      >
        {loading ? "Đang tạo tài khoản..." : "Đăng Ký"}
      </Button>
    </form>
  );
}

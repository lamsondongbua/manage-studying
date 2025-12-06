"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/services/apiServices";
import { useSoundContext } from "@/contexts/sound-context";

interface UserProfile {
  username: string;
  email: string;
  plan?: string;
}

export default function Settings() {
  const {
    selectedSound,
    volume,
    setSelectedSound,
    setVolume,
    playCompletionSound,
    isPlaying,
    stopSound,
  } = useSoundContext();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const soundOptions = [
    { value: "sound1", label: "🎀 Anime" },
    { value: "sound2", label: "😲 Thật hả" },
    { value: "sound3", label: "🔫 Súng" },
    { value: "sound4", label: "🎶 Tèo téo teo teo..." },
    { value: "sound5", label: "💨 Rắm" },
    { value: "none", label: "🔕 Tắt tiếng" },
  ];

  // ====== FETCH PROFILE ======
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const mockData = await getProfile();
        await new Promise((r) => setTimeout(r, 500));
        setProfile(mockData);
      } catch (error) {
        console.error("❌ Profile fetch failed:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // ====== STOP SOUND WHEN CHANGING SELECTION ======
  useEffect(() => {
    if (isPlaying) {
      stopSound();
    }
  }, [selectedSound]);

  // ====== TEST SOUND BUTTON ======
  const handleTestSound = () => {
    if (selectedSound === "none") return;

    // If already playing, stop it
    if (isPlaying) {
      stopSound();
    } else {
      // Otherwise, play new sound
      playCompletionSound();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* --- SOUND BOX --- */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <p className="text-amber-100 text-sm uppercase tracking-widest mb-4">
                  Âm báo hoàn thành
                </p>

                {/* Select Sound */}
                <div className="mb-4">
                  <label className="block text-sm text-amber-100 mb-1">
                    Loại âm thanh
                  </label>
                  <select
                    value={selectedSound}
                    onChange={(e) => setSelectedSound(e.target.value)}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-lg rounded-xl px-4 py-3"
                  >
                    {soundOptions.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="text-gray-800"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Volume */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-amber-100 mb-1">
                    <label>Âm lượng</label>
                    <span>{volume}%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-2 bg-white/30 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Test Button */}
              <button
                onClick={handleTestSound}
                disabled={selectedSound === "none"}
                className="w-full bg-white text-orange-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:bg-white/40 disabled:text-gray-300 transition-all hover:bg-white/90 active:scale-95"
              >
                {isPlaying ? (
                  <>
                    <span className="animate-pulse">🔊</span>
                    <span>Đang phát...</span>
                  </>
                ) : (
                  <>
                    <span>▶️</span>
                    <span>Nghe thử</span>
                    <span>và Chọn</span>
                    <span>✅</span>
                  </>
                )}
              </button>
            </div>

            <div className="absolute -bottom-10 -right-10 text-9xl opacity-20 select-none">
              🔔
            </div>
          </div>

          {/* --- PROFILE BOX --- */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 h-full flex flex-col">
              <p className="text-indigo-100 text-sm uppercase tracking-widest mb-6">
                Thông tin tài khoản
              </p>

              {loadingProfile ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-white/30 rounded w-3/4"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2"></div>
                  <div className="h-6 bg-white/20 rounded w-1/3 mt-4"></div>
                </div>
              ) : profile ? (
                <div className="flex flex-col gap-4 mt-2">
                  <div>
                    <span className="text-indigo-200 text-xs">Họ và tên</span>
                    <h3 className="text-3xl font-bold truncate">
                      {profile.username}
                    </h3>
                  </div>

                  <div>
                    <span className="text-indigo-200 text-xs">Email</span>
                    <p className="text-lg font-medium opacity-90 truncate">
                      {profile.email}
                    </p>
                  </div>

                  {profile.plan && (
                    <div>
                      <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 mt-2">
                        <span>🏷️</span>
                        <span className="font-semibold">{profile.plan}</span>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>Không tải được thông tin.</p>
                </div>
              )}
            </div>

            <div className="absolute -top-6 -right-6 text-9xl opacity-10 select-none">
              👤
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">
            💡 Mẹo tối ưu hóa
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <p className="font-semibold">Tắt thông báo</p>
                <p className="text-sm text-gray-600 mb-4">
                  Bật chế độ "Do Not Disturb" để tập trung sâu.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">📱</span>
              <div>
                <p className="font-semibold">
                  Giữ điện thoại ở chế độ yên tĩnh
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Đặt thiết bị của bạn ở chế độ Im lặng để tránh bị gián đoạn.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <p className="font-semibold">Đặt mục tiêu hàng ngày</p>
                <p className="text-sm text-gray-600 mb-4">
                  Cố gắng vượt qua mục tiêu hôm qua để giỏi hơn.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FocusModeGuard() {
  const [showWarning, setShowWarning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        // User rời tab
        setShowWarning(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 text-center space-y-4 w-[90%] max-w-md">
        <h2 className="text-xl font-bold text-red-600">⚠️ Cảnh báo</h2>
        <p className="text-gray-700">
          Bạn đã rời khỏi ứng dụng, hệ thống sẽ yêu cầu tắt web.
        </p>

        <div className="flex justify-center gap-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={() => setShowWarning(false)}
          >
            Huỷ
          </button>

          <button
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={() => {
              // "Thoát web" (cách an toàn nhất)
              window.location.href = "about:blank";
            }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAppContext } from "@/contexts/app-context";
import { postTask } from "../../services/apiServices"; // 🔥 import API
import { toast } from "react-toastify";

interface TaskFormProps {
  onClose: () => void;
}

export default function TaskForm({ onClose }: TaskFormProps) {
  const { addTask } = useAppContext();
  const [name, setName] = useState("");
  const [description, setDescription] = useState(""); // 🔥 thêm description
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Vui lòng nhập tên công việc");
      return;
    }

    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const totalMinutes = h * 60 + m;

    if (totalMinutes <= 0) {
      setError("Thời gian phải lớn hơn 0");
      return;
    }

    // 🔥 Tính dueDate = currentTime + totalMinutes
    const dueDate = new Date(Date.now() + totalMinutes * 60 * 1000);

    try {
      // 🔥 gọi API
      const createdTask = await postTask(name, description, dueDate);

      // cập nhật context
      addTask(createdTask);

      // reset form
      setName("");
      setDescription("");
      setHours("1");
      setMinutes("0");
      onClose();
      toast.success('Tạo công việc mới thành công');
    } catch (err) {
      console.error(err);
      setError("Không thể tạo công việc. Vui lòng thử lại.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 mb-8 shadow-lg-soft animate-scale-in backdrop-blur-sm">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
        Thêm công việc mới
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-xl text-red-700 dark:text-red-300 text-sm font-medium animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            Tên công việc
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Học Toán, Làm bài tập..."
            className="w-full px-5 py-3 border dark:bg-slate-700 rounded-xl"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            Mô tả
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết công việc..."
            className="w-full px-5 py-3 border dark:bg-slate-700 rounded-xl"
          />
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold">Giờ</label>
            <input
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-5 py-3 border rounded-xl text-center"
            />
          </div>
          <div>
            <label className="block text-sm font-bold">Phút</label>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full px-5 py-3 border rounded-xl text-center"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-md"
          >
            ✨ Thêm công việc
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border text-gray-700 font-bold rounded-xl"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Task } from "@/types/index";

interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: (taskData: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
  }) => Promise<void>;
}

function formatDateForInput(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function TaskEditModal({
  task,
  onClose,
  onSubmit,
}: TaskEditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(formatDateForInput(task.dueDate));
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(formatDateForInput(task.dueDate));
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tên công việc");
      return;
    }
    setError("");

    try {
      await onSubmit({
        id: task._id,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi cập nhật task");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-lg animate-scale-in">
        <h2 className="text-2xl font-bold mb-6">Cập nhật công việc</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">
              Tên công việc
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Deadline</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl"
            >
              Cập nhật
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border rounded-xl text-gray-700 font-bold"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

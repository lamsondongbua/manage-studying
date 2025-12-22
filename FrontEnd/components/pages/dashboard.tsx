"use client";

import { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/contexts/app-context";
import TaskForm from "@/components/dashboard/task-form";
import TaskList from "@/components/dashboard/task-list";
import TaskEditModal from "@/components/dashboard/taskeditmodal";
import { Task } from "@/types/index";
import {
  getTasks,
  updateTaskByID,
  deleteTaskByID,
} from "@/services/apiServices";
import { toast } from "react-toastify";

export default function Dashboard() {
  const { tasks, setTasks, removeTask, updateTask, startTask } =
    useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (isFetching.current) return;

      isFetching.current = true;
      try {
        const res = await getTasks();
        setTasks(res);
      } catch (err) {
        console.error("Lỗi fetch tasks:", err);
      } finally {
        isFetching.current = false;
      }
    };

    fetchTasks();
  }, [setTasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleUpdateTask = async (taskData: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
  }) => {
    try {
      const res = await updateTaskByID(taskData.id, taskData);
      updateTask(res);
      toast.success('Cập nhật công việc thành công');
      setEditingTask(null);
    } catch (err) {
      console.error("Lỗi update task:", err);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      await deleteTaskByID(taskId);
      removeTask(taskId);
      toast.success('Xóa công việc thành công');
    } catch (err) {
      console.error("Lỗi xóa task:", err);
    }
  };

  const handleStartTask = async (taskId: string) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) {
      console.error("Task không tìm thấy!");
      return;
    }

    console.log("🎯 Starting task:", task.title);

    try {

      await startTask(task);

      console.log("✅ Session created successfully");

      deleteTaskByID(taskId).catch((err) => {
        console.warn("⚠️ Không thể xóa task trên server:", err);
      });

      toast.success('Đã tạo phiên học! Vào trang Countdown để xem timer.');
    } catch (err: any) {
      console.error("❌ Lỗi khi start task:", err);

      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể bắt đầu phiên học";
      alert(`Lỗi: ${errorMsg}\n\nVui lòng thử lại!`);

      try {
        const res = await getTasks();
        setTasks(res);
      } catch (reloadErr) {
        console.error("Không thể reload tasks:", reloadErr);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-12">
        <div className="mb-4">
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
            Quản lý công việc
          </p>
        </div>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Tổ chức các phiên học tập của bạn và bắt đầu học
        </p>
      </div>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 duration-300 animate-scale-in"
        >
          ✨ Thêm công việc mới
        </button>
      )}
      {showForm && !editingTask && (
        <TaskForm onClose={() => setShowForm(false)} />
      )}

      <TaskList
        tasks={tasks}
        onStartTask={handleStartTask}
        onRemoveTask={handleRemoveTask}
        onEditTask={handleEditTask}
      />

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
        />
      )}
    </div>
  );
}

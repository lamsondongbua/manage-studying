"use client";

import { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/contexts/app-context";
import TaskForm from "@/components/dashboard/task-form";
import TaskList from "@/components/dashboard/task-list";
import TaskEditModal from "../dashboard/taskeditmodal";
import instance from "../../util/axiosCustomize";
import { Task } from "@/types/index";

export default function Dashboard() {
  const { tasks, setTasks, addTask, removeTask, updateTask, startTask } =
    useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    const getTasks = async () => {
      if (isFetching.current) return;

      isFetching.current = true;
      try {
        const res = await instance.get("/api/tasks");
        setTasks(res.data);
      } catch (err) {
        console.error("Lỗi fetch tasks:", err);
      } finally {
        isFetching.current = false;
      }
    };

    getTasks();
  }, []);


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
      const res = await instance.put(`/api/tasks/${taskData.id}`, taskData);
      updateTask(res.data);
      setEditingTask(null);
    } catch (err) {
      console.error("Lỗi update task:", err);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      await instance.delete(`/api/tasks/${taskId}`);
      removeTask(taskId);
    } catch (err) {
      console.error("Lỗi xóa task:", err);
    }
  };

  // ✅ Thêm wrapper function để convert taskId sang Task object
  const handleStartTask = async (taskId: string) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    try {
      // 1️⃣ Xóa task trên server
      await instance.delete(`/api/tasks/${taskId}`);

      // 2️⃣ Xóa task khỏi context
      startTask(task);
    } catch (err) {
      console.error("Lỗi khi start task:", err);
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* HEADER */}
      <div className="text-center mb-12">
        <div className="mb-4">
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 text-lg font-medium">Quản lý công việc</p>
        </div>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Tổ chức các phiên học tập của bạn và bắt đầu học
        </p>
      </div>

      {/* FORM THÊM MỚI */}
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

      {/* TASK LIST */}
      <TaskList
        tasks={tasks}
        onStartTask={handleStartTask} // ✅ Truyền wrapper function thay vì startTask trực tiếp
        onRemoveTask={handleRemoveTask}
        onEditTask={handleEditTask}
      />

      {/* MODAL SỬA TASK */}
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

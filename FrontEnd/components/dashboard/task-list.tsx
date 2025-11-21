"use client";

import { Task } from "@/types/index";

interface TaskListProps {
  tasks: Task[];
  onStartTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}

export default function TaskList({
  tasks,
  onStartTask,
  onRemoveTask,
  onEditTask,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl border-2 border-dashed border-purple-200 dark:border-purple-800">
        <div className="text-6xl mb-4 animate-bounce">📚</div>
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
          Chưa có công việc nào. Hãy thêm công việc để bắt đầu!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <div
          key={task._id}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-lg-soft hover:shadow-xl transition-all duration-300 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center justify-between">
            {/* TITLE + DESCRIPTION */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-1">
                  📄 {task.description}
                </p>
              )}
              {task.dueDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  ⏳ Deadline: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <button
                onClick={() => onEditTask(task)}
                className="px-3 py-2 bg-yellow-300 hover:bg-yellow-400 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all"
              >
                ✏️
              </button>
              <button
                onClick={() => onStartTask(task._id)}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl"
              >
                ▶ Start
              </button>
              <button
                onClick={() => onRemoveTask(task._id)}
                className="px-3 py-2 bg-red-50 text-red-600 font-bold rounded-xl"
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  duration: number;
  completed: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  taskName: string;
  duration: number; // minutes
  status: "running" | "completed";
  startedAt: Date;
  completedAt?: Date;
  timeRemaining?: number; // ✅ Thêm field để lưu seconds còn lại
}

export interface User {
  id: string;
  email: string;
  name: string;
}

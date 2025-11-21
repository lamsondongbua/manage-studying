export interface Task {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  taskName: string;
  duration: number;
  startedAt: Date;
  completedAt?: Date;
  status: "running" | "paused" | "completed";
  shortBreak?: number;
  longBreak?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

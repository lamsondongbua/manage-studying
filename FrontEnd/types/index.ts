// Admin types definition
export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  totalStudyTime: number; // in minutes
  averageSessionTime: number;
  streakDays: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  status: "active" | "inactive";
  createdAt: Date;
  updateAt: Date;
  stats: UserStats;
}

export interface TaskRecord {
  id: string;
  userId: string;
  title: string;
  duration: number; // in minutes
  status: "completed" | "ongoing" | "abandoned";
  createdAt: Date;
  completedAt?: Date;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  duration: number;
  completed: boolean;
  inProgress?: boolean; // ✅ thêm
  createdAt: string;
}

// ✅ Session type với optional userInfo cho admin
export interface Session {
  id: string;
  taskId?: string;
  taskName: string;
  duration: number; // in minutes
  status: "running" | "paused" | "completed";
  timeRemaining?: number; // in seconds
  isCompleted?: boolean;
  pausedAt?: string | null;
  startedAt?: string;
  completedAt?: string;
  userInfo?: {
    _id: string;
    username?: string;
    email?: string;
    role?: string;
    status?: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Music {
  _id: string;
  title: string;
  artist: string;
  duration: number;
  fileName: string;
  playCount?: number;
  createdAt: string;
}
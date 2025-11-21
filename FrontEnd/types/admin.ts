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
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  lastLogin?: Date;
  stats: UserStats;
}

export interface TaskRecord {
  id: string;
  userId: string;
  title: string;
  duration: number; // in minutes
  status: 'completed' | 'ongoing' | 'abandoned';
  createdAt: Date;
  completedAt?: Date;
}

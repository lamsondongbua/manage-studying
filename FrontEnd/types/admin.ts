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
  role:string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updateAt: Date;
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


export interface UserStatistics {
  tasks: {
    tasks: any[];
    completed: any[];
    incomplete: any[];
    stats: {
      total: number;
      completed: number;
      incomplete: number;
    };
  };
  sessions: {
    sessions: any[];
    completed: any[];
    incomplete: any[];
    stats: {
      total: number;
      completed: number;
      incomplete: number;
      totalMinutes: number;
    };
  };
}
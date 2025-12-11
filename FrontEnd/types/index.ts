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
  duration: number; // in minutes
  status: "running" | "paused" | "completed";
  timeRemaining?: number; // in seconds

  startedAt?: Date;
  completedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

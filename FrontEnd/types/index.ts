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
  timeRemaining: number; // in seconds
  
  status: "running" | "completed" | "paused" | "pending"; 
  
  startedAt?: Date;
  completedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

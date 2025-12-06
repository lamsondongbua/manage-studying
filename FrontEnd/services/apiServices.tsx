// @/services/authService.ts
import instance from "@/util/axiosCustomize";
import { Session } from "@/types/index";

const postRegister = async (username: string, email: string, password: string) => {
    const response = await instance.post(`/api/auth/register`, {
        username, 
        email, 
        password
    });
    return response.data; // ✅ Return response.data
}

const postLogin = async(email : string, password: string) => {
    const response = await instance.post(`/api/auth/login`, {
        email,
        password
    })
    return response.data;
}

const postForgotPassword = async( email: string) => {
  const response = await instance.post(`/api/auth/forgot-password`, {
    email
  })
  return response.data;
}

const postVerifyOTP = async(email: string, otp:string) => {
  const response = await instance.post(`/api/auth/verify-otp`, {
    email,
    otp
  })
  return response.data;
}

const postResetPassword = async(email: string, newPassword: string) => {
  const response = await instance.post(`/api/auth/reset-password`, {
    email,
    newPassword
  });
  return response.data;
}

const postGoogleLogin = async( credential: string) =>{
    const response = await instance.post(`/api/auth/google`,{
        credential
    })
    return response.data;
}

const getProfile = async() => {
  const response = await instance.get(`/api/auth/profile`)
  return response.data;
}

const postTask = async(title: string, description: string, dueDate: Date, duration : number ) => {
    const response = await instance.post(`/api/tasks/`,{
        title,
        description,
        dueDate,
        duration
    })
    return response.data;
}

const getTasks = async() => {
    const response = await instance.get(`/api/tasks`);
    return response.data;
}


const updateTaskByID = async <T,>(id: string, data: T) => {
  const response = await instance.put(`/api/tasks/${id}`, data);
  return response.data;
};


const deleteTaskByID = async (id: string) => {
  const res = await instance.delete(`/api/tasks/${id}`);
  return res.data; // ⚡ Trả về data để context cập nhật
};



// Start một session mới
// Sửa pomodoroStart để nhận taskName
const pomodoroStart = async (
  taskName?: string,
  duration?: number
): Promise<Session> => {
  console.log("taskName, duration fe: ", { taskName, duration });
  const res = await instance.post("/api/pomodoro/start", {
    taskName: taskName || "Pomodoro Session",
    duration: duration,
  });
  console.log("backend response: ", res.data);
  const session = res.data;
  const mapped: Session = {
    id: session._id,
    taskName: session.taskName || "Pomodoro Session",
    duration: session.durationMinutes || 25, // ✅ Lấy từ backend
    status: session.isCompleted ? "completed" : "running",
    startedAt: new Date(session.startTime),
    completedAt: session.isCompleted ? new Date(session.endTime) : undefined,
  };

  console.log("✅ Mapped session:", mapped); // ✅ Debug

  return mapped;
};

// Stop session đang chạy
const pomodoroStop = async (sessionId: string): Promise<Session> => {
  const res = await instance.post("/api/pomodoro/stop", { sessionId });
  const session = res.data.session;
  return {
    id: session._id,
    taskName: session.taskName || "Pomodoro Session",
    duration: session.durationMinutes,
    status: session.isCompleted ? "completed" : "running",
    startedAt: new Date(session.startTime),
    completedAt: session.isCompleted ? new Date(session.endTime) : undefined,
  };
};

const pomodoroPause = async (sessionId: string): Promise<Session> => {
  const res = await instance.post("/api/pomodoro/pause", { sessionId });
  const session = res.data;
  return mapSessionFromBackend(session);
};

const pomodoroResume = async (sessionId: string): Promise<Session> => {
  const res = await instance.post("/api/pomodoro/resume", { sessionId });
  const session = res.data;
  return mapSessionFromBackend(session);
};

// ✅ Helper function để map session
const mapSessionFromBackend = (item: any): Session => {
  return {
    id: item._id,
    taskName: item.taskName || "Pomodoro Session",
    duration: item.durationMinutes || 25,
    status: item.isCompleted ? "completed" : "running",
    startedAt: new Date(item.startTime),
    completedAt: item.isCompleted ? new Date(item.endTime) : undefined,
    timeRemaining: item.timeRemaining, // ✅ Thêm field này
  };
};

const pomodoroHistory = async (): Promise<Session[]> => {
  const res = await instance.get("/api/pomodoro/history");
  const data = res.data || [];
  return data.map(mapSessionFromBackend);
};

const getStudyLogDaily = async (
  date?: string
): Promise<{ totalMinutes: number; tasksCompleted: number }> => {
  const params = date ? { date } : {};
  const response = await instance.get(`/api/logs/daily`, { params });
  return response.data;
};

const getStudyLogWeekly = async () => {
  const response = await instance.get(`/api/logs/weekly`);
  return response.data as {
    date: string;
    totalMinutes: number;
    tasksCompleted: number;
  }[];
};


const getStudyLogMonthly = async () => {
  const response = await instance.get(`/api/logs/monthly`);
  return response.data as {
    date: string;
    totalMinutes: number;
    tasksCompleted: number;
  }[];
};


const logStudySession = async (data: {
  taskName: string;
  duration: number; // Tính bằng PHÚT
  completedAt: string; // ISO string (VD: "2023-12-02T14:30:00.000Z")
}) => {
  const response = await instance.post(`/api/logs/log-session`, data);
  return response.data;
};


export { postRegister, postLogin, postGoogleLogin, getProfile, postTask, getTasks, updateTaskByID, deleteTaskByID, pomodoroHistory, pomodoroStart,pomodoroStop, pomodoroPause, pomodoroResume, mapSessionFromBackend, getStudyLogDaily, postForgotPassword, postResetPassword, postVerifyOTP, getStudyLogMonthly,getStudyLogWeekly,logStudySession}
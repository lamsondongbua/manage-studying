// @/services/authService.ts
import instance from "@/util/axiosCustomize";
import { Session } from "@/types/index";

const postRegister = async (
  username: string,
  email: string,
  password: string
) => {
  const response = await instance.post(`/api/auth/register`, {
    username,
    email,
    password,
  });
  return response.data; // ✅ Return response.data
};

const postLogin = async (email: string, password: string) => {
  const response = await instance.post(`/api/auth/login`, {
    email,
    password,
  });
  return response.data;
};

const postForgotPassword = async (email: string) => {
  const response = await instance.post(`/api/auth/forgot-password`, {
    email,
  });
  return response.data;
};

const postVerifyOTP = async (email: string, otp: string) => {
  const response = await instance.post(`/api/auth/verify-otp`, {
    email,
    otp,
  });
  return response.data;
};

const postResetPassword = async (email: string, newPassword: string) => {
  const response = await instance.post(`/api/auth/reset-password`, {
    email,
    newPassword,
  });
  return response.data;
};

const postGoogleLogin = async (credential: string) => {
  const response = await instance.post(`/api/auth/google`, {
    credential,
  });
  return response.data;
};

const getProfile = async () => {
  const response = await instance.get(`/api/auth/profile`);
  return response.data;
};

const postTask = async (
  title: string,
  description: string,
  dueDate: Date,
  duration: number
) => {
  const response = await instance.post(`/api/tasks/`, {
    title,
    description,
    dueDate,
    duration,
  });
  return response.data;
};

const getTasks = async () => {
  const response = await instance.get(`/api/tasks`);
  return response.data;
};

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
  const res = await instance.post("/api/pomodoro/start", {
    taskName: taskName || "Pomodoro Session",
    duration: duration,
  });

  // ✅ Refactor: Dùng hàm map chung
  return mapSessionFromBackend(res.data);
};

// Stop session đang chạy
// Stop session đang chạy
const pomodoroStop = async (sessionId: string): Promise<Session> => {
  const res = await instance.post("/api/pomodoro/stop", { sessionId });

  // 1. Lấy dữ liệu trực tiếp từ response
  const sessionData = res.data; 

  // 2. Kiểm tra log để đảm bảo dữ liệu là object
  if (!sessionData || !sessionData._id) {
      console.error("❌ pomodoroStop: Backend did not return a valid session object.");
      // Tùy chọn: throw error hoặc trả về một session lỗi
      throw new Error("Failed to stop session: Invalid response from server."); 
  }

  // 3. Map dữ liệu nhận được
  return mapSessionFromBackend(sessionData); // ✅ Dùng hàm map chung
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
// services/apiServices.ts
const mapSessionFromBackend = (item: any): Session => {
  // Map isCompleted → status
  let status: 'running' | 'paused' | 'completed';
  if (item.isCompleted) {
    status = 'completed';
  } else if (item.pausedAt) {
    status = 'paused';
  } else {
    status = 'running';
  }

  return {
    id: item._id,
    taskName: item.taskName || "Pomodoro Session",
    duration: item.durationMinutes || 25,
    status: status,
    startedAt: new Date(item.startTime),
    completedAt: item.isCompleted ? new Date(item.endTime) : undefined,
    timeRemaining: item.timeRemaining,
    isCompleted: item.isCompleted, // ✅ THÊM DÒNG NÀY
    pausedAt: item.pausedAt, // ✅ THÊM LUÔN pausedAt
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

const getAllUser = async () => {
  const response = await instance.get(`/api/users/getAll`);
  return response.data;
};

// ✅ GET ONE USER
const getOneUser = async (userId: string) => {
  const response = await instance.get(`/api/users/${userId}`);
  return response.data;
};

// ✅ CREATE USER
const createUser = async (data: {
  username: string;
  email: string;
  password: string;
  role?: string;
  status?: string;
}) => {
  const response = await instance.post(`/api/users/create`, data);
  return response.data;
};

// ✅ UPDATE USER
const updateUser = async (userId: string, data: {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
}) => {
  const response = await instance.put(`/api/users/${userId}`, data);
  return response.data;
};

// ✅ UPDATE USER STATUS
const updateUserStatus = async (userId: string, status: "active" | "inactive" | "suspended") => {
  const response = await instance.patch(`/api/users/${userId}/status`, { status });
  return response.data;
};

// ✅ DELETE USER
const deleteUser = async (userId: string) => {
  const response = await instance.delete(`/api/users/${userId}`);
  return response.data;
};


// ⚠️ Map session cho admin → có thêm user info
// ✅ FIXED: Map session cho admin với user info
const mapSessionFromBackendAdmin = (item: any): Session & { userInfo?: any } => {
  let status: 'running' | 'paused' | 'completed';
  if (item.isCompleted) {
    status = 'completed';
  } else if (item.pausedAt) {
    status = 'paused';
  } else {
    status = 'running';
  }

  return {
    id: item._id,
    taskName: item.taskName || "Pomodoro Session",
    duration: item.durationMinutes || 25,
    status: status,
    startedAt: new Date(item.startTime),
    completedAt: item.isCompleted ? new Date(item.endTime) : undefined,
    timeRemaining: item.timeRemaining,
    isCompleted: item.isCompleted,
    pausedAt: item.pausedAt,
    userInfo: item.user, // ✅ Thêm thông tin user
  };
};
const pomodoroAdminAllSessions = async (): Promise<Session[]> => {
  const res = await instance.get("/api/pomodoro/admin/all-sessions");
  return res.data.map(mapSessionFromBackendAdmin);
};

// ✅ GET USER STATISTICS (Tasks + Sessions combined)
const getUserStatistics = async (userId: string) => {
  try {
    const [tasksResponse, sessionsResponse] = await Promise.all([
      instance.get(`/api/tasks/user/${userId}`),
      instance.get(`/api/pomodoro/admin/user/${userId}`)
    ]);

    return {
      tasks: tasksResponse.data,
      sessions: sessionsResponse.data,
    };
  } catch (error) {
    console.error("❌ Error fetching user statistics:", error);
    throw error;
  }
};

export {
  postRegister,
  postLogin,
  postGoogleLogin,
  getProfile,
  postTask,
  getTasks,
  updateTaskByID,
  deleteTaskByID,
  pomodoroHistory,
  pomodoroStart,
  pomodoroStop,
  pomodoroPause,
  pomodoroResume,
  mapSessionFromBackend,
  getStudyLogDaily,
  postForgotPassword,
  postResetPassword,
  postVerifyOTP,
  getStudyLogMonthly,
  getStudyLogWeekly,
  logStudySession,
  getAllUser,
  pomodoroAdminAllSessions,
  getOneUser,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getUserStatistics
};

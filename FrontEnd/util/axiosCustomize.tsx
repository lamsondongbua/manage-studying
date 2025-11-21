import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import NProgress from "nprogress";
import { store } from "../redux/store";
import { updateTokens, logout } from "../redux/reducer+action/userSlice";

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
});

// Tạo axios instance
const instance = axios.create({
  baseURL: "http://localhost:5000",
});

// Biến để tránh gọi refresh token nhiều lần đồng thời
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// =============================
// Request Interceptor
// =============================
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const access_token = store?.getState()?.user?.accessToken;

    if (access_token) {
      const headers = new AxiosHeaders(config.headers);
      headers.set("Authorization", `Bearer ${access_token}`);
      config.headers = headers;
    }

    NProgress.start();
    return config;
  },
  (error: AxiosError) => {
    NProgress.done();
    return Promise.reject(error);
  }
);

// =============================
// Response Interceptor
// =============================
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    NProgress.done();
    return response;
  },
  async (error: AxiosError<any>) => {
    NProgress.done();

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status ?? 500;

    // Nếu lỗi 401 và chưa retry
    if (status === 401 && !originalRequest._retry) {
      // Nếu đang refresh token, đưa request vào hàng đợi
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            const headers = new AxiosHeaders(originalRequest.headers);
            headers.set("Authorization", `Bearer ${token}`);
            originalRequest.headers = headers;
            return instance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = store?.getState()?.user?.refreshToken;

      if (!refreshToken) {
        // Không có refresh token, chuyển đến trang login
        store.dispatch(logout());
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Gọi API refresh token
        const response = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {
            refreshToken,
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Cập nhật tokens vào Redux store
        store.dispatch(
          updateTokens({
            accessToken,
            refreshToken: newRefreshToken, // Backend có thể trả về refresh token mới
          })
        );

        // Cập nhật header cho request gốc
        const headers = new AxiosHeaders(originalRequest.headers);
        headers.set("Authorization", `Bearer ${accessToken}`);
        originalRequest.headers = headers;

        // Xử lý các request đang đợi trong queue
        processQueue(null, accessToken);

        isRefreshing = false;

        // Retry request gốc với token mới
        return instance(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại, logout và chuyển về login
        processQueue(refreshError, null);
        isRefreshing = false;

        store.dispatch(logout());
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;

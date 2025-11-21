import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  username: string;       // lưu fullName từ backend
  email: string;
  accessToken: string;
  refreshToken: string;
  loggedIn: boolean;
  error?: string | null;
}

const initialState: UserState = {
  username: '',
  email: '',
  accessToken: '',
  refreshToken: '',
  loggedIn: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // đăng nhập thành công
    loginSuccess: (
      state,
      action: PayloadAction<{
        username: string;
        email: string;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.loggedIn = true;
      state.error = null;
    },

    // đăng nhập thất bại
    loginFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loggedIn = false;
      state.accessToken = "";
      state.refreshToken = "";
    },

    // đăng xuất
    logout: (state) => {
      state.username = "";
      state.email = "";
      state.accessToken = "";
      state.refreshToken = "";
      state.loggedIn = false;
      state.error = null;
    },

    // cập nhật profile
    updateProfile: (
      state,
      action: PayloadAction<{ username?: string; email?: string }>
    ) => {
      if (action.payload.username) state.username = action.payload.username;
      if (action.payload.email) state.email = action.payload.email;
    },
    updateTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken?: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      // Nếu backend trả về cả refresh token mới thì cập nhật, không thì giữ cũ
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
    },
  },
});

export const { loginSuccess, loginFailure, logout, updateProfile, updateTokens } = userSlice.actions;
export default userSlice.reducer;

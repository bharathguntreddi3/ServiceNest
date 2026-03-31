import { createSlice } from "@reduxjs/toolkit";

// Check local storage when the app first loads
const savedUser = JSON.parse(localStorage.getItem("user")) || null;

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: savedUser,
  },

  reducers: {
    register: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    login: (state, action) => {
      // Validation is now handled by the backend, so we just store the verified user
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    loginSuccess: (state, action) => {
      // This action is used by the AdminLogin page.
      state.user = action.payload.user;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },

    logout: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
  },
});

export const { register, login, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;

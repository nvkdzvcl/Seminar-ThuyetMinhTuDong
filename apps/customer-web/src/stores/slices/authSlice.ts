/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import type { LoginPayload, RegisterPayload, RegisterResponse, User } from "../../types/auth";

type AuthState = {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
};

const LS_ACCESS = "VINH_KHANH_FOOD_TOUR_ACCESS_TOKEN";
const LS_REFRESH = "VINH_KHANH_FOOD_TOUR_REFRESH_TOKEN";
const LS_USER = "VINH_KHANH_FOOD_TOUR_USER";

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

const clearAuth = (state: AuthState) => {
    state.user = null;
    state.isAuthenticated = false;
    state.loading = false;
    state.error = null;

    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
    localStorage.removeItem(LS_USER);
};

/** LOGIN: fulfilled trả về User */
export const loginThunk = createAsyncThunk<User, LoginPayload, { rejectValue: string }>(
    "auth/login",
    async (payload, thunkAPI) => {
        try {
            const data = await authService.login(payload);

            if (!data.result?.accessToken || !data.result?.user) {
                return thunkAPI.rejectWithValue(data.message || "Login failed");
            }

            localStorage.setItem(LS_ACCESS, data.result.accessToken);
            if (data.result.refreshToken)
                localStorage.setItem(LS_REFRESH, data.result.refreshToken);
            localStorage.setItem(LS_USER, JSON.stringify(data.result.user));

            alert("Login successfully");

            return data.result.user;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err?.response?.data?.message ?? "Login failed");
        }
    }
);

/** REGISTER: fulfilled trả về RegisterResponse */
export const registerThunk = createAsyncThunk<
    RegisterResponse,
    RegisterPayload,
    { rejectValue: string }
>("user/register", async (payload, thunkAPI) => {
    try {
        const data = await authService.register(payload);

        if (!data.result?.isRegistered) {
            return thunkAPI.rejectWithValue(data.message || "Register failed");
        }

        alert("Register successfully. Please login.");
        return data.result;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err?.response?.data?.message ?? "Register failed");
    }
});

/** RESTORE: đọc localStorage */
export const restoreMeThunk = createAsyncThunk<User | null, void, { rejectValue: string }>(
  "auth/restore",
  async (_, thunkAPI) => {
    const token = localStorage.getItem(LS_ACCESS);
    if (!token) return null;

    try {
      const data = await authService.me();

      if (!data.result) return null;

      localStorage.setItem(LS_USER, JSON.stringify(data.result));
      return data.result;
    } catch (err: any) {
      localStorage.removeItem(LS_ACCESS);
      localStorage.removeItem(LS_REFRESH);
      localStorage.removeItem(LS_USER);
      return null;
    }
  }
);

/** LOGOUT: gọi API + clear local */
export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
    "auth/logout",
    async (_, thunkAPI) => {
        const refreshToken = localStorage.getItem(LS_REFRESH) ?? "";

        if (!refreshToken) return;

        try {
            // Backend nhận body { refreshToken }
            const data = await authService.logout({ refreshToken });

            if (data.result !== true) {
                return thunkAPI.rejectWithValue(data.message || "Logout failed");
            }

            alert("Logout successfully");
            return;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err?.response?.data?.message ?? "Logout failed");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearAuthError(state) {
            state.error = null;
        },

        logoutLocal(state) {
            clearAuth(state);
        },
    },
    extraReducers: (builder) => {
        builder
            // login
            .addCase(loginThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Login failed";
            })

            // register
            .addCase(registerThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(registerThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Register failed";
            })

            // restore
            .addCase(restoreMeThunk.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
            })

            // logout thunk
            .addCase(logoutThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutThunk.fulfilled, (state) => {
                // logout thành công => clear local
                clearAuth(state);
            })
            .addCase(logoutThunk.rejected, (state, action) => {
                // logout fail vẫn clear local để user không bị kẹt
                clearAuth(state);
                // nếu muốn hiện lỗi:
                // state.error = action.payload ?? "Logout failed";
            });
    },
});

export const { logoutLocal, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

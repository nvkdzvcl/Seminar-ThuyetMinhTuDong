import axiosClient from "./axiosClient";
import type {
    LoginPayload,
    RegisterPayload,
    LoginResponse,
    RegisterResponse,
    User,
    LogoutResquest,
} from "../types/auth";
import type { ApiResponse } from "../types/api";

export const authService = {
    login: async (payload: LoginPayload) => {
        const res = await axiosClient.post<ApiResponse<LoginResponse>>("/auth/login", payload);
        return res.data; // ApiResponse<LoginResponse>
    },

    logout: async (payload: LogoutResquest) => {
        const res = await axiosClient.post<ApiResponse<boolean>>("/auth/logout", payload);
        return res.data; // ApiResponse<boolean>
    },

    register: async (payload: RegisterPayload) => {
        const res = await axiosClient.post<ApiResponse<RegisterResponse>>(
            "/user/register",
            payload
        );
        return res.data; // ApiResponse<RegisterResponse>
    },

    me: async () => {
        const res = await axiosClient.post<ApiResponse<User>>("/auth/me");
        return res.data; // ApiResponse<User>
    },

    updateMyLanguage: async (language: string) => {
        const res = await axiosClient.patch<ApiResponse<User>>("/auth/me/language", {
            language,
        });
        return res.data;
    },
};

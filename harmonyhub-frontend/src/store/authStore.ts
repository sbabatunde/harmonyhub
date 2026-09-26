import { create } from "zustand";
import { User } from "@/types";
import api from "@/config/api";
import { logger } from "@/utils/logger";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, token } = response.data.data;

      localStorage.setItem("auth_token", token);
      set({ user, isLoading: false });
      logger.info("Login successful", { userId: user.id });
    } catch (error: any) {
      logger.error("Login failed", error as Error);
      set({
        error: error.response?.data?.message || "Login failed",
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/auth/register", data);
      const { user, token } = response.data.data;

      localStorage.setItem("auth_token", token);
      set({ user, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Registration failed",
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      logger.warn("Logout API call failed, clearing local state anyway");
    } finally {
      localStorage.removeItem("auth_token");
      set({ user: null });
    }
  },

  fetchUser: async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      set({ user: null });
      return;
    }

    try {
      const response = await api.get("/user");
      set({ user: response.data.data });
    } catch (error) {
      logger.error("Failed to fetch user", error as Error);
      localStorage.removeItem("auth_token");
      set({ user: null });
    }
  },
}));

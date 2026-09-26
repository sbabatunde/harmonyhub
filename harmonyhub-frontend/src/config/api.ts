// src/config/api.ts
import axios from "axios";
import { logger } from "@/utils/logger";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
  // No withCredentials — we're using bearer tokens, not cookies
});

// Request interceptor: attach Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 by clearing token and redirecting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const status = error.response?.status;

    logger.debug("API Error", { url, status, data: error.response?.data });

    const isAuthRoute =
      url.includes("/auth/login") || url.includes("/auth/register");
    const isSessionCheck = url.includes("/user");
    const alreadyOnLogin = window.location.pathname === "/login";

    if (status === 401 && !isAuthRoute && !isSessionCheck && !alreadyOnLogin) {
      logger.warn("401 - clearing token and redirecting to login");
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;

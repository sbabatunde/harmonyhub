import axios from "axios";
import { logger } from "@/utils/logger";

// 1. Get the base API endpoint from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// 2. Derive the base server URL (strips trailing '/api' or '/api/') for Sanctum routes
const BASE_URL =
  import.meta.env.VITE_SERVER_URL || API_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// Helper to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

// Properly decode the XSRF token (Laravel URL-encodes it)
function getXsrfToken(): string | null {
  const token = getCookie("XSRF-TOKEN");
  if (!token) return null;

  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const xsrfToken = getXsrfToken();
    if (xsrfToken) {
      config.headers["X-XSRF-TOKEN"] = xsrfToken;
    }

    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor with CSRF retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = error.config?.url || "";
    const status = error.response?.status;

    logger.debug("API Error", { url, status, data: error.response?.data });

    // Refresh CSRF token on 419
    if (status === 419 && !originalRequest._retry) {
      originalRequest._retry = true;
      logger.warn("CSRF mismatch - refreshing token...");

      try {
        await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
          withCredentials: true,
        });

        const freshToken = getXsrfToken();
        if (freshToken) {
          originalRequest.headers["X-XSRF-TOKEN"] = freshToken;
        }

        return api(originalRequest);
      } catch (retryError) {
        logger.error("CSRF retry failed", retryError as Error);
      }
    }

    const isAuthRoute =
      url.includes("/auth/login") || url.includes("/auth/register");
    const isSessionCheck = url.includes("/user");
    const alreadyOnLogin = window.location.pathname === "/login";

    if (status === 401 && !isAuthRoute && !isSessionCheck && !alreadyOnLogin) {
      logger.warn("401 - redirecting to login");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export const getCsrfCookie = async () => {
  await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
};

export default api;

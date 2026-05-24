import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClientWithAuth = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const clearClientAuthState = async () => {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore cookie-clear failures; local cleanup + redirect still proceeds.
  }
};

let isForcingLogout = false;

const forceLogoutRedirect = async () => {
  if (typeof window === "undefined" || isForcingLogout) return;
  isForcingLogout = true;

  await clearClientAuthState();

  if (!window.location.pathname.startsWith("/signin")) {
    window.location.replace("/signin");
    return;
  }

  isForcingLogout = false;
};

// Request interceptor — attach access_token from cookie to every request
apiClientWithAuth.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const token = document.cookie
      .split("; ")
      .find((c) => c.startsWith("access_token="))
      ?.split("=")[1];
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Queue for requests that arrive while a refresh is already in flight
let isRefreshing = false;
type QueueEntry = { resolve: (value: unknown) => void; reject: (reason?: unknown) => void };
let refreshQueue: QueueEntry[] = [];

const processQueue = (error: unknown) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(null);
  });
  refreshQueue = [];
};

// Response interceptor to handle token refresh
apiClientWithAuth.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Another refresh is already in flight — queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(() => apiClientWithAuth(originalRequest))
        .catch(() => Promise.reject(error));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!refreshRes.ok) {
        processQueue(error);
        await forceLogoutRedirect();
        return Promise.reject(error);
      }

      const refreshData = await refreshRes.json()
      if (refreshData.access_token) {
        localStorage.setItem('access_token', refreshData.access_token)
      }

      processQueue(null);
      return apiClientWithAuth(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      await forceLogoutRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClientWithAuth;

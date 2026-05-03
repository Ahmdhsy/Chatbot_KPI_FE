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

// Response interceptor to handle token refresh
apiClientWithAuth.interceptors.response.use(
  (response) => {
    console.log("[API Response]", {
      url: response.config.url,
      status: response.status,
    });
    return response;
  },
  async (error) => {
    console.error("[API Error]", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log("[API Interceptor] Attempting token refresh for 401 error");

      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!refreshRes.ok) {
          console.log("[API Interceptor] Token refresh failed, user will be logged out");
          await forceLogoutRedirect();
          return Promise.reject(error);
        }

        console.log("[API Interceptor] Token refreshed successfully, retrying original request");
        return apiClientWithAuth(originalRequest);
      } catch (refreshError) {
        console.error("[API Interceptor] Token refresh error:", refreshError);
        await forceLogoutRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClientWithAuth;

import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClientWithAuth = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Store for refresh callback - will be set by AuthContext
let refreshTokenCallback: (() => Promise<boolean>) | null = null;

export const setRefreshTokenCallback = (
  callback: () => Promise<boolean>
) => {
  refreshTokenCallback = callback;
};

const clearClientAuthState = async () => {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore cookie-clear failures; local cleanup + redirect still proceeds.
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("tokenExpiresAt");

  const tokenLikeKeys = Object.keys(localStorage).filter(
    (key) => key.toLowerCase().includes("token")
  );
  tokenLikeKeys.forEach((key) => {
    if (!["access_token", "refresh_token", "tokenExpiresAt"].includes(key)) {
      localStorage.removeItem(key);
    }
  });
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

// Request interceptor to add auth token
apiClientWithAuth.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[API Request] Authorization header set with Bearer token");
    } else {
      console.warn("[API Request] No access token found in localStorage");
    }
    console.log("[API Request]", {
      url: config.url,
      method: config.method,
      params: config.params,
      hasAuth: !!token,
      authHeader: config.headers.Authorization ? "Bearer <token>" : "Not set",
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
        // Call refresh token callback if available
        if (refreshTokenCallback) {
          const refreshed = await refreshTokenCallback();
          if (refreshed) {
            console.log("[API Interceptor] Token refreshed successfully, retrying original request");
            // Retry the original request with new token
            const token = localStorage.getItem("access_token");
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClientWithAuth(originalRequest);
            }
          } else {
            console.log("[API Interceptor] Token refresh failed, user will be logged out");
            await forceLogoutRedirect();
            return Promise.reject(error);
          }
        } else {
          console.warn("[API Interceptor] No refresh callback available");
          await forceLogoutRedirect();
          return Promise.reject(error);
        }
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

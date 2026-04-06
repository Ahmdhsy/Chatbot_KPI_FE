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

// Request interceptor to add auth token
apiClientWithAuth.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
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
            const token = localStorage.getItem("accessToken");
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClientWithAuth(originalRequest);
            }
          } else {
            console.log("[API Interceptor] Token refresh failed, user will be logged out");
            return Promise.reject(error);
          }
        } else {
          console.warn("[API Interceptor] No refresh callback available");
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error("[API Interceptor] Token refresh error:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClientWithAuth;

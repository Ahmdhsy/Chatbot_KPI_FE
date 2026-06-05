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
    window.location.replace("/signin?expired=true");
    return;
  }

  isForcingLogout = false;
};

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("access_token="))
      ?.split("=")[1] ?? null
  );
}

// Request interceptor — attach access_token from cookie to every request
apiClientWithAuth.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
        
        // Ubah pesan error menjadi user-friendly sebelum di-reject agar toast yang muncul rapi
        if (error && typeof error === "object") {
          error.message = "Sesi Anda telah berakhir. Silakan login kembali.";
          if (error.response?.data) {
            error.response.data.detail = "Sesi Anda telah berakhir. Silakan login kembali.";
          }
        }
        return Promise.reject(error);
      }

      processQueue(null);
      return apiClientWithAuth(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      await forceLogoutRedirect();
      if (refreshError && typeof refreshError === "object") {
        (refreshError as any).message = "Sesi Anda telah berakhir. Silakan login kembali.";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;

  const response = await fetch(url, { ...options, headers });

  if (response.status !== 401) {
    return response;
  }

  // Another refresh is already in flight — queue this request
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    }).then(() => fetchWithAuth(url, options))
      .catch(() => response); // Fallback to original 401 response
  }

  isRefreshing = true;

  try {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!refreshRes.ok) {
      processQueue(new Error("Refresh failed"));
      await forceLogoutRedirect();
      return response; // Return original 401 response
    }

    processQueue(null);
    return fetchWithAuth(url, options);
  } catch (refreshError) {
    processQueue(refreshError);
    await forceLogoutRedirect();
    return response; // Return original 401 response
  } finally {
    isRefreshing = false;
  }
}

export default apiClientWithAuth;

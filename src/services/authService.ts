import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: "admin" | "hrd" | "kepala_divisi" | "karyawan";
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: "admin" | "hrd" | "kepala_divisi" | "karyawan";
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface LogoutResponse {
  message: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>(
        "/api/v1/users/login",
        credentials
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.detail?.[0]?.msg || "Login failed",
          status: error.response?.status,
          details: error.response?.data,
        };
      }
      throw error;
    }
  },

  refresh: async (
    refreshToken: string
  ): Promise<RefreshTokenResponse> => {
    try {
      const response = await apiClient.post<RefreshTokenResponse>(
        "/api/v1/users/refresh",
        { refresh_token: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${refreshToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message:
            error.response?.data?.detail?.[0]?.msg || "Token refresh failed",
          status: error.response?.status,
          details: error.response?.data,
        };
      }
      throw error;
    }
  },

  logout: async (refreshToken: string): Promise<LogoutResponse> => {
    try {
      const response = await apiClient.post<LogoutResponse>(
        "/api/v1/users/logout",
        { refresh_token: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${refreshToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.detail?.[0]?.msg || "Logout failed",
          status: error.response?.status,
          details: error.response?.data,
        };
      }
      throw error;
    }
  },
};

export default apiClient;

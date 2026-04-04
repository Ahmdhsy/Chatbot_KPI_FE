"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { setRefreshTokenCallback } from "@/services/apiClientWithAuth";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  login: (accessToken: string, refreshToken: string, expiresIn: number, user: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTimeoutId, setRefreshTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Load auth data from localStorage on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");
    const storedExpiresAt = localStorage.getItem("tokenExpiresAt");

    if (storedAccessToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        if (storedExpiresAt) {
          const expiresAt = parseInt(storedExpiresAt, 10);
          setTokenExpiresAt(expiresAt);
          scheduleTokenRefresh(expiresAt);
        }
      } catch (error) {
        console.error("Failed to parse stored auth data:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("tokenExpiresAt");
      }
    }
    setIsLoading(false);
  }, []);

  const scheduleTokenRefresh = (expiresAt: number) => {
    // Clear existing timeout
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
    }

    // Refresh token 1 minute before expiry
    const now = Date.now();
    const timeUntilRefresh = expiresAt - now - 60 * 1000;

    if (timeUntilRefresh > 0) {
      const timeoutId = setTimeout(() => {
        refreshAccessToken();
      }, timeUntilRefresh);
      setRefreshTimeoutId(timeoutId);
    }
  };

  const login = (
    newAccessToken: string,
    newRefreshToken: string,
    expiresIn: number,
    newUser: User
  ) => {
    const expiresAt = Date.now() + expiresIn * 1000;
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(newUser);
    setIsAuthenticated(true);
    setTokenExpiresAt(expiresAt);

    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("tokenExpiresAt", expiresAt.toString());

    scheduleTokenRefresh(expiresAt);
    
    // Set callback for api client token refresh
    setRefreshTokenCallback(async () => {
      try {
        if (!newRefreshToken) return false;
        const response = await authService.refresh(newRefreshToken);
        const newExpiresAt = Date.now() + response.expires_in * 1000;
        setAccessToken(response.access_token);
        setRefreshToken(response.refresh_token);
        setUser(response.user);
        setTokenExpiresAt(newExpiresAt);
        localStorage.setItem("accessToken", response.access_token);
        localStorage.setItem("refreshToken", response.refresh_token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("tokenExpiresAt", newExpiresAt.toString());
        scheduleTokenRefresh(newExpiresAt);
        return true;
      } catch (error) {
        console.error("Failed to refresh token:", error);
        return false;
      }
    });
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken) {
      console.warn("No refresh token available");
      return false;
    }

    try {
      const response = await authService.refresh(refreshToken);

      const newExpiresAt = Date.now() + response.expires_in * 1000;

      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      setUser(response.user);
      setTokenExpiresAt(newExpiresAt);

      localStorage.setItem("accessToken", response.access_token);
      localStorage.setItem("refreshToken", response.refresh_token);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("tokenExpiresAt", newExpiresAt.toString());

      scheduleTokenRefresh(newExpiresAt);
      return true;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // Refresh failed, logout user
      await logout();
      return false;
    }
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setTokenExpiresAt(null);

      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        setRefreshTimeoutId(null);
      }

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiresAt");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        login,
        logout,
        isLoading,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

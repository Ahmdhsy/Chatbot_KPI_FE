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

  // Helper function to clean up duplicate tokens in localStorage
  const cleanupDuplicateTokens = () => {
    try {
      const allKeys = Object.keys(localStorage);
      const accessTokenKeys = allKeys.filter(key => 
        key.toLowerCase().includes('token') && key.toLowerCase().includes('access')
      );
      
      // Keep only 'access_token', remove all others
      accessTokenKeys.forEach(key => {
        if (key !== 'access_token') {
          console.log(`[AuthContext] Removing duplicate token key: ${key}`);
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("[AuthContext] Failed to cleanup duplicate tokens:", error);
    }
  };

  // Helper function to setup refresh callback
  const setupRefreshCallback = (refreshTokenValue: string) => {
    setRefreshTokenCallback(async () => {
      try {
        console.log("[AuthContext] Token refresh triggered by interceptor");
        const response = await authService.refresh(refreshTokenValue);
        const newExpiresAt = Date.now() + response.expires_in * 1000;
        
        setAccessToken(response.access_token);
        setRefreshToken(response.refresh_token);
        setUser(response.user);
        setTokenExpiresAt(newExpiresAt);
        
        // Clean up old tokens first
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        localStorage.removeItem("tokenExpiresAt");
        
        // Set new tokens
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("tokenExpiresAt", newExpiresAt.toString());
        
        scheduleTokenRefresh(newExpiresAt);
        
        // Recursively setup callback with new refresh token
        setupRefreshCallback(response.refresh_token);
        
        console.log("[AuthContext] Token refresh successful by interceptor");
        return true;
      } catch (error) {
        console.error("[AuthContext] Token refresh failed:", error);
        // Don't logout here - let the caller handle it
        return false;
      }
    });
  };

  // Load auth data from localStorage on mount
  useEffect(() => {
    cleanupDuplicateTokens();
    
    const storedAccessToken = localStorage.getItem("access_token");
    const storedRefreshToken = localStorage.getItem("refresh_token");
    const storedUser = localStorage.getItem("user");
    const storedExpiresAt = localStorage.getItem("tokenExpiresAt");

    if (storedAccessToken && storedUser && storedRefreshToken) {
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

        // Setup refresh callback for rehydrated session
        setupRefreshCallback(storedRefreshToken);
      } catch (error) {
        console.error("Failed to parse stored auth data:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
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
    // Clean up any duplicate tokens first
    cleanupDuplicateTokens();
    
    const expiresAt = Date.now() + expiresIn * 1000;
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(newUser);
    setIsAuthenticated(true);
    setTokenExpiresAt(expiresAt);

    // Clear old tokens before setting new ones
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiresAt");

    // Set new tokens
    localStorage.setItem("access_token", newAccessToken);
    localStorage.setItem("refresh_token", newRefreshToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("tokenExpiresAt", expiresAt.toString());

    console.log("[AuthContext] Login successful - tokens stored:", {
      hasAccessToken: !!newAccessToken,
      hasRefreshToken: !!newRefreshToken,
      expiresAt: new Date(expiresAt).toISOString(),
    });

    scheduleTokenRefresh(expiresAt);
    setupRefreshCallback(newRefreshToken);
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    const currentRefreshToken = localStorage.getItem("refreshToken");
    
    if (!currentRefreshToken) {
      console.warn("[AuthContext] No refresh token available");
      await logout();
      return false;
    }

    try {
      console.log("[AuthContext] Refreshing access token...");
      const response = await authService.refresh(currentRefreshToken);

      const newExpiresAt = Date.now() + response.expires_in * 1000;

      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      setUser(response.user);
      setTokenExpiresAt(newExpiresAt);

      // Clean up old tokens first
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiresAt");

      // Set new tokens
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("tokenExpiresAt", newExpiresAt.toString());

      console.log("[AuthContext] Access token refreshed successfully", {
        expiresAt: new Date(newExpiresAt).toISOString(),
      });

      scheduleTokenRefresh(newExpiresAt);
      
      // Update callback with new refresh token for next refresh
      setupRefreshCallback(response.refresh_token);
      
      return true;
    } catch (error) {
      console.error("[AuthContext] Failed to refresh token:", error);
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
      // Clear httpOnly cookie
      await fetch("/api/auth/logout", { method: "POST" })
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

      // Clear all token-related keys from localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiresAt");
      
      // Clean up any duplicate token keys
      cleanupDuplicateTokens();
      
      console.log("[AuthContext] Logout complete - all tokens cleared");
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

"use client";

import React, { createContext, useState, useCallback, ReactNode } from "react";
import {
  User,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/services/userService";

export interface UserContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: (limit?: number, offset?: number) => Promise<void>;
  addUser: (userData: CreateUserRequest) => Promise<User>;
  editUser: (userId: string, userData: UpdateUserRequest) => Promise<User>;
  removeUser: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (limit: number = 20, offset: number = 0) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getUsers(limit, offset);
        setUsers(result);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch users";
        setError(errorMessage);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addUser = useCallback(
    async (userData: CreateUserRequest): Promise<User> => {
      setLoading(true);
      setError(null);
      try {
        const newUser = await createUser(userData);
        // Add new user to list
        setUsers((prevUsers) => [...prevUsers, newUser as User]);
        return newUser as User;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create user";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const editUser = useCallback(
    async (userId: string, userData: UpdateUserRequest): Promise<User> => {
      setLoading(true);
      setError(null);
      try {
        const updatedUser = await updateUser(userId, userData);
        // Update user in list
        setUsers((prevUsers) =>
          prevUsers.map((user) => (user.id === userId ? updatedUser : user))
        );
        return updatedUser;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update user";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteUser(userId);
      // Remove user from list
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete user";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <UserContext.Provider
      value={{
        users,
        loading,
        error,
        fetchUsers,
        addUser,
        editUser,
        removeUser,
        clearError,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

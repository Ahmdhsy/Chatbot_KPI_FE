import apiClientWithAuth from "./apiClientWithAuth";
import { extractFriendlyErrorMessage } from "@/utils/errorHelper";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "kepala_divisi" | "karyawan";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: "admin" | "kepala_divisi" | "karyawan";
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  role?: "admin" | "kepala_divisi" | "karyawan";
  is_active?: boolean;
}

export interface GetUsersParams {
  limit?: number;
  page?: number;
  search?: string;
  role?: User["role"];
  status?: "active" | "inactive";
}

export interface GetUsersResponse {
  total: number;
  page: number;
  limit: number;
  users: User[];
}

export interface CreateUserResponse {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "kepala_divisi" | "karyawan";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getUsers = async (
  params: GetUsersParams = {}
): Promise<GetUsersResponse> => {
  try {
    const response = await apiClientWithAuth.get<GetUsersResponse>("/api/v1/users", {
      params: {
        limit: params.limit ?? 20,
        page: params.page ?? 1,
        ...(params.search?.trim() ? { search: params.search.trim() } : {}),
        ...(params.role ? { role: params.role } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(extractFriendlyErrorMessage(error, "Gagal memuat daftar user"));
  }
};

export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await apiClientWithAuth.get<User>(`/api/v1/users/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(extractFriendlyErrorMessage(error, "Gagal memuat data user"));
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Gagal memuat user saat ini: ${res.status}`);
    }

    return (await res.json()) as User;
  } catch (error) {
    throw new Error(extractFriendlyErrorMessage(error, "Gagal memuat user saat ini"));
  }
};

export const createUser = async (
  userData: CreateUserRequest
): Promise<CreateUserResponse> => {
  try {
    const response = await apiClientWithAuth.post<CreateUserResponse>(
      "/api/v1/users",
      userData
    );
    return response.data;
  } catch (error) {
    throw new Error(extractFriendlyErrorMessage(error, "Gagal membuat user"));
  }
};

export const updateUser = async (
  userId: string,
  userData: UpdateUserRequest
): Promise<User> => {
  try {
    const response = await apiClientWithAuth.patch<User>(
      `/api/v1/users/${userId}`,
      userData
    );
    return response.data;
  } catch (error) {
    throw new Error(extractFriendlyErrorMessage(error, "Gagal memperbarui user"));
  }
};

export type DeleteUserResult = {
  message: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export const deleteUser = async (userId: string): Promise<DeleteUserResult> => {
  if (!isUuid(userId)) {
    throw new Error("Format user_id tidak valid. Diharapkan format UUID.");
  }

  try {
    const response = await apiClientWithAuth.delete<{ message: string }>(
      `/api/v1/users/${userId}`
    );
    return { message: response.data.message };
  } catch (error) {
    throw new Error(extractFriendlyErrorMessage(error, "Gagal menghapus user"));
  }
};

import apiClientWithAuth from "./apiClientWithAuth";

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
  offset?: number;
  search?: string;
  role?: User["role"];
  status?: "active" | "inactive";
}

export interface GetUsersResponse {
  total: number;
  limit: number;
  offset: number;
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

type FastApiErrorItem = {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
};

function extractErrorMessage(error: unknown, fallback: string): string {
  const maybeError = error as {
    message?: string;
    response?: { data?: { detail?: string | FastApiErrorItem[] } };
  };

  const detail = maybeError?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const mapped = detail
      .map((item) => {
        if (!item) return "";
        const loc = Array.isArray(item.loc) ? item.loc.join(".") : "field";
        return item.msg ? `${loc}: ${item.msg}` : "";
      })
      .filter(Boolean)
      .join("; ");

    if (mapped) {
      return mapped;
    }
  }

  if (typeof maybeError?.message === "string" && maybeError.message.trim()) {
    return maybeError.message;
  }

  return fallback;
}

export const getUsers = async (
  params: GetUsersParams = {}
): Promise<GetUsersResponse> => {
  try {
    const response = await apiClientWithAuth.get<GetUsersResponse>("/api/v1/users", {
      params: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        ...(params.search?.trim() ? { search: params.search.trim() } : {}),
        ...(params.role ? { role: params.role } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to fetch users"));
  }
};

export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await apiClientWithAuth.get<User>(`/api/v1/users/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to fetch user"));
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClientWithAuth.get<User>("/api/v1/users/me");
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to fetch current user"));
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
    throw new Error(extractErrorMessage(error, "Failed to create user"));
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
    throw new Error(extractErrorMessage(error, "Failed to update user"));
  }
};

export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClientWithAuth.delete<{ message: string }>(
      `/api/v1/users/${userId}`
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to delete user"));
  }
};

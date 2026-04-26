import apiClientWithAuth from "./apiClientWithAuth";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "hrd" | "kepala_divisi" | "karyawan";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: "admin" | "hrd" | "kepala_divisi" | "karyawan";
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  role?: "admin" | "hrd" | "kepala_divisi" | "karyawan";
  is_active?: boolean;
}

export interface GetUsersResponse {
  [key: string]: User;
}

export type UsersApiResponse = User[] | GetUsersResponse | { users: User[] } | { data: User[] };

export interface CreateUserResponse {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "hrd" | "kepala_divisi" | "karyawan";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all users with pagination
 * @param limit - Number of users to fetch (default: 20, max: 100)
 * @param offset - Offset for pagination (default: 0)
 */
export const getUsers = async (limit: number = 20, offset: number = 0) => {
  try {
    console.log("[UserService] Fetching users with limit:", limit, "offset:", offset);
    
    // Use limit and offset as query parameters
    const response = await apiClientWithAuth.get<GetUsersResponse>(
      "/api/v1/users",
      {
        params: {
          limit,
          offset,
        },
      }
    );
    
    console.log("[UserService] Users response received:", response.data);
    
    // Handle multiple response formats
    let users: User[] = [];
    const data = response.data as any;
    
    if (Array.isArray(data)) {
      // Format 1: Direct array response
      users = data.filter((item: any): item is User => 
        item && typeof item === 'object' && 'id' in item
      );
    } else if (data?.users && Array.isArray(data.users)) {
      // Format 2: { users: [...] }
      users = data.users.filter((item: any): item is User => 
        item && typeof item === 'object' && 'id' in item
      );
    } else if (data?.data && Array.isArray(data.data)) {
      // Format 3: { data: [...] }
      users = data.data.filter((item: any): item is User => 
        item && typeof item === 'object' && 'id' in item
      );
    } else if (typeof data === 'object' && !Array.isArray(data)) {
      // Format 4: Object with user IDs/usernames as keys { "user1": {...}, "user2": {...} }
      // This is the format returned by the backend: { "additionalProp1": {...} }
      users = Object.values(data)
        .filter((item: any) => item && typeof item === 'object')
        .filter((item: any): item is User => 'id' in item);
    }
    
    console.log("[UserService] Parsed users, count:", users.length);
    return users;
  } catch (error: any) {
    console.error("[UserService] Error fetching users:");
    console.error("  Status:", error?.response?.status);
    console.error("  Response Data:", error?.response?.data);
    console.error("  Message:", error?.message);
    
    // Log detail validation errors dari FastAPI
    if (error?.response?.data?.detail && Array.isArray(error.response.data.detail)) {
      console.error("[UserService] Validation Details:");
      error.response.data.detail.forEach((err: any, idx: number) => {
        console.error(`  [${idx}] Location:`, err.loc, "Message:", err.msg, "Type:", err.type);
      });
    }
    
    // If we got 422, try without query params (some backends don't support them)
    if (error?.response?.status === 422) {
      console.log("[UserService] Got 422, trying without query params...");
      try {
        const fallbackResponse = await apiClientWithAuth.get<GetUsersResponse>(
          "/api/v1/users"
        );
        console.log("[UserService] Fallback request successful!");
        
        let users: User[] = [];
        const fallbackData = fallbackResponse.data as any;
        
        if (Array.isArray(fallbackData)) {
          users = fallbackData.filter((item: any): item is User => 
            item && typeof item === 'object' && 'id' in item
          );
        } else if (fallbackData?.users && Array.isArray(fallbackData.users)) {
          users = fallbackData.users.filter((item: any): item is User => 
            item && typeof item === 'object' && 'id' in item
          );
        } else if (fallbackData?.data && Array.isArray(fallbackData.data)) {
          users = fallbackData.data.filter((item: any): item is User => 
            item && typeof item === 'object' && 'id' in item
          );
        } else if (typeof fallbackData === 'object' && !Array.isArray(fallbackData)) {
          users = Object.values(fallbackData)
            .filter((item: any) => item && typeof item === 'object')
            .filter((item: any): item is User => 'id' in item);
        }
        return users;
      } catch (fallbackError: any) {
        console.error("[UserService] Fallback also failed:", fallbackError?.message);
        
        // Log fallback validation errors too
        if (fallbackError?.response?.data?.detail && Array.isArray(fallbackError.response.data.detail)) {
          console.error("[UserService] Fallback Validation Details:");
          fallbackError.response.data.detail.forEach((err: any, idx: number) => {
            console.error(`  [${idx}] Location:`, err.loc, "Message:", err.msg);
          });
        }
      }
    }
    
    // Extract error message from FastAPI validation error
    let errorMessage = "Failed to fetch users";
    
    if (error?.response?.data?.detail) {
      const detail = error.response.data.detail;
      
      // If detail is an array (FastAPI validation errors)
      if (Array.isArray(detail)) {
        errorMessage = detail.map((err: any) => 
          `${err.loc?.join('.')} - ${err.msg}`
        ).join('; ');
      } else if (typeof detail === 'string') {
        // If detail is a string
        errorMessage = detail;
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Get a specific user by ID
 * @param userId - User ID to fetch
 */
export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await apiClientWithAuth.get<User>(
      `/api/v1/users/${userId}`
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.detail?.[0]?.msg ||
      error?.message ||
      "Failed to fetch user";
    throw new Error(errorMessage);
  }
};

/**
 * Create a new user (Admin only)
 * @param userData - User data to create
 */
export const createUser = async (
  userData: CreateUserRequest
): Promise<CreateUserResponse> => {
  try {
    const response = await apiClientWithAuth.post<CreateUserResponse>(
      "/api/v1/users",
      userData
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.detail?.[0]?.msg ||
      error?.message ||
      "Failed to create user";
    throw new Error(errorMessage);
  }
};

/**
 * Update a user
 * @param userId - User ID to update
 * @param userData - Updated user data
 */
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
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.detail?.[0]?.msg ||
      error?.message ||
      "Failed to update user";
    throw new Error(errorMessage);
  }
};

/**
 * Delete a user
 * @param userId - User ID to delete
 */
export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClientWithAuth.delete<{ message: string }>(
      `/api/v1/users/${userId}`
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.detail?.[0]?.msg ||
      error?.message ||
      "Failed to delete user";
    throw new Error(errorMessage);
  }
};

/**
 * Get current logged in user
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClientWithAuth.get<User>(
      "/api/v1/users/me"
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.detail ||
      error?.message ||
      "Failed to fetch current user";
    throw new Error(errorMessage);
  }
};

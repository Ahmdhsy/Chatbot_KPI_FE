import apiClientWithAuth from "./apiClientWithAuth";

export type ChatbotAuthority = "HRD" | "Karyawan";

export interface Chatbot {
  id: string;
  nama_chatbot: string;
  otoritas: ChatbotAuthority;
  addon_prompt: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetChatbotsParams {
  page?: number;
  page_size?: number;
  otoritas?: ChatbotAuthority;
  search?: string;
}

export interface GetChatbotsResponse {
  data: Chatbot[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateChatbotRequest {
  nama_chatbot: string;
  otoritas: ChatbotAuthority;
  addon_prompt?: string;
}

export interface UpdateChatbotRequest {
  nama_chatbot?: string;
  otoritas?: ChatbotAuthority;
  addon_prompt?: string;
  is_active?: boolean;
}

export interface DeleteChatbotResponse {
  message: string;
  success: boolean;
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

export async function getChatbots(
  params: GetChatbotsParams = {}
): Promise<GetChatbotsResponse> {
  try {
    const response = await apiClientWithAuth.get<GetChatbotsResponse>(
      "/api/v1/chatbots/",
      {
        params: {
          page: params.page ?? 1,
          page_size: params.page_size ?? 10,
          ...(params.otoritas ? { otoritas: params.otoritas } : {}),
          ...(params.search?.trim() ? { search: params.search.trim() } : {}),
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to fetch chatbots"));
  }
}

export async function getChatbotById(chatbotId: string): Promise<Chatbot> {
  try {
    const response = await apiClientWithAuth.get<Chatbot>(
      `/api/v1/chatbots/${chatbotId}`
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to fetch chatbot"));
  }
}

export async function createChatbot(
  payload: CreateChatbotRequest
): Promise<Chatbot> {
  try {
    const response = await apiClientWithAuth.post<Chatbot>(
      "/api/v1/chatbots/",
      payload
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to create chatbot"));
  }
}

export async function updateChatbot(
  chatbotId: string,
  payload: UpdateChatbotRequest
): Promise<Chatbot> {
  try {
    const response = await apiClientWithAuth.patch<Chatbot>(
      `/api/v1/chatbots/${chatbotId}`,
      payload
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to update chatbot"));
  }
}

export async function deleteChatbot(
  chatbotId: string,
  hard: boolean = false
): Promise<DeleteChatbotResponse> {
  try {
    const response = await apiClientWithAuth.delete<DeleteChatbotResponse>(
      `/api/v1/chatbots/${chatbotId}`,
      {
        params: { hard },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to delete chatbot"));
  }
}

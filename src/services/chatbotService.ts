import apiClientWithAuth from "./apiClientWithAuth";
import { extractFriendlyErrorMessage } from "@/utils/errorHelper";

export type ChatbotAuthority = "kepala_divisi" | "karyawan";

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
  authority?: ChatbotAuthority;
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
  chatbot_name: string;
  authority: ChatbotAuthority;
  addon_prompt?: string;
}

export interface UpdateChatbotRequest {
  chatbot_name?: string;
  authority?: ChatbotAuthority;
  addon_prompt?: string;
  is_active?: boolean;
}

export interface DeleteChatbotResponse {
  message: string;
  success: boolean;
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
          ...(params.authority ? { authority: params.authority } : {}),
          ...(params.search?.trim() ? { search: params.search.trim() } : {}),
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(extractFriendlyErrorMessage(error, "Gagal memuat daftar chatbot"));
  }
}

export async function getChatbotById(chatbotId: string): Promise<Chatbot> {
  try {
    const response = await apiClientWithAuth.get<Chatbot>(
      `/api/v1/chatbots/${chatbotId}`
    );
    return response.data;
  } catch (error) {
    throw new Error(extractFriendlyErrorMessage(error, "Gagal memuat data chatbot"));
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
    throw new Error(extractFriendlyErrorMessage(error, "Gagal membuat chatbot"));
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
    throw new Error(extractFriendlyErrorMessage(error, "Gagal memperbarui chatbot"));
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
    throw new Error(extractFriendlyErrorMessage(error, "Gagal menghapus chatbot"));
  }
}

import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ChatbotsClient from "@/components/chatbot/ChatbotsClient";
import { serverFetch } from "@/lib/server-api";
import { GetChatbotsResponse } from "@/services/chatbotService";

const fallbackData: GetChatbotsResponse = {
  data: [],
  total: 0,
  page: 1,
  page_size: 10,
  total_pages: 1,
};

function isChatbotsListResponse(value: unknown): value is GetChatbotsResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<GetChatbotsResponse>;
  return (
    Array.isArray(candidate.data) &&
    typeof candidate.total === "number" &&
    typeof candidate.page === "number" &&
    typeof candidate.page_size === "number" &&
    typeof candidate.total_pages === "number"
  );
}

export default async function ChatbotsPage() {
  let initialData: GetChatbotsResponse = fallbackData;

  try {
    const data = await serverFetch<unknown>("/api/v1/chatbots/?page=1&page_size=10");
    if (isChatbotsListResponse(data)) {
      initialData = data;
    }
  } catch {
    initialData = fallbackData;
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Chatbot Management" />
      <ChatbotsClient initialData={initialData} />
    </>
  );
}

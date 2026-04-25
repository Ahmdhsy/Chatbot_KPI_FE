"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import { useToast } from "@/context/ToastContext";
import { useHeaderSearch } from "@/context/HeaderSearchContext";
import {
  Chatbot,
  GetChatbotsResponse,
  getChatbots,
} from "@/services/chatbotService";
import ChatbotTable from "@/components/chatbot/ChatbotTable";
import CreateChatbotModal from "@/components/chatbot/CreateChatbotModal";
import EditChatbotModal from "@/components/chatbot/EditChatbotModal";
import DeleteChatbotModal from "@/components/chatbot/DeleteChatbotModal";

interface ChatbotsClientProps {
  initialData: GetChatbotsResponse;
}

const PAGE_SIZE = 10;
const FETCH_PAGE_SIZE = 100;

function getAuthorityAliases(otoritas: string) {
  const normalized = otoritas.toLowerCase().trim();
  const aliases = [normalized];

  if (normalized === "kepala_divisi" || normalized === "kepala-divisi") {
    aliases.push("kepala divisi");
  }

  return aliases;
}

function getChatbotStatusAliases(isActive: boolean) {
  return isActive
    ? ["active", "aktif"]
    : ["inactive", "nonactive", "non-active", "unactive", "nonaktif", "tidak aktif"];
}

function matchesChatbotQuery(chatbot: Chatbot, query: string) {
  if (!query) return true;

  const text = [
    chatbot.id,
    chatbot.nama_chatbot,
    ...(chatbot.addon_prompt ? [chatbot.addon_prompt] : []),
    ...getAuthorityAliases(chatbot.otoritas),
    ...getChatbotStatusAliases(chatbot.is_active),
  ]
    .join(" ")
    .toLowerCase();

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every((term) => text.includes(term));
}

export default function ChatbotsClient({ initialData }: ChatbotsClientProps) {
  const { addToast } = useToast();
  const { query, registerScope } = useHeaderSearch();

  const [allChatbots, setAllChatbots] = useState<Chatbot[]>(initialData.data);
  const [loading, setLoading] = useState(initialData.data.length === 0);
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);

  const normalizedQuery = query.trim();

  const fetchAllChatbots = useCallback(async () => {
    setLoading(true);

    try {
      let page = 1;
      let totalPages = 1;
      const collected: Chatbot[] = [];

      do {
        const response = await getChatbots({
          page,
          page_size: FETCH_PAGE_SIZE,
        });

        collected.push(...response.data);
        totalPages = response.total_pages || 1;
        page += 1;
      } while (page <= totalPages);

      setAllChatbots(collected);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat data chatbot";
      addToast("error", message, "Error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void fetchAllChatbots();
  }, [fetchAllChatbots]);

  const filteredChatbots = useMemo(
    () => allChatbots.filter((chatbot) => matchesChatbotQuery(chatbot, normalizedQuery)),
    [allChatbots, normalizedQuery]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredChatbots.length / PAGE_SIZE)),
    [filteredChatbots.length]
  );
  const activePage = Math.min(currentPage, totalPages);

  const currentPageChatbots = useMemo(
    () =>
      filteredChatbots.slice(
        (activePage - 1) * PAGE_SIZE,
        activePage * PAGE_SIZE
      ),
    [activePage, filteredChatbots]
  );

  useEffect(() => {
    return registerScope({
      id: "chatbots-management",
      label: "Chatbot Management",
      getMatchCount: (searchText: string) =>
        allChatbots.filter((chatbot) => matchesChatbotQuery(chatbot, searchText.trim()))
          .length,
    });
  }, [allChatbots, registerScope]);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery]);

  const refreshCurrentPage = async () => {
    await fetchAllChatbots();
  };

  return (
    <>
      <ComponentCard
        title="Chatbots"
        subtitle="Manage chatbot prompt dan otoritas"
        actionButton={{
          label: "Add New Chatbot",
          onClick: () => setIsCreateOpen(true),
          variant: "primary",
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading chatbots...</p>
          </div>
        ) : currentPageChatbots.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No chatbot found. Create one to get started.
            </p>
          </div>
        ) : (
          <ChatbotTable
            chatbots={currentPageChatbots}
            onEdit={(chatbot) => {
              setSelectedChatbot(chatbot);
              setIsEditOpen(true);
            }}
            onDelete={(chatbot) => {
              setSelectedChatbot(chatbot);
              setIsDeleteOpen(true);
            }}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total {filteredChatbots.length} chatbot(s)
          </p>
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </ComponentCard>

      <CreateChatbotModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshCurrentPage}
      />

      {selectedChatbot && (
        <>
          <EditChatbotModal
            isOpen={isEditOpen}
            chatbot={selectedChatbot}
            onClose={() => {
              setIsEditOpen(false);
              setSelectedChatbot(null);
            }}
            onSuccess={refreshCurrentPage}
          />

          <DeleteChatbotModal
            isOpen={isDeleteOpen}
            chatbot={selectedChatbot}
            onClose={() => {
              setIsDeleteOpen(false);
              setSelectedChatbot(null);
            }}
            onSuccess={refreshCurrentPage}
          />
        </>
      )}
    </>
  );
}

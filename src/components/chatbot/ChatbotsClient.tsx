"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import { useToast } from "@/context/ToastContext";
import {
  Chatbot,
  ChatbotAuthority,
  GetChatbotsResponse,
  getChatbots,
} from "@/services/chatbotService";
import ChatbotTable from "@/components/chatbot/ChatbotTable";
import CreateChatbotModal from "@/components/chatbot/CreateChatbotModal";
import EditChatbotModal from "@/components/chatbot/EditChatbotModal";
import DeleteChatbotModal from "@/components/chatbot/DeleteChatbotModal";
import ChatbotDetailDrawer from "@/components/chatbot/ChatbotDetailDrawer";

interface ChatbotsClientProps {
  initialData: GetChatbotsResponse;
}

const PAGE_SIZE = 10;

export default function ChatbotsClient({ initialData }: ChatbotsClientProps) {
  const { addToast } = useToast();

  const [chatbots, setChatbots] = useState<Chatbot[]>(initialData.data ?? []);
  const [total, setTotal] = useState(initialData.total ?? 0);
  const [currentPage, setCurrentPage] = useState(initialData.page || 1);
  const [authorityFilter, setAuthorityFilter] = useState<"" | ChatbotAuthority>("");
  const [loading, setLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [authorityFilter]);

  const fetchChatbots = useCallback(async (page: number) => {
    setLoading(true);

    try {
      const response = await getChatbots({
        page,
        page_size: PAGE_SIZE,
        ...(authorityFilter ? { authority: authorityFilter } : {}),
      });

      setChatbots(response.data);
      setTotal(response.total);
      setCurrentPage(response.page);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat data chatbot";
      addToast("error", message, "Error");
      setChatbots([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [addToast, authorityFilter]);

  useEffect(() => {
    void fetchChatbots(currentPage);
  }, [currentPage, fetchChatbots]);

  const refreshCurrentPage = async () => {
    await fetchChatbots(currentPage);
  };

  return (
    <>
      <ComponentCard
        title="Chatbot"
        subtitle="Manajemen chatbot prompt dan otoritas"
        actionButton={{
          label: "Tambah Chatbot Baru",
          onClick: () => setIsCreateOpen(true),
          variant: "primary",
        }}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={authorityFilter}
            onChange={(event) =>
              setAuthorityFilter(event.target.value as "" | ChatbotAuthority)
            }
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-300"
          >
            <option value="">Semua Otoritas</option>
            <option value="kepala_divisi">Kepala Divisi</option>
            <option value="karyawan">Karyawan</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Memuat chatbot...</p>
          </div>
        ) : chatbots.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Chatbot tidak ditemukan. Sesuaikan filter atau tambah chatbot baru.
            </p>
          </div>
        ) : (
          <ChatbotTable
            chatbots={chatbots}
            onViewDetail={(chatbot) => {
              setSelectedChatbot(chatbot);
              setIsDetailOpen(true);
            }}
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
            Total {total} chatbot
          </p>
          <Pagination
            currentPage={Math.min(currentPage, totalPages)}
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

      <ChatbotDetailDrawer
        isOpen={isDetailOpen}
        chatbotId={selectedChatbot?.id ?? null}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedChatbot(null);
        }}
      />
    </>
  );
}

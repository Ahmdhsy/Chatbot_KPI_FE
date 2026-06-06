"use client";

import React, { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { Chatbot, deleteChatbot } from "@/services/chatbotService";

interface DeleteChatbotModalProps {
  isOpen: boolean;
  chatbot: Chatbot;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeleteChatbotModal({
  isOpen,
  chatbot,
  onClose,
  onSuccess,
}: DeleteChatbotModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await deleteChatbot(chatbot.id, false);
      const name = chatbot.nama_chatbot || "Chatbot";
      addToast(
        "success",
        response.message || `Chatbot \"${name}\" berhasil dinonaktifkan`,
        "Success",
      );
      onClose();
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus chatbot";
      addToast("error", message, "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
  <div className="fixed inset-0 backdrop-blur-sm z-[100000]" onClick={handleClose} />
  <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full pointer-events-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900 px-6 py-4">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
              Delete Chatbot
            </h2>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Apakah Anda yakin ingin menghapus chatbot ini?
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {chatbot.nama_chatbot}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Authority: {chatbot.otoritas}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete Chatbot"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

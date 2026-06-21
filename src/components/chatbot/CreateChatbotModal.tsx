"use client";

import React, { useState } from "react";
import { useToast } from "@/context/ToastContext";
import {
  ChatbotAuthority,
  CreateChatbotRequest,
  createChatbot,
} from "@/services/chatbotService";

interface CreateChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateChatbotModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateChatbotModalProps) {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateChatbotRequest>({
    chatbot_name: "",
    authority: "kepala_divisi",
    addon_prompt: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      // Ensure authority type is correct for radio button
      if (name === "authority" && (value === "kepala_divisi" || value === "karyawan")) {
        return {
          ...prev,
          [name]: value as ChatbotAuthority,
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.chatbot_name.trim()) {
      newErrors.chatbot_name = "Nama chatbot wajib diisi";
    }
    if (!formData.authority) {
      newErrors.authority = "Otoritas wajib dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await createChatbot({
        chatbot_name: formData.chatbot_name.trim(),
        authority: formData.authority as ChatbotAuthority,
        addon_prompt: formData.addon_prompt?.trim() || "",
      });

      addToast("success", "Chatbot berhasil dibuat", "Sukses");
      onClose();
      onSuccess?.();
      setFormData({
        chatbot_name: "",
        authority: "kepala_divisi",
        addon_prompt: "",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal membuat chatbot";
      addToast("error", message, "Error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
  <div className="fixed inset-0 backdrop-blur-sm z-[100000]" onClick={onClose} />
  <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tambah Chatbot Baru
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Chatbot *
              </label>
              <input
                type="text"
                name="chatbot_name"
                value={formData.chatbot_name}
                onChange={handleChange}
                disabled={loading}
                placeholder="Contoh: HR Assistant"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.chatbot_name
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.chatbot_name && (
                <p className="text-red-500 text-sm mt-1">{errors.chatbot_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Otoritas *
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="authority_kepala_divisi"
                    name="authority"
                    value="kepala_divisi"
                    checked={formData.authority === "kepala_divisi"}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-4 w-4 text-brand-500 rounded"
                  />
                  <label
                    htmlFor="authority_kepala_divisi"
                    className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Kepala Divisi
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="authority_karyawan"
                    name="authority"
                    value="karyawan"
                    checked={formData.authority === "karyawan"}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-4 w-4 text-brand-500 rounded"
                  />
                  <label
                    htmlFor="authority_karyawan"
                    className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Karyawan
                  </label>
                </div>
              </div>
              {errors.authority && (
                <p className="text-red-500 text-sm mt-2">{errors.authority}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Addon Prompt
              </label>
              <textarea
                name="addon_prompt"
                value={formData.addon_prompt ?? ""}
                onChange={handleChange}
                disabled={loading}
                rows={4}
                placeholder="Tambahan prompt opsional untuk chatbot..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Tambah Chatbot"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

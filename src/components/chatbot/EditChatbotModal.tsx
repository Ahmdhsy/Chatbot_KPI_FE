"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import {
  Chatbot,
  ChatbotAuthority,
  UpdateChatbotRequest,
  updateChatbot,
} from "@/services/chatbotService";

interface EditChatbotModalProps {
  isOpen: boolean;
  chatbot: Chatbot;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditChatbotModal({
  isOpen,
  chatbot,
  onClose,
  onSuccess,
}: EditChatbotModalProps) {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateChatbotRequest>({
    nama_chatbot: "",
    otoritas: "HRD",
    addon_prompt: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nama_chatbot: chatbot.nama_chatbot,
        otoritas: chatbot.otoritas,
        addon_prompt: chatbot.addon_prompt ?? "",
        is_active: chatbot.is_active,
      });
      setErrors({});
    }
  }, [chatbot, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const nextValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama_chatbot?.trim()) {
      newErrors.nama_chatbot = "Nama chatbot wajib diisi";
    }
    if (!formData.otoritas) {
      newErrors.otoritas = "Otoritas wajib dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await updateChatbot(chatbot.id, {
        nama_chatbot: formData.nama_chatbot?.trim(),
        otoritas: formData.otoritas as ChatbotAuthority,
        addon_prompt: formData.addon_prompt?.trim() || "",
        is_active: formData.is_active,
      });

      addToast("success", "Chatbot berhasil diupdate", "Success");
      onClose();
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengupdate chatbot";
      addToast("error", message, "Error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Chatbot
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
                name="nama_chatbot"
                value={formData.nama_chatbot ?? ""}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.nama_chatbot
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.nama_chatbot && (
                <p className="text-red-500 text-sm mt-1">{errors.nama_chatbot}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Otoritas *
              </label>
              <select
                name="otoritas"
                value={formData.otoritas}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.otoritas
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="HRD">HRD</option>
                <option value="Karyawan">Karyawan</option>
              </select>
              {errors.otoritas && (
                <p className="text-red-500 text-sm mt-1">{errors.otoritas}</p>
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="chatbot_is_active"
                name="is_active"
                checked={Boolean(formData.is_active)}
                onChange={handleChange}
                disabled={loading}
                className="h-4 w-4 text-brand-500 rounded"
              />
              <label
                htmlFor="chatbot_is_active"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Active
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

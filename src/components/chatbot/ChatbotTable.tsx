"use client";

import React from "react";
import { Chatbot } from "@/services/chatbotService";
import { ChatIcon } from "@/icons";

interface ChatbotTableProps {
  chatbots: Chatbot[];
  onEdit: (chatbot: Chatbot) => void;
  onDelete: (chatbot: Chatbot) => void;
}

function truncateText(value: string | null, max: number = 72): string {
  if (!value) return "-";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

export default function ChatbotTable({
  chatbots,
  onEdit,
  onDelete,
}: ChatbotTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAuthorityBadgeColor = (authority: Chatbot["otoritas"]) => {
    switch (authority) {
      case "HRD":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Karyawan":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Chatbot
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Otoritas
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Addon Prompt
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Updated
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {chatbots.map((chatbot) => (
            <tr
              key={chatbot.id}
              className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                    <ChatIcon className="h-5 w-5 text-brand-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {chatbot.nama_chatbot}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {chatbot.id}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getAuthorityBadgeColor(
                    chatbot.otoritas
                  )}`}
                >
                  {chatbot.otoritas}
                </span>
              </td>
              <td className="px-6 py-4">
                <p
                  className="text-gray-600 dark:text-gray-300 text-sm max-w-[320px]"
                  title={chatbot.addon_prompt ?? ""}
                >
                  {truncateText(chatbot.addon_prompt)}
                </p>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                    chatbot.is_active
                  )}`}
                >
                  {chatbot.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {formatDate(chatbot.updated_at)}
                </p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(chatbot)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(chatbot)}
                    className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

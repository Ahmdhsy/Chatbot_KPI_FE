"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { User } from "@/services/userService";

interface DeleteUserModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
}

export default function DeleteUserModal({
  isOpen,
  user,
  onClose,
}: DeleteUserModalProps) {
  const { removeUser, loading } = useUser();
  const { addToast } = useToast();

  const handleDelete = async () => {
    try {
      await removeUser(user.id);
      addToast("success", "User deleted successfully", "Success");
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete user";
      addToast("error", errorMessage, "Error");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop dengan blur effect */}
      <div
        className="fixed inset-0 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full pointer-events-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900 px-6 py-4">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
              Delete User
            </h2>
          </div>

          <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Are you sure you want to delete this user?
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.full_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="animate-spin">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </span>
              )}
              {loading ? "Deleting..." : "Delete User"}
            </button>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}

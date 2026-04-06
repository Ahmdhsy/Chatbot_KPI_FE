"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { User, UpdateUserRequest } from "@/services/userService";

interface EditUserModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
}

export default function EditUserModal({
  isOpen,
  user,
  onClose,
}: EditUserModalProps) {
  const { editUser, loading } = useUser();
  const { addToast } = useToast();

  const [formData, setFormData] = useState<UpdateUserRequest>({
    full_name: "",
    email: "",
    role: "user",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with user data
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const inputValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name?.trim()) {
      newErrors.full_name = "Full name is required";
    }
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await editUser(user.id, formData);
      addToast("success", "User updated successfully", "Success");
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user";
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit User
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
          {/* Username (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username (Read-only)
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name || ""}
              onChange={handleChange}
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.full_name
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter full name"
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Role *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="role"
                  checked={formData.role === "admin"}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      role: e.target.checked ? "admin" : "user",
                    }));
                  }}
                  disabled={loading}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Admin
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {formData.role === "admin" ? "User will have admin privileges" : "User will have standard user privileges"}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active || false}
              onChange={handleChange}
              disabled={loading}
              className="h-4 w-4 text-brand-500 rounded"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Active
            </label>
          </div>

          {/* Actions */}
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
              className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}

"use client";

import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { CreateUserRequest } from "@/services/userService";
import { EyeIcon, EyeCloseIcon } from "@/icons";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const { addUser, loading } = useUser();
  const { addToast } = useToast();

  const [formData, setFormData] = useState<CreateUserRequest>({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role: "karyawan",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordShake, setPasswordShake] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear password alert / shake when user types into password
    if (name === "password") {
      if (passwordAlert) setPasswordAlert(null);
      if (passwordShake) setPasswordShake(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    setErrors(newErrors);

    // Check password separately and show inline alert instead of global toast
    if (!formData.password) {
      const msg = "Password is required";
      setPasswordAlert(msg);
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 500);
      setTimeout(() => setPasswordAlert(null), 4000);
      return false;
    } else if (formData.password.length < 6) {
      const msg = "Password must be at least 6 characters";
      setPasswordAlert(msg);
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 500);
      setTimeout(() => setPasswordAlert(null), 4000);
      return false;
    } else if (!/[A-Z]/.test(formData.password)) {
      const msg = "Password must include at least one uppercase letter";
      setPasswordAlert(msg);
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 500);
      setTimeout(() => setPasswordAlert(null), 4000);
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await addUser(formData);
      addToast("success", "User created successfully", "Success");
      onClose();
      onSuccess?.();
      setFormData({
        username: "",
        email: "",
        full_name: "",
        password: "",
        role: "karyawan",
      });
    } catch (error) {
      const axiosError = error as { response?: { status?: number; data?: { detail?: unknown } } }
      let errorMessage = "Failed to create user";
      let passwordError: string | null = null;

      // Handle 422 validation errors from FastAPI
      if (axiosError?.response?.status === 422 && axiosError?.response?.data?.detail) {
        const details = axiosError.response.data.detail;

        if (Array.isArray(details)) {
          // FastAPI returns array of validation errors
          for (const err of details) {
            const fieldPath = Array.isArray(err.loc) ? err.loc.join('.') : String(err.loc);
            const errorMsg = err.msg || "Validation error";

            // Check if it's a password-related error
            if (fieldPath.toLowerCase().includes('password')) {
              passwordError = errorMsg;
            } else {
              // For other fields, show as toast but remember the message
              errorMessage = `${fieldPath}: ${errorMsg}`;
            }
          }
        } else if (typeof details === 'string') {
          errorMessage = details;
        }
      } else {
        // Other error types
        errorMessage = error instanceof Error ? error.message : String(axiosError?.response?.data?.detail || "Failed to create user");
      }

      // If we found a password error, show it inline with shake
      if (passwordError) {
        setPasswordAlert(passwordError);
        setPasswordShake(true);
        setTimeout(() => setPasswordShake(false), 500);
        setTimeout(() => setPasswordAlert(null), 6000);
      } else if (errorMessage) {
        // Show other errors as toast
        addToast("error", errorMessage, "Error");
      }
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
              Create New User
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
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.username
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter username"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
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
              value={formData.full_name}
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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password * <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(min 6 chars, must include uppercase)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  passwordShake ? "animate-shake border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? (
                  <EyeIcon className="w-5 h-5 fill-current" />
                ) : (
                  <EyeCloseIcon className="w-5 h-5 fill-current" />
                )}
              </button>
            </div>
            {passwordAlert && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4.25a.75.75 0 011.5 0v.25a.75.75 0 01-1.5 0v-.25zM9.25 6.5a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0v-5z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  {passwordAlert}
                </div>
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.role
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <option value="karyawan">Karyawan</option>
              <option value="hrd">HRD</option>
              <option value="kepala_divisi">Kepala Divisi</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role}</p>
            )}
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
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}

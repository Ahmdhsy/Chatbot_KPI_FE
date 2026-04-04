"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import CreateUserModal from "@/components/user/CreateUserModal";
import EditUserModal from "@/components/user/EditUserModal";
import DeleteUserModal from "@/components/user/DeleteUserModal";
import UserTable from "@/components/user/UserTable";
import { User } from "@/services/userService";

export default function UsersPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { users, loading, error, fetchUsers, clearError } = useUser();
  const { addToast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Check authorization
  useEffect(() => {
    if (authUser && authUser.role !== "admin") {
      router.push("/");
      return;
    }
  }, [authUser, router]);

  // Fetch users on mount only if authenticated and is admin
  useEffect(() => {
    if (authUser && authUser.role === "admin") {
      fetchUsers();
    }
  }, [authUser, fetchUsers]);

  // Handle error display
  useEffect(() => {
    if (error) {
      addToast("error", error, "Error");
      clearError();
    }
  }, [error, addToast, clearError]);

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  return (
    <>
      <PageBreadCrumb pageTitle="User Management" />

      <ComponentCard
        title="Users"
        subtitle="Manage all system users"
        actionButton={{
          label: "Add New User",
          onClick: handleCreateClick,
          variant: "primary",
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No users found. Create one to get started.
            </p>
          </div>
        ) : (
          <UserTable
            users={users}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </ComponentCard>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {selectedUser && (
        <>
          <EditUserModal
            isOpen={isEditModalOpen}
            user={selectedUser}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
          />

          <DeleteUserModal
            isOpen={isDeleteModalOpen}
            user={selectedUser}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedUser(null);
            }}
          />
        </>
      )}
    </>
  );
}

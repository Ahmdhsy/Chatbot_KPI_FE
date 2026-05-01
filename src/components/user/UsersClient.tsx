"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import ComponentCard from "@/components/common/ComponentCard"
import CreateUserModal from "@/components/user/CreateUserModal"
import EditUserModal from "@/components/user/EditUserModal"
import DeleteUserModal from "@/components/user/DeleteUserModal"
import UserTable from "@/components/user/UserTable"
import { User } from "@/services/userService"

interface Props {
  initialUsers: User[]
}

export default function UsersClient({ initialUsers }: Props) {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  return (
    <>
      <ComponentCard
        title="Users"
        subtitle="Manage all system users"
        actionButton={{
          label: "Add New User",
          onClick: () => setIsCreateModalOpen(true),
          variant: "primary",
        }}
      >
        {initialUsers.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No users found. Create one to get started.
            </p>
          </div>
        ) : (
          <UserTable
            users={initialUsers}
            onEdit={(user) => {
              setSelectedUser(user)
              setIsEditModalOpen(true)
            }}
            onDelete={(user) => {
              setSelectedUser(user)
              setIsDeleteModalOpen(true)
            }}
          />
        )}
      </ComponentCard>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => router.refresh()}
      />

      {selectedUser && (
        <>
          <EditUserModal
            isOpen={isEditModalOpen}
            user={selectedUser}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedUser(null)
            }}
            onSuccess={() => router.refresh()}
          />
          <DeleteUserModal
            isOpen={isDeleteModalOpen}
            user={selectedUser}
            onClose={() => {
              setIsDeleteModalOpen(false)
              setSelectedUser(null)
            }}
            onSuccess={() => router.refresh()}
          />
        </>
      )}
    </>
  )
}

"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import ComponentCard from "@/components/common/ComponentCard"
import Pagination from "@/components/tables/Pagination"
import CreateUserModal from "@/components/user/CreateUserModal"
import EditUserModal from "@/components/user/EditUserModal"
import DeleteUserModal from "@/components/user/DeleteUserModal"
import UserTable from "@/components/user/UserTable"
import { User } from "@/services/userService"
import { useHeaderSearch } from "@/context/HeaderSearchContext"

interface Props {
  initialUsers: User[]
}

const PAGE_SIZE = 10

function getUserRoleAliases(roleValue: string) {
  const normalizedRole = roleValue.toLowerCase();
  const aliases = [normalizedRole];

  if (normalizedRole === "karyawan") {
    aliases.push("user", "karyawan");
  }
  if (normalizedRole === "hrd") {
    aliases.push("hrd");
  }
  if (normalizedRole === "kepala_divisi" || normalizedRole === "kepala-divisi") {
    aliases.push("kepala divisi", "kepala_divisi", "kepala-divisi");
  }
  if (normalizedRole === "admin") {
    aliases.push("admin");
  }

  return aliases;
}

function getUserStatusAliases(isActive: boolean) {
  return isActive
    ? ["active", "aktif"]
    : ["inactive", "nonactive", "non-active", "unactive", "nonaktif", "tidak aktif"];
}

function matchesUserQuery(user: User, query: string) {
  if (!query) return true

  const roleAliases = getUserRoleAliases(String(user.role))
  const statusAliases = getUserStatusAliases(user.is_active)
  const userText = [
    user.full_name,
    user.username,
    user.email,
    ...roleAliases,
    ...statusAliases,
  ].join(" ").toLowerCase()

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  return terms.every((term) => userText.includes(term))
}

export default function UsersClient({ initialUsers }: Props) {
  const router = useRouter()
  const { query, registerScope } = useHeaderSearch()
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const normalizedQuery = query.trim()

  const filteredUsers = useMemo(
    () => initialUsers.filter((user) => matchesUserQuery(user, normalizedQuery)),
    [initialUsers, normalizedQuery],
  )
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const currentPageUsers = filteredUsers.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE,
  )

  useEffect(() => {
    return registerScope({
      id: "users-management",
      label: "User Management",
      getMatchCount: (searchText: string) => {
        const normalizedSearchText = searchText.trim()
        if (!normalizedSearchText) {
          return initialUsers.length
        }
        return initialUsers.filter((user) => matchesUserQuery(user, normalizedSearchText))
          .length
      },
    })
  }, [initialUsers, registerScope])

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
        {currentPageUsers.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No users found. Create one to get started.
            </p>
          </div>
        ) : (
          <UserTable
            users={currentPageUsers}
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total {filteredUsers.length} user(s)
          </p>
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
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

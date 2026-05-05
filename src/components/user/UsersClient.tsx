"use client"
import React, { useEffect, useMemo, useState } from "react"
import ComponentCard from "@/components/common/ComponentCard"
import Pagination from "@/components/tables/Pagination"
import CreateUserModal from "@/components/user/CreateUserModal"
import EditUserModal from "@/components/user/EditUserModal"
import DeleteUserModal from "@/components/user/DeleteUserModal"
import UserDetailDrawer from "@/components/user/UserDetailDrawer"
import UserTable from "@/components/user/UserTable"
import Input from "@/components/form/input/InputField"
import { GetUsersResponse, User, getUsers } from "@/services/userService"
import { useToast } from "@/context/ToastContext"

interface Props {
  initialData: GetUsersResponse
}

const PAGE_SIZE = 10

export default function UsersClient({ initialData }: Props) {
  const { addToast } = useToast()

  const [users, setUsers] = useState<User[]>(initialData.users ?? [])
  const [total, setTotal] = useState(initialData.total ?? 0)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"" | User["role"]>("")
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("")
  const [loading, setLoading] = useState(false)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const normalizedQuery = search.trim()

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [normalizedQuery, roleFilter, statusFilter])

  useEffect(() => {
    let isCancelled = false

    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await getUsers({
          limit: PAGE_SIZE,
          page: currentPage,
          ...(normalizedQuery ? { search: normalizedQuery } : {}),
          ...(roleFilter ? { role: roleFilter } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        })

        if (!isCancelled) {
          setUsers(response.users)
          setTotal(response.total)
        }
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : "Failed to fetch users"
          addToast("error", message, "Error")
          setUsers([])
          setTotal(0)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void fetchUsers()

    return () => {
      isCancelled = true
    }
  }, [addToast, currentPage, normalizedQuery, roleFilter, statusFilter])

  const refreshCurrentPage = async (targetPage: number = currentPage) => {
    setLoading(true)
    try {
      const response = await getUsers({
        limit: PAGE_SIZE,
        page: targetPage,
        ...(normalizedQuery ? { search: normalizedQuery } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      })

      setUsers(response.users)
      setTotal(response.total)
      setCurrentPage(targetPage)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch users"
      addToast("error", message, "Error")
    } finally {
      setLoading(false)
    }
  }

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
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            placeholder="Search username, email, full name, status, role..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as "" | User["role"])}
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-300"
          >
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="kepala_divisi">Kepala Divisi</option>
            <option value="karyawan">Karyawan</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "" | "active" | "inactive")}
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-300"
          >
            <option value="">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No users found. Adjust filter/search or create one.
            </p>
          </div>
        ) : (
          <UserTable
            users={users}
            onViewDetail={(user) => {
              setSelectedUser(user)
              setIsDetailModalOpen(true)
            }}
            onEdit={(user) => {
              setSelectedUser(user)
              setIsEditModalOpen(true)
            }}
            onDelete={(user) => {
              if (user.role === "admin") {
                addToast(
                  "error",
                  "Admin user tidak dapat dihapus sesuai aturan sistem.",
                  "Error"
                )
                return
              }

              setSelectedUser(user)
              setIsDeleteModalOpen(true)
            }}
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total {total} user(s)
          </p>
          <Pagination
            currentPage={Math.min(currentPage, totalPages)}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </ComponentCard>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          void refreshCurrentPage(1)
        }}
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
            onSuccess={() => {
              void refreshCurrentPage()
            }}
          />
          <DeleteUserModal
            isOpen={isDeleteModalOpen}
            user={selectedUser}
            onClose={() => {
              setIsDeleteModalOpen(false)
              setSelectedUser(null)
            }}
            onSuccess={() => {
              const nextPage = users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
              void refreshCurrentPage(nextPage)
            }}
          />
        </>
      )}

      <UserDetailDrawer
        isOpen={isDetailModalOpen}
        userId={selectedUser?.id ?? null}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedUser(null)
        }}
      />
    </>
  )
}

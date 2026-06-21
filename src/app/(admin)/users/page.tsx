import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import UsersClient from "@/components/user/UsersClient"
import { serverFetch } from "@/lib/server-api"
import { GetUsersResponse } from "@/services/userService"

const fallbackData: GetUsersResponse = {
  total: 0,
  page: 1,
  limit: 10,
  users: [],
}

function isGetUsersResponse(value: unknown): value is GetUsersResponse {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<GetUsersResponse>
  return (
    typeof candidate.total === "number" &&
    typeof candidate.page === "number" &&
    typeof candidate.limit === "number" &&
    Array.isArray(candidate.users)
  )
}

export default async function UsersPage() {
  let initialData: GetUsersResponse = fallbackData

  try {
  const data = await serverFetch<unknown>("/api/v1/users?limit=10&page=1")
    if (isGetUsersResponse(data)) {
      initialData = data
    }
  } catch {
    initialData = fallbackData
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Manajemen User" />
      <UsersClient initialData={initialData} />
    </>
  )
}

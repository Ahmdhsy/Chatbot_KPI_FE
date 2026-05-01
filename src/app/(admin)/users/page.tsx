import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import UsersClient from "@/components/user/UsersClient"
import { serverFetch } from "@/lib/server-api"
import { User } from "@/services/userService"

export default async function UsersPage() {
  let users: User[] = []

  try {
    const data = await serverFetch<unknown>("/api/v1/users")
    if (Array.isArray(data)) {
      users = data.filter((item): item is User => item && typeof item === "object" && "id" in item)
    } else if (data && typeof data === "object" && "users" in data && Array.isArray((data as { users: unknown[] }).users)) {
      users = ((data as { users: User[] }).users).filter((item): item is User => item && typeof item === "object" && "id" in item)
    } else if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown[] }).data)) {
      users = ((data as { data: User[] }).data).filter((item): item is User => item && typeof item === "object" && "id" in item)
    } else if (data && typeof data === "object") {
      users = Object.values(data as Record<string, unknown>).filter(
        (item): item is User => !!item && typeof item === "object" && "id" in item,
      )
    }
  } catch {
    users = []
  }

  return (
    <>
      <PageBreadCrumb pageTitle="User Management" />
      <UsersClient initialUsers={users} />
    </>
  )
}

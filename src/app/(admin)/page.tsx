import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function getRoleFromAccessToken(token: string | undefined): string {
  if (!token) return "";

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return "";

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf-8")) as { role?: string };
    return String(payload.role ?? "").toLowerCase();
  } catch {
    return "";
  }
}

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const role = getRoleFromAccessToken(token);

  if (role === "hrd") {
    redirect("/ingestion");
  }

  redirect("/users");
}

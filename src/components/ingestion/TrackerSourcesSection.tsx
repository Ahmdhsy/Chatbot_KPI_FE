"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Switch from "@/components/form/switch/Switch"
import { TrackerSource } from "@/hooks/useTrackerSources"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function truncateUrl(url: string, max = 50): string {
  return url.length > max ? url.slice(0, max) + "…" : url
}

interface Props {
  initialSources: TrackerSource[]
}

export default function TrackerSourcesSection({ initialSources }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newIsScheduled, setNewIsScheduled] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/tracker-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          name: newName.trim(),
          sheet_url: newUrl.trim(),
          is_scheduled: newIsScheduled,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).detail ?? "Add failed")
      setAdding(false)
      setNewName("")
      setNewUrl("")
      setNewIsScheduled(true)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  const handleEditSave = async (id: string) => {
    if (!editName.trim() || !editUrl.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/tracker-sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ name: editName.trim(), sheet_url: editUrl.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).detail ?? "Update failed")
      setEditId(null)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (
    id: string,
    field: "is_active" | "is_scheduled",
    value: boolean
  ) => {
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/tracker-sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error((await res.json()).detail ?? "Update failed")
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/tracker-sources/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() },
      })
      if (!res.ok) throw new Error((await res.json()).detail ?? "Delete failed")
      setDeleteConfirmId(null)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-white/3">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          KPI Tracker Sources
        </h3>
        <button
          type="button"
          onClick={() => { setAdding(true); setError(null) }}
          className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          + Add Source
        </button>
      </div>

      {initialSources.length === 0 && !adding && (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No sources configured yet. Add a Google Sheets URL to get started.
        </p>
      )}

      {initialSources.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">URL</th>
                <th className="pb-2 pr-4">Scheduled</th>
                <th className="pb-2 pr-4">Active</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {initialSources.map((source) =>
                editId === source.id ? (
                  <tr key={source.id} className="text-gray-700 dark:text-white/80">
                    <td className="py-2 pr-4">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <Input
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-4 text-gray-300">—</td>
                    <td className="py-2 pr-4 text-gray-300">—</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSave(source.id)}
                          disabled={saving}
                          className="font-medium text-success-500 hover:text-success-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : deleteConfirmId === source.id ? (
                  <tr key={source.id} className="text-gray-700 dark:text-white/80">
                    <td colSpan={4} className="py-2 pr-4 text-error-500">
                      Delete &quot;{source.name}&quot;? This cannot be undone.
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(source.id)}
                          disabled={saving}
                          className="font-medium text-error-500 hover:text-error-600"
                        >
                          Yes, delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={source.id} className="text-gray-700 dark:text-white/80">
                    <td className="py-2 pr-4 font-medium">{source.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-400">
                      {truncateUrl(source.sheet_url)}
                    </td>
                    <td className="py-2 pr-4">
                      <Switch
                        key={`sched-${source.id}-${source.is_scheduled}`}
                        label=""
                        defaultChecked={source.is_scheduled}
                        onChange={(val) =>
                          handleToggle(source.id, "is_scheduled", val)
                        }
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <Switch
                        key={`active-${source.id}-${source.is_active}`}
                        label=""
                        defaultChecked={source.is_active}
                        onChange={(val) =>
                          handleToggle(source.id, "is_active", val)
                        }
                      />
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditId(source.id)
                            setEditName(source.name)
                            setEditUrl(source.sheet_url)
                          }}
                          className="font-medium text-brand-500 hover:text-brand-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(source.id)}
                          className="font-medium text-gray-400 hover:text-error-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-100 p-4 dark:border-white/5">
          <div>
            <Label htmlFor="new-source-name">Name</Label>
            <Input
              id="new-source-name"
              placeholder="Tracker Divisi A 2024"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-source-url">Sheet URL</Label>
            <Input
              id="new-source-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
          </div>
          <Switch
            label="Include in Scheduler"
            defaultChecked={newIsScheduled}
            onChange={setNewIsScheduled}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={saving || !newName.trim() || !newUrl.trim()}
            >
              {saving ? "Adding…" : "Add Source"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAdding(false)
                setNewName("")
                setNewUrl("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-error-500">{error}</p>}
    </div>
  )
}

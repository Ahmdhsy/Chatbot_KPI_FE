'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { BotIcon, PlusIcon, ChevronUp } from './icons'
import { SessionRow } from './SessionRow'
import { ProfileMenu } from './ProfileMenu'
import type { Session } from '@/types/chat'

interface ChatSidebarProps {
  sessions: Session[]
  activeSessionId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string, title: string) => void
  onRename: (id: string, title: string) => void
  onLogoutRequest: () => void
  userName: string
  userEmail: string
}

export function ChatSidebar({
  sessions, activeSessionId, onSelect, onNew, onDelete, onRename, onLogoutRequest, userName, userEmail,
}: ChatSidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingVal, setEditingVal] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileOpen) return
    const fn = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [profileOpen])

  const startRename = (id: string, title: string) => {
    setEditingId(id)
    setEditingVal(title)
  }
  const saveRename = (cancel?: boolean) => {
    if (!cancel && editingVal.trim()) onRename(editingId!, editingVal.trim())
    setEditingId(null)
    setEditingVal('')
  }

  // Group sessions by date label (today / yesterday / older)
  const grouped = useMemo(() => {
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const groups: Record<string, Session[]> = {}
    sessions.forEach((s) => {
      const d = new Date(s.created_at).toDateString()
      const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(s.created_at).toLocaleDateString()
      ;(groups[label] = groups[label] ?? []).push(s)
    })
    return groups
  }, [sessions])

  const initial = userName.charAt(0).toUpperCase()

  return (
    <div className="w-[260px] h-full flex flex-col bg-white dark:bg-[#0d1117] border-r border-[#e4e7ec] dark:border-[#1f2937]">
      {/* Logo */}
      <div className="px-3.5 pt-5 pb-3 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-[9px] bg-brand-500 flex items-center justify-center text-white"
          style={{ boxShadow: '0 4px 12px #465fff55' }}
        >
          <BotIcon />
        </div>
        <div>
          <span className="font-bold text-[15px] text-[#101828] dark:text-[#f3f4f6] tracking-tight block">Chatbot KPI</span>
          <span className="text-[11px] text-[#9ca3af] dark:text-[#4b5563]">AI Analytics Assistant</span>
        </div>
      </div>

      {/* New chat */}
      <div className="px-2.5 pb-3">
        <button
          onClick={onNew}
          className="w-full px-3 py-2.5 rounded-[10px] border-[1.5px] border-dashed border-[#c2d6ff] dark:border-[#2d3748] bg-transparent text-brand-500 flex items-center gap-2 text-[13px] font-semibold cursor-pointer hover:bg-[#ecf3ff] dark:hover:bg-[rgba(70,95,255,0.12)] hover:border-brand-500 transition-all"
        >
          <PlusIcon /> New chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-1.5 chat-scroll">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-2">
            <p className="text-[10px] font-bold text-[#9ca3af] dark:text-[#374151] uppercase tracking-[0.8px] px-2.5 py-1">
              {date}
            </p>
            {items.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                isActive={s.id === activeSessionId}
                editingId={editingId}
                editingVal={editingVal}
                onSelect={() => onSelect(s.id)}
                onDelete={onDelete}
                onRenameStart={startRename}
                onEditingChange={setEditingVal}
                onRenameSave={saveRename}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Profile */}
      <div ref={profileRef} className="p-2.5 border-t border-[#e4e7ec] dark:border-[#1f2937] relative">
        {profileOpen && (
          <ProfileMenu
            userName={userName}
            userEmail={userEmail}
            onLogoutRequest={onLogoutRequest}
            onClose={() => setProfileOpen(false)}
          />
        )}
        <button
          onClick={() => setProfileOpen((p) => !p)}
          className="w-full flex items-center gap-2.5 px-1.5 py-2 rounded-[10px] border-none bg-transparent cursor-pointer hover:bg-[#f9fafb] dark:hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-[34px] h-[34px] rounded-full bg-brand-500 flex items-center justify-center text-white flex-shrink-0 text-sm font-bold">
            {initial}
          </div>
          <div className="flex-1 text-left">
            <p className="text-[13px] font-semibold text-[#344054] dark:text-[#e5e7eb] leading-tight">{userName}</p>
            <p className="text-[11px] text-[#9ca3af] dark:text-[#4b5563]">{userEmail}</p>
          </div>
          <span
            className="text-[#9ca3af] dark:text-[#4b5563] transition-transform"
            style={{ transform: profileOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
          >
            <ChevronUp />
          </span>
        </button>
      </div>
    </div>
  )
}

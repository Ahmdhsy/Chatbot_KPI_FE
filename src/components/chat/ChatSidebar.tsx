'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { BotIcon, PlusIcon, ChevronUp, SearchIcon, CloseIcon } from './icons'
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
  managementPath: string | null
}

export function ChatSidebar({
  sessions, activeSessionId, onSelect, onNew, onDelete, onRename, onLogoutRequest, userName, userEmail, managementPath,
}: ChatSidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingVal, setEditingVal] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)

  // Search modal state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Collapse entire session list
  const [sessionsCollapsed, setSessionsCollapsed] = useState(false)

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

  // Focus search input when modal opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
    if (!searchOpen) {
      setSearchQuery('')
    }
  }, [searchOpen])

  // Close modal on Escape
  useEffect(() => {
    if (!searchOpen) return
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [searchOpen])

  const startRename = (id: string, title: string) => {
    setEditingId(id)
    setEditingVal(title)
  }
  const saveRename = (cancel?: boolean) => {
    if (!cancel && editingVal.trim()) onRename(editingId!, editingVal.trim())
    setEditingId(null)
    setEditingVal('')
  }

  const grouped = useMemo(() => {
    const todayDate = new Date()
    const today = todayDate.toDateString()
    const yesterdayDate = new Date(todayDate)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = yesterdayDate.toDateString()
    const groups: Record<string, Session[]> = {}
    sessions.forEach((s) => {
      const d = new Date(s.created_at).toDateString()
      const label = d === today ? 'Hari Ini' : d === yesterday ? 'Kemarin' : new Date(s.created_at).toLocaleDateString('id-ID')
      ;(groups[label] = groups[label] ?? []).push(s)
    })
    return groups
  }, [sessions])

  // Filtered sessions for modal search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const q = searchQuery.toLowerCase()
    return sessions.filter((s) => s.title.toLowerCase().includes(q))
  }, [searchQuery, sessions])

  const initial = userName.charAt(0).toUpperCase()

  return (
    <div className="w-[350px] h-full flex flex-col bg-white dark:bg-[#0d1117] border-r border-[#e4e7ec] dark:border-[#1f2937]">

      {/* ── Header ── */}
      <div className="px-3.5 pt-5 pb-3 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-[9px] bg-brand-500 flex items-center justify-center text-white flex-shrink-0"
          style={{ boxShadow: '0 4px 12px #465fff55' }}
        >
          <BotIcon />
        </div>
        <div>
          <span className="font-bold text-[16px] text-[#101828] dark:text-[#f3f4f6] tracking-tight block">Chatbot KPI</span>
          <span className="text-[12px] text-[#9ca3af] dark:text-[#4b5563]">AI Analytics Assistant</span>
        </div>
      </div>

      {/* ── New Chat button ── */}
      <div className="px-2.5 pb-3">
        <button
          onClick={onNew}
          className="w-full px-3 py-2.5 rounded-[10px] border-[1.5px] border-dashed border-[#c2d6ff] dark:border-[#2d3748] bg-transparent text-brand-500 flex items-center gap-2 text-[14px] font-semibold cursor-pointer hover:bg-[#ecf3ff] dark:hover:bg-[rgba(70,95,255,0.12)] hover:border-brand-500 transition-all"
        >
          <PlusIcon /> Obrolan baru
        </button>
      </div>

      {/* ── Sessions section header (Search button + Collapse) ── */}
      <div className="px-2.5 mb-1">
        <div className="flex items-center gap-1.5 px-1 mb-2">
          {/* Label */}
          <span className="flex-1 text-[10px] font-bold text-[#9ca3af] dark:text-[#374151] uppercase tracking-[0.8px]">
            Sesi
          </span>
          {/* Collapse toggle */}
          <button
            onClick={() => setSessionsCollapsed((c) => !c)}
            title={sessionsCollapsed ? 'Tampilkan sesi' : 'Sembunyikan sesi'}
            className="w-6 h-6 rounded-[6px] flex items-center justify-center border-none bg-transparent cursor-pointer text-[#9ca3af] dark:text-[#4b5563] hover:bg-[#f2f4f7] dark:hover:bg-white/[0.06] hover:text-[#374151] dark:hover:text-[#e5e7eb] transition-all"
            style={{ transform: sessionsCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
          >
            <ChevronUp />
          </button>
        </div>
        {/* Search label+icon button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[9px] border border-[#e4e7ec] dark:border-[#1f2937] bg-[#f9fafb] dark:bg-white/[0.03] text-[#9ca3af] dark:text-[#4b5563] hover:border-brand-500 hover:text-brand-500 dark:hover:border-brand-500 dark:hover:text-brand-500 transition-all cursor-pointer"
        >
          <SearchIcon />
          <span className="text-[13px]">Cari sesi...</span>
        </button>
      </div>

      {/* ── Session list ── */}
      {/* Outer div stays flex-1 always → profile never moves up */}
      <div className="flex-1 min-h-0 relative">
        <div
          className="absolute inset-0 overflow-y-auto px-1.5 chat-scroll"
          style={{
            opacity: sessionsCollapsed ? 0 : 1,
            pointerEvents: sessionsCollapsed ? 'none' : undefined,
            transition: 'opacity 0.2s ease',
          }}
        >
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
      </div>

      {/* ── Profile footer ── */}
      <div ref={profileRef} className="p-2.5 border-t border-[#e4e7ec] dark:border-[#1f2937] relative">
        {profileOpen && (
          <ProfileMenu
            userName={userName}
            userEmail={userEmail}
            managementPath={managementPath}
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
            <p className="text-[14px] font-semibold text-[#344054] dark:text-[#e5e7eb] leading-tight">{userName}</p>
            <p className="text-[12px] text-[#9ca3af] dark:text-[#4b5563]">{userEmail}</p>
          </div>
          <span
            className="text-[#9ca3af] dark:text-[#4b5563] transition-transform"
            style={{ transform: profileOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
          >
            <ChevronUp />
          </span>
        </button>
      </div>

      {/* ── Search Modal (portal, centered, backdrop blur) ── */}
      {searchOpen && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-[#111827] shadow-2xl overflow-hidden"
            style={{ animation: 'msgIn 0.2s ease forwards' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e4e7ec] dark:border-[#1f2937]">
              <span className="text-[#9ca3af] dark:text-[#4b5563] flex-shrink-0">
                <SearchIcon />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari sesi..."
                className="flex-1 text-[15px] bg-transparent border-none outline-none text-[#101828] dark:text-[#e5e7eb] placeholder-[#9ca3af] dark:placeholder-[#4b5563]"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#e5e7eb] bg-transparent border-none cursor-pointer flex-shrink-0 transition-colors"
                >
                  <CloseIcon />
                </button>
              ) : (
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#e5e7eb] bg-transparent border-none cursor-pointer flex-shrink-0 transition-colors"
                >
                  <CloseIcon />
                </button>
              )}
            </div>

            {/* Modal results */}
            <div className="overflow-y-auto max-h-[60vh] p-2">
              {searchQuery.trim() && searchResults.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[14px] text-[#9ca3af] dark:text-[#4b5563]">
                    Tidak ada hasil untuk <strong>&ldquo;{searchQuery}&rdquo;</strong>
                  </p>
                </div>
              ) : searchQuery.trim() ? (
                <>
                  <p className="text-[10px] font-bold text-[#9ca3af] dark:text-[#374151] uppercase tracking-[0.8px] px-2.5 py-1">
                    {searchResults.length} sesi ditemukan
                  </p>
                  {searchResults.map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      isActive={s.id === activeSessionId}
                      editingId={editingId}
                      editingVal={editingVal}
                      onSelect={() => { onSelect(s.id); setSearchOpen(false) }}
                      onDelete={onDelete}
                      onRenameStart={startRename}
                      onEditingChange={setEditingVal}
                      onRenameSave={saveRename}
                    />
                  ))}
                </>
              ) : (
                // No query → tampilkan 3 teratas Hari Ini + 3 teratas Kemarin
                (() => {
                  const todayStr = new Date().toDateString()
                  const yestDate = new Date(); yestDate.setDate(yestDate.getDate() - 1)
                  const yestStr = yestDate.toDateString()
                  const todaySessions = sessions.filter(s => new Date(s.created_at).toDateString() === todayStr).slice(0, 3)
                  const yestSessions = sessions.filter(s => new Date(s.created_at).toDateString() === yestStr).slice(0, 3)
                  const hasAny = todaySessions.length > 0 || yestSessions.length > 0
                  return (
                    <>
                      {!hasAny && (
                        <div className="py-10 text-center">
                          <p className="text-[14px] text-[#9ca3af] dark:text-[#4b5563]">Belum ada sesi</p>
                        </div>
                      )}
                      {todaySessions.length > 0 && (
                        <>
                          <p className="text-[10px] font-bold text-[#9ca3af] dark:text-[#374151] uppercase tracking-[0.8px] px-2.5 py-1">Hari Ini</p>
                          {todaySessions.map((s) => (
                            <SessionRow
                              key={s.id}
                              session={s}
                              isActive={s.id === activeSessionId}
                              editingId={editingId}
                              editingVal={editingVal}
                              onSelect={() => { onSelect(s.id); setSearchOpen(false) }}
                              onDelete={onDelete}
                              onRenameStart={startRename}
                              onEditingChange={setEditingVal}
                              onRenameSave={saveRename}
                            />
                          ))}
                        </>
                      )}
                      {yestSessions.length > 0 && (
                        <>
                          <p className="text-[10px] font-bold text-[#9ca3af] dark:text-[#374151] uppercase tracking-[0.8px] px-2.5 py-1 mt-1">Kemarin</p>
                          {yestSessions.map((s) => (
                            <SessionRow
                              key={s.id}
                              session={s}
                              isActive={s.id === activeSessionId}
                              editingId={editingId}
                              editingVal={editingVal}
                              onSelect={() => { onSelect(s.id); setSearchOpen(false) }}
                              onDelete={onDelete}
                              onRenameStart={startRename}
                              onEditingChange={setEditingVal}
                              onRenameSave={saveRename}
                            />
                          ))}
                        </>
                      )}
                      {hasAny && (
                        <p className="text-[11px] text-[#9ca3af] dark:text-[#4b5563] text-center py-3">
                          Ketik untuk mencari sesi lainnya...
                        </p>
                      )}
                    </>
                  )
                })()
              )}
            </div>

            {/* Modal footer hint */}
            <div className="px-4 py-2.5 border-t border-[#e4e7ec] dark:border-[#1f2937] flex items-center gap-3">
              <span className="text-[12px] text-[#9ca3af] dark:text-[#4b5563]">
                <kbd className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#1f2937] text-[10px] font-mono">Esc</kbd>
                {' '}untuk menutup
              </span>
              <span className="text-[12px] text-[#9ca3af] dark:text-[#4b5563]">
                <kbd className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#1f2937] text-[10px] font-mono">Enter</kbd>
                {' '}untuk memilih
              </span>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

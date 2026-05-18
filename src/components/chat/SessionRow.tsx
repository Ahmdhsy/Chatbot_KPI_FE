'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatIcon, PenIcon, TrashIcon } from './icons'
import type { Session } from '@/types/chat'

interface SessionRowProps {
  session: Session
  isActive: boolean
  editingId: string | null
  editingVal: string
  onSelect: () => void
  onDelete: (id: string, title: string) => void
  onRenameStart: (id: string, title: string) => void
  onEditingChange: (val: string) => void
  onRenameSave: (cancel?: boolean) => void
}

export function SessionRow({
  session, isActive, editingId, editingVal,
  onSelect, onDelete, onRenameStart, onEditingChange, onRenameSave,
}: SessionRowProps) {
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEditing = editingId === session.id

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`px-2.5 py-2 rounded-[10px] cursor-pointer flex items-center gap-2 mb-0.5 transition-colors ${
        isActive
          ? 'bg-[#ecf3ff] dark:bg-[rgba(70,95,255,0.13)]'
          : hovered
          ? 'bg-[#f2f4f7] dark:bg-white/[0.04]'
          : 'bg-transparent'
      }`}
    >
      <span className={isActive ? 'text-brand-500' : 'text-[#9ca3af] dark:text-[#4b5563]'}>
        <ChatIcon />
      </span>

      {isEditing ? (
        <input
          ref={inputRef}
          value={editingVal}
          onChange={(e) => onEditingChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameSave()
            if (e.key === 'Escape') onRenameSave(true)
          }}
          onBlur={() => onRenameSave()}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-[13px] border border-brand-500 rounded-[6px] px-1.5 py-0.5 bg-white dark:bg-[#0d1117] text-[#101828] dark:text-[#e5e7eb] outline-none"
        />
      ) : (
        <div className="min-w-0 flex-1" onClick={onSelect}>
          <p
            className={`text-[13px] whitespace-nowrap overflow-hidden text-ellipsis ${
              isActive ? 'font-semibold text-brand-700 dark:text-[#818cf8]' : 'font-normal text-[#374151] dark:text-[#d1d5db]'
            }`}
          >
            {session.title}
          </p>
          <p className="text-[11px] text-[#9ca3af] dark:text-[#4b5563] mt-px">
            {new Date(session.created_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {!isEditing && hovered && (
        <div className="flex gap-0.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onRenameStart(session.id, session.title) }}
            title="Rename"
            className="p-1 rounded bg-none border-none cursor-pointer text-[#9ca3af] dark:text-[#4b5563] hover:text-brand-500 transition-colors"
          >
            <PenIcon />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(session.id, session.title) }}
            title="Delete"
            className="p-1 rounded bg-none border-none cursor-pointer text-[#9ca3af] dark:text-[#4b5563] hover:text-[#f04438] transition-colors"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  )
}

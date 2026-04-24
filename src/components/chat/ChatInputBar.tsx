'use client'

import { useState, useRef } from 'react'
import { SendIcon } from './icons'

interface ChatInputBarProps {
  onSend: (text: string) => void
  disabled: boolean
}

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [text, setText] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const resize = () => {
    const t = taRef.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 150) + 'px'
  }

  const send = () => {
    const v = text.trim()
    if (!v || disabled) return
    onSend(v)
    setText('')
    if (taRef.current) taRef.current.style.height = 'auto'
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const canSend = text.trim().length > 0 && !disabled

  return (
    <div className="px-6 pb-4 pt-2.5 flex-shrink-0">
      <div
        className="flex items-end gap-2 bg-white dark:bg-[#1a2535] border border-[#e4e7ec] dark:border-[#2d3748] rounded-[14px] px-3.5 py-2 shadow-sm dark:shadow-none transition-colors focus-within:border-brand-500"
      >
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          onChange={(e) => { setText(e.target.value); resize() }}
          onKeyDown={onKey}
          placeholder="Ask anything about your KPIs…"
          className="flex-1 border-none outline-none bg-transparent text-[#101828] dark:text-[#e5e7eb] text-sm leading-[1.55] pt-1 pb-1 max-h-[150px] overflow-y-auto resize-none placeholder:text-[#9ca3af]"
        />
        <button
          onClick={send}
          disabled={!canSend}
          className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-colors"
          style={{
            background: canSend ? '#465fff' : undefined,
            boxShadow: canSend ? '0 2px 8px #465fff55' : undefined,
          }}
          aria-label="Send"
        >
          <span className={canSend ? 'text-white' : 'text-[#9ca3af] dark:text-[#4b5563]'}>
            <SendIcon />
          </span>
        </button>
      </div>
      <p className="text-center text-[11px] text-[#c4c9d4] dark:text-[#374151] mt-1.5">
        Chatbot KPI may make mistakes. Please verify important information.
      </p>
    </div>
  )
}

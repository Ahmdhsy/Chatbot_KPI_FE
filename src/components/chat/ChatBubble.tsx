'use client'

import { useState, useRef, useEffect } from 'react'
import { BotIcon, UserIcon, CopyIcon, CheckIcon, EditIcon, RetryIcon } from './icons'
import type { Message } from '@/types/chat'

function parseLine(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
    p.startsWith('**')
      ? <strong key={j}>{p.slice(2, -2)}</strong>
      : p
  )
}

function RichText({ text }: { text: string }) {
  return (
    <div>
      {text.split('\n').map((line, i) => {
        if (line.startsWith('- '))
          return (
            <div key={i} className="flex gap-1.5 mt-1 items-start">
              <span className="flex-shrink-0 mt-0.5 text-[15px] leading-none">•</span>
              <span className="flex-1 leading-relaxed">{parseLine(line.slice(2))}</span>
            </div>
          )
        if (/^\d+\./.test(line))
          return <div key={i} className="mt-1 leading-relaxed">{parseLine(line)}</div>
        if (line === '')
          return <div key={i} className="h-2" />
        return <div key={i} className="mt-0.5 leading-relaxed">{parseLine(line)}</div>
      })}
    </div>
  )
}

function InlineEdit({
  msg, onSave, onCancel,
}: { msg: Message; onSave: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(msg.content ?? '')
  const taRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const t = taRef.current
    if (!t) return
    t.focus()
    t.style.height = 'auto'
    t.style.height = t.scrollHeight + 'px'
  }, [])
  const save = () => {
    const v = val.trim()
    if (v && v !== msg.content) onSave(v)
    else onCancel()
  }
  return (
    <div>
      <textarea
        ref={taRef}
        value={val}
        onChange={(e) => {
          setVal(e.target.value)
          e.target.style.height = 'auto'
          e.target.style.height = e.target.scrollHeight + 'px'
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() }
          if (e.key === 'Escape') onCancel()
        }}
        className="w-full bg-white/10 border border-brand-500 rounded-[10px] px-2.5 py-2 text-white text-sm leading-relaxed outline-none min-h-[40px] resize-none block"
      />
      <div className="flex gap-1.5 mt-2 justify-end">
        <button onClick={onCancel} className="px-3.5 py-1 rounded-[7px] border border-white/30 bg-transparent text-white/70 text-xs cursor-pointer">Cancel</button>
        <button onClick={save} className="px-3.5 py-1 rounded-[7px] border-none bg-white text-brand-500 text-xs font-semibold cursor-pointer">Save</button>
      </div>
    </div>
  )
}

function ActionBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-[27px] h-[27px] rounded-[7px] border-none cursor-pointer bg-transparent text-[#9ca3af] dark:text-[#6b7280] hover:bg-[#e4e7ec] dark:hover:bg-[#2d3748] hover:text-[#374151] dark:hover:text-[#d1d5db] flex items-center justify-center transition-all"
    >
      {children}
    </button>
  )
}

interface ChatBubbleProps {
  msg: Message
  onEditSave: (id: string, text: string) => void
  onRetry: (msgId: string) => void
}

export function ChatBubble({ msg, onEditSave, onRetry }: ChatBubbleProps) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const isUser = msg.role === 'user'

  const copy = () => {
    navigator.clipboard?.writeText(msg.content ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className={`flex gap-2.5 mb-[22px] items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ animation: 'msgIn 0.25s ease forwards' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
          isUser
            ? 'bg-[#e4e7ec] dark:bg-[#2d3748] text-[#6b7280] dark:text-[#9ca3af]'
            : 'bg-brand-500 text-white'
        }`}
      >
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>

      <div className="max-w-[72%] min-w-[60px]">
        {/* Bubble */}
        <div
          className={`text-sm ${
            isUser
              ? 'text-white rounded-[16px_16px_4px_16px]'
              : 'text-[#101828] dark:text-[#e4e7ec] bg-[#f9fafb] dark:bg-[#1a2535] border border-[#e4e7ec] dark:border-[#2d3748] rounded-[16px_16px_16px_4px] shadow-sm dark:shadow-none'
          } ${editing ? 'px-3 py-2.5' : 'px-3.5 py-2.5'}`}
          style={
            isUser
              ? { background: '#465fff', boxShadow: '0 2px 14px #465fff45' }
              : undefined
          }
        >
          {editing ? (
            <InlineEdit
              msg={msg}
              onSave={(v) => { onEditSave(msg.id, v); setEditing(false) }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {msg.content && <RichText text={msg.content} />}
              {msg.graphic_image_base64 && (
                <img
                  src={`data:image/png;base64,${msg.graphic_image_base64}`}
                  alt="Chart visualization"
                  className="mt-2.5 rounded-lg w-full max-w-[480px]"
                />
              )}
            </>
          )}
        </div>

        {/* Actions row */}
        {!editing && (
          <div
            className={`flex items-center gap-1 mt-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <span className="text-[11px] text-[#9ca3af] dark:text-[#374151]">{msg.ts}</span>
            <div
              className="flex gap-0.5 transition-opacity"
              style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none' }}
            >
              <ActionBtn title="Copy" onClick={copy}>{copied ? <CheckIcon /> : <CopyIcon />}</ActionBtn>
              {isUser && <ActionBtn title="Edit message" onClick={() => setEditing(true)}><EditIcon /></ActionBtn>}
              <ActionBtn title="Regenerate" onClick={() => onRetry(msg.id)}><RetryIcon /></ActionBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

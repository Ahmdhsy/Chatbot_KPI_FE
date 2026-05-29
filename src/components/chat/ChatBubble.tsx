'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { BotIcon, UserIcon, CopyIcon, CheckIcon, EditIcon, RetryIcon } from './icons'
import type { Message } from '@/types/chat'

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`|~~[^~\n]+~~|\[[^\]]+\]\([^)]+\)|_[^_\n]+_)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('***'))
      parts.push(<strong key={m.index}><em>{tok.slice(3, -3)}</em></strong>)
    else if (tok.startsWith('**'))
      parts.push(<strong key={m.index}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('*') || tok.startsWith('_'))
      parts.push(<em key={m.index}>{tok.slice(1, -1)}</em>)
    else if (tok.startsWith('`'))
      parts.push(
        <code key={m.index} className="bg-[#f0f4ff] dark:bg-[#1f2937] text-[#4f46e5] dark:text-[#818cf8] px-1 py-0.5 rounded text-[0.85em] font-mono">
          {tok.slice(1, -1)}
        </code>
      )
    else if (tok.startsWith('~~'))
      parts.push(<del key={m.index}>{tok.slice(2, -2)}</del>)
    else {
      const lm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (lm)
        parts.push(
          <a key={m.index} href={lm[2]} target="_blank" rel="noreferrer"
            className="text-brand-500 underline hover:opacity-80 break-all">
            {lm[1]}
          </a>
        )
    }
    last = m.index + tok.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : [text]
}

function parseTableLine(line: string): string[] {
  return line.split('|').slice(1, -1).map((c) => c.trim())
}

function isSeparatorRow(line: string): boolean {
  return /^\|[\s|:-]+\|$/.test(line.trim())
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const dataLines = lines.filter((l) => !isSeparatorRow(l))
  if (dataLines.length === 0) return null
  const [header, ...body] = dataLines
  const headers = parseTableLine(header)
  return (
    <div className="overflow-x-auto my-3 rounded-lg border border-[#e4e7ec] dark:border-[#2d3748]">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#f3f4f6] dark:bg-[#1f2937]">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-[#374151] dark:text-[#d1d5db] border-b border-[#e4e7ec] dark:border-[#2d3748] whitespace-nowrap">
                {parseInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="even:bg-[#f9fafb] dark:even:bg-[#161f2e] hover:bg-[#f0f4ff] dark:hover:bg-[#1e2d45] transition-colors">
              {parseTableLine(row).map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-[#101828] dark:text-[#e4e7ec] border-b border-[#e4e7ec] dark:border-[#2d3748] last:border-b-0 align-top">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      if (i < lines.length) i++
      blocks.push(
        <div key={`code-${i}`} className="my-2 rounded-lg overflow-hidden border border-[#e4e7ec] dark:border-[#2d3748]">
          {lang && (
            <div className="px-3 py-1 bg-[#f3f4f6] dark:bg-[#1f2937] text-xs text-[#6b7280] dark:text-[#9ca3af] font-mono border-b border-[#e4e7ec] dark:border-[#2d3748]">
              {lang}
            </div>
          )}
          <pre className="px-3 py-2.5 bg-[#f9fafb] dark:bg-[#0d1117] text-[#101828] dark:text-[#e4e7ec] text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed m-0">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      )
      continue
    }

    // Markdown table
    if (line.trimStart().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      blocks.push(<MarkdownTable key={`tbl-${i}`} lines={tableLines} />)
      continue
    }

    // Headings
    if (line.startsWith('#### '))  { blocks.push(<div key={i} className="font-semibold text-[14px] mt-2 mb-0.5 text-[#101828] dark:text-[#e4e7ec]">{parseInline(line.slice(5))}</div>); i++; continue }
    if (line.startsWith('### '))   { blocks.push(<div key={i} className="font-semibold text-[15px] mt-3 mb-1 text-[#101828] dark:text-[#e4e7ec]">{parseInline(line.slice(4))}</div>); i++; continue }
    if (line.startsWith('## '))    { blocks.push(<div key={i} className="font-bold text-base mt-3 mb-1 text-[#101828] dark:text-[#e4e7ec]">{parseInline(line.slice(3))}</div>); i++; continue }
    if (line.startsWith('# '))     { blocks.push(<div key={i} className="font-bold text-lg mt-3 mb-1 text-[#101828] dark:text-[#e4e7ec]">{parseInline(line.slice(2))}</div>); i++; continue }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push(<hr key={i} className="my-2 border-[#e4e7ec] dark:border-[#2d3748]" />)
      i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      blocks.push(
        <div key={i} className="border-l-4 border-brand-500 pl-3 py-0.5 my-1 text-[#6b7280] dark:text-[#9ca3af] italic">
          {parseInline(line.slice(2))}
        </div>
      )
      i++; continue
    }

    // Indented bullet (2+ spaces or tab before - * +)
    const indented = line.match(/^(\s{2,}|\t+)([-*+]) (.*)/)
    if (indented) {
      const level = indented[1].replace(/\t/g, '  ').length / 2
      blocks.push(
        <div key={i} className="flex gap-1.5 mt-0.5 items-start" style={{ paddingLeft: `${Math.min(level, 4) * 14}px` }}>
          <span className="flex-shrink-0 mt-0.5 text-[13px] leading-none opacity-60">◦</span>
          <span className="flex-1 leading-relaxed">{parseInline(indented[3])}</span>
        </div>
      )
      i++; continue
    }

    // Bullet list (-, *, +)
    if (/^[-*+] /.test(line)) {
      blocks.push(
        <div key={i} className="flex gap-1.5 mt-1 items-start">
          <span className="flex-shrink-0 mt-0.5 text-[15px] leading-none">•</span>
          <span className="flex-1 leading-relaxed">{parseInline(line.slice(2))}</span>
        </div>
      )
      i++; continue
    }

    // Numbered list
    if (/^\d+[.)]\s/.test(line)) {
      blocks.push(
        <div key={i} className="mt-1 leading-relaxed">{parseInline(line)}</div>
      )
      i++; continue
    }

    // Empty line
    if (line.trim() === '') {
      blocks.push(<div key={i} className="h-2" />)
      i++; continue
    }

    // Default paragraph
    blocks.push(
      <div key={i} className="mt-0.5 leading-relaxed">{parseInline(line)}</div>
    )
    i++
  }

  return <div>{blocks}</div>
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
  onEditSave?: (id: string, text: string) => void
  onRetry?: (msgId: string) => void
}

export function ChatBubble({ msg, onEditSave, onRetry }: ChatBubbleProps) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const isUser = msg.role === 'user'

  const copy = async () => {
    const text = msg.content ?? ''
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div
      className={`flex gap-2.5 mb-[22px] items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ animation: 'msgIn 0.25s ease forwards' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
          {editing && onEditSave ? (
            <InlineEdit
              msg={msg}
              onSave={(v) => { onEditSave(msg.id, v); setEditing(false) }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {msg.content && <RichText text={msg.content} />}
              {msg.graphics && msg.graphics.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-3">
                  {msg.graphics.map((g, i) => (
                    <div key={i}>
                      {g.kpi_name && (
                        <p className="text-xs font-semibold text-[#6b7280] dark:text-[#9ca3af] mb-1">
                          {g.kpi_name}
                        </p>
                      )}
                      <Image
                        src={`data:image/png;base64,${g.image_base64}`}
                        alt={g.kpi_name ? `Grafik ${g.kpi_name}` : 'Chart visualization'}
                        width={960}
                        height={540}
                        unoptimized
                        className="rounded-lg w-full max-w-[480px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

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
              {isUser && onEditSave && <ActionBtn title="Edit message" onClick={() => setEditing(true)}><EditIcon /></ActionBtn>}
              {!isUser && onRetry && <ActionBtn title="Regenerate" onClick={() => onRetry(msg.id)}><RetryIcon /></ActionBtn>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

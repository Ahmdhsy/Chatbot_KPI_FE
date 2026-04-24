'use client'

import { useRef, useEffect } from 'react'
import { ChatBubble } from './ChatBubble'
import { ClarifyCard } from './ClarifyCard'
import { TypingIndicator } from './TypingIndicator'
import { EmptyState } from './EmptyState'
import type { Message } from '@/types/chat'

interface ChatMessageListProps {
  messages: Message[]
  isTyping: boolean
  onSuggest: (text: string) => void
  onEditSave: (id: string, text: string) => void
  onRetry: (msgId: string) => void
  onClarifySelect: (option: string) => void
}

export function ChatMessageList({
  messages,
  isTyping,
  onSuggest,
  onEditSave,
  onRetry,
  onClarifySelect,
}: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  useEffect(() => {
    const t1 = setTimeout(scrollToBottom, 80)
    const t2 = setTimeout(scrollToBottom, 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [messages, isTyping])

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto overflow-x-hidden px-7 pt-6 pb-2 flex flex-col chat-scroll"
    >
      {messages.length === 0 ? (
        <EmptyState onSuggest={onSuggest} />
      ) : (
        messages.map((m, i) => {
          if (m.role === 'bot' && m.type === 'clarify') {
            return (
              <ClarifyCard
                key={m.id}
                msg={m}
                onSelect={onClarifySelect}
                isLast={i === messages.length - 1}
              />
            )
          }
          return (
            <ChatBubble
              key={m.id}
              msg={m}
              onEditSave={onEditSave}
              onRetry={onRetry}
            />
          )
        })
      )}
      {isTyping && <TypingIndicator />}
    </div>
  )
}

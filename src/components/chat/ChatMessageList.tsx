'use client'

import { useRef, useEffect } from 'react'
import { ChatBubble } from './ChatBubble'
import { TypingIndicator } from './TypingIndicator'
import { EmptyState } from './EmptyState'
import type { Message } from '@/types/chat'

interface ChatMessageListProps {
  messages: Message[]
  isTyping: boolean
  onSuggest: (text: string) => void
  onEditSave: (id: string, text: string) => void
  onRetry: (msgId: string) => void
}

export function ChatMessageList({
  messages,
  isTyping,
  onSuggest,
  onEditSave,
  onRetry,
}: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const lastUserIdx = messages.reduce((last, m, i) => m.role === 'user' ? i : last, -1)
  const lastBotIdx = messages.reduce((last, m, i) => m.role === 'bot' ? i : last, -1)

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
      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col chat-scroll"
    >
      <div className="w-full max-w-[900px] mx-auto px-7 pt-6 pb-2 flex flex-col flex-1">
        {messages.length === 0 ? (
          <EmptyState onSuggest={onSuggest} />
        ) : (
          messages.map((m, i) => {
            // The last bot message is still being streamed while isTyping is true
            const isStreamingThisBubble =
              isTyping && m.role === 'bot' && i === lastBotIdx
            return (
              <ChatBubble
                key={m.id}
                msg={m}
                onEditSave={!isTyping && i === lastUserIdx ? onEditSave : undefined}
                onRetry={!isTyping && i === lastBotIdx ? onRetry : undefined}
                isStreaming={isStreamingThisBubble}
              />
            )
          })
        )}
        {isTyping && (messages.length === 0 || messages[messages.length - 1].role !== 'bot') && <TypingIndicator />}
      </div>
    </div>
  )
}

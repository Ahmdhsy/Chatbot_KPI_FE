'use client'

import { useState } from 'react'
import { BotIcon, InfoIcon } from './icons'
import type { Message } from '@/types/chat'

interface ClarifyCardProps {
  msg: Message
  onSelect: (option: string) => void
  isLast: boolean
}

export function ClarifyCard({ msg, onSelect, isLast }: ClarifyCardProps) {
  const [chosen, setChosen] = useState<string | null>(null)
  const isDone = chosen !== null || !isLast
  const options = msg.clarification_options ?? []

  return (
    <div
      className="flex flex-row gap-2.5 mb-[22px] items-start"
      style={{ animation: 'msgIn 0.25s ease forwards' }}
    >
      {/* Bot avatar */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 bg-brand-500 flex items-center justify-center text-white mt-0.5">
        <BotIcon />
      </div>

      <div className="max-w-[72%]">
        {/* Card */}
        <div className="bg-[rgba(70,95,255,0.04)] dark:bg-[rgba(70,95,255,0.07)] border border-[rgba(70,95,255,0.2)] dark:border-[rgba(70,95,255,0.22)] rounded-[16px_16px_16px_4px] px-3.5 py-3">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-3 text-brand-500">
            <InfoIcon />
            <span className="text-[13px] font-semibold">
              {isDone ? 'You selected' : 'I need a bit more context'}
            </span>
          </div>

          {/* Question */}
          {!isDone && (
            <p className="text-[14px] text-[#374151] dark:text-[#d1d5db] mb-3 leading-relaxed font-medium">
              {msg.content}
            </p>
          )}

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => {
              const isChosen = chosen === opt
              const faded = isDone && !isChosen
              return (
                <button
                  key={opt}
                  disabled={isDone}
                  onClick={() => {
                    if (!isDone) { setChosen(opt); onSelect(opt) }
                  }}
                  className="px-[15px] py-[7px] rounded-full text-[13px] font-medium border transition-all"
                  style={{
                    cursor: isDone ? 'default' : 'pointer',
                    border: `1.5px solid ${isChosen ? '#465fff' : 'rgba(70,95,255,0.3)'}`,
                    background: isChosen ? '#465fff' : 'rgba(70,95,255,0.06)',
                    color: isChosen ? 'white' : '#2a31d8',
                    opacity: faded ? 0.3 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    if (!isDone) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.transform = ''
                  }}
                >
                  {isChosen && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {opt}
                </button>
              )
            })}
          </div>

          {!isDone && (
            <p className="text-[11px] text-[#9ca3af] dark:text-[#4b5563] mt-2.5">
              Or type your own answer below →
            </p>
          )}
        </div>

        <div className="mt-1.5">
          <span className="text-[11px] text-[#9ca3af] dark:text-[#374151]">{msg.ts}</span>
        </div>
      </div>
    </div>
  )
}

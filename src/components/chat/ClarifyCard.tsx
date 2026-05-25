'use client'

import { useState } from 'react'
import { BotIcon } from './icons'
import type { Message, ClarificationAnswer } from '@/types/chat'

const SKIP_LABEL     = 'Lewati'
const FREETEXT_LABEL = 'Lainnya'

interface ClarifyCardProps {
  msg: Message
  onSelect: (answers: ClarificationAnswer[], additionalConstraints?: string) => void
  isLast: boolean
}

export function ClarifyCard({ msg, onSelect, isLast }: ClarifyCardProps) {
  const questions = msg.clarification_questions ?? []

  const [index,          setIndex]          = useState(0)
  const [chipSelections, setChipSelections] = useState<Record<string, string>>({})
  const [ownTexts,       setOwnTexts]       = useState<Record<string, string>>({})
  const [additionalConstraints, setAdditionalConstraints] = useState('')
  const [doneAnswers,    setDoneAnswers]     = useState<ClarificationAnswer[]>([])
  const [submitted,      setSubmitted]       = useState(false)

  const isDone   = submitted || !isLast
  const current  = questions[index]
  const isFirstQ = index === 0
  const isLastQ  = index === questions.length - 1

  const selChip   = (id: string) => chipSelections[id] ?? ''
  const ownText   = (id: string) => ownTexts[id] ?? ''
  const showOwn   = (id: string) => selChip(id) === FREETEXT_LABEL

  function isAnswered(id: string) {
    if (selChip(id) === FREETEXT_LABEL) return ownText(id).trim().length > 0
    return selChip(id).length > 0
  }

  const currentAnswered = current ? isAnswered(current.id) : false

  function pickChip(option: string) {
    if (isDone || !current) return
    setChipSelections((p) => ({ ...p, [current.id]: option }))
  }

  function setOwn(text: string) {
    if (isDone || !current) return
    setOwnTexts((p) => ({ ...p, [current.id]: text }))
  }

  function buildAnswers(): ClarificationAnswer[] {
    return questions.map((q) => {
      if (selChip(q.id) === FREETEXT_LABEL) {
        return { question_id: q.id, selected_option: FREETEXT_LABEL, free_text: ownText(q.id).trim() }
      }
      return { question_id: q.id, selected_option: selChip(q.id) || SKIP_LABEL }
    })
  }

  function displayLabel(a: ClarificationAnswer) {
    return a.free_text || a.selected_option
  }

  function goNext() {
    if (!currentAnswered || isDone) return
    if (isLastQ) {
      const answers = buildAnswers()
      setDoneAnswers(answers)
      setSubmitted(true)
      onSelect(answers, additionalConstraints.trim() || undefined)
    } else {
      setIndex((i) => i + 1)
    }
  }

  function goBack() {
    if (isFirstQ || isDone) return
    setIndex((i) => i - 1)
  }

  // ── Done state ────────────────────────────────────────────── //
  if (isDone) {
    const displayList = doneAnswers.length ? doneAnswers : buildAnswers()
    return (
      <div className="flex flex-row gap-2.5 mb-5.5 items-start"
        style={{ animation: 'msgIn 0.25s ease forwards' }}
      >
        <div className="w-8 h-8 rounded-full shrink-0 bg-brand-500 flex items-center justify-center text-white mt-0.5">
          <BotIcon />
        </div>
        <div className="max-w-[72%]">
          <div className="bg-[rgba(70,95,255,0.04)] dark:bg-[rgba(70,95,255,0.07)] border border-[rgba(70,95,255,0.18)] dark:border-[rgba(70,95,255,0.2)] rounded-[16px_16px_16px_4px] px-4 py-3">
            {msg.content && (
              <p className="text-[13px] text-[#374151] dark:text-[#d1d5db] mb-2.5 leading-relaxed">
                {msg.content}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {displayList.map((a) => (
                <span key={a.question_id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium"
                  style={{ background: '#465fff', color: 'white' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {displayLabel(a)}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[11px] text-[#9ca3af] dark:text-[#374151] mt-1 block">{msg.ts}</span>
        </div>
      </div>
    )
  }

  // ── Active state ──────────────────────────────────────────── //
  return (
    <div className="flex flex-row gap-2.5 mb-5.5 items-start"
      style={{ animation: 'msgIn 0.25s ease forwards' }}
    >
      <div className="w-8 h-8 rounded-full shrink-0 bg-brand-500 flex items-center justify-center text-white mt-0.5">
        <BotIcon />
      </div>

      <div className="max-w-[72%]">
        <div className="bg-white dark:bg-[#111827] border border-[#e5e7eb] dark:border-[#1f2937] rounded-[16px_16px_16px_4px] overflow-hidden shadow-sm">

          {/* Header: question + step badge */}
          <div className="px-4 pt-4 pb-3 border-b border-[#f3f4f6] dark:border-[#1f2937] flex items-start justify-between gap-3">
            <p className="text-[14px] font-medium text-[#111827] dark:text-gray-50 leading-relaxed flex-1">
              {current?.question}
            </p>
            {questions.length > 1 && (
              <span className="shrink-0 text-[11px] font-semibold text-[#9ca3af] dark:text-[#6b7280] bg-[#f3f4f6] dark:bg-[#1f2937] px-2 py-0.5 rounded-full mt-0.5 tabular-nums">
                {index + 1} / {questions.length}
              </span>
            )}
          </div>

          {/* Chips section */}
          <div className="px-4 pt-3 pb-2.5 flex flex-wrap gap-1.5">
            {/* Backend-provided options */}
            {current?.options.map((opt) => {
              const chosen = selChip(current.id) === opt
              return (
                <button key={opt} onClick={() => pickChip(opt)}
                  className="px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all duration-150"
                  style={{
                    border: `1.5px solid ${chosen ? '#465fff' : 'rgba(70,95,255,0.25)'}`,
                    background: chosen ? '#465fff' : 'rgba(70,95,255,0.05)',
                    color: chosen ? 'white' : '#4b5563',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { if (!chosen) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(70,95,255,0.1)' }}
                  onMouseLeave={(e) => { if (!chosen) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(70,95,255,0.05)' }}
                >
                  {chosen && (
                    <svg className="inline mr-1 mb-px" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {opt}
                </button>
              )
            })}
          </div>

          {/* Own-answer text input — only when "Lainnya" is selected */}
          {showOwn(current?.id ?? '') && (
            <div className="px-4 pb-3">
              <input
                type="text"
                autoFocus
                value={ownText(current?.id ?? '')}
                onChange={(e) => setOwn(e.target.value)}
                placeholder="Tulis jawabanmu di sini…"
                className="w-full text-[12.5px] text-[#374151] dark:text-[#d1d5db] placeholder-[#9ca3af] bg-gray-50 dark:bg-[#1a2535] border border-gray-200 dark:border-[#2d3748] rounded-lg px-3 py-2 outline-none transition-all"
                style={{
                  borderColor: ownText(current?.id ?? '') ? '#465fff' : undefined,
                  boxShadow:   ownText(current?.id ?? '') ? '0 0 0 3px rgba(70,95,255,0.10)' : undefined,
                }}
              />
            </div>
          )}

          {/* Additional constraints */}
          <div className="px-4 pb-3 border-t border-[#f3f4f6] dark:border-[#1f2937] pt-3">
            <p className="text-[11px] font-semibold text-[#9ca3af] dark:text-[#6b7280] mb-1.5 uppercase tracking-wide">
              Prompt tambahan
            </p>
            <input
              type="text"
              value={additionalConstraints}
              onChange={(e) => setAdditionalConstraints(e.target.value)}
              placeholder="Tambahkan konteks atau batasan opsional…"
              className="w-full text-[12.5px] text-[#374151] dark:text-[#d1d5db] placeholder-[#9ca3af] bg-gray-50 dark:bg-[#1a2535] border border-gray-200 dark:border-[#2d3748] rounded-lg px-3 py-2 outline-none transition-all"
              style={{
                borderColor: additionalConstraints ? '#465fff' : undefined,
                boxShadow:   additionalConstraints ? '0 0 0 3px rgba(70,95,255,0.10)' : undefined,
              }}
            />
          </div>

          {/* Navigation */}
          <div className="px-4 pb-4 flex items-center justify-between">
            <button onClick={goBack} disabled={isFirstQ}
              className="flex items-center gap-1 text-[12px] font-medium transition-all duration-150"
              style={{ color: isFirstQ ? '#d1d5db' : '#6b7280', cursor: isFirstQ ? 'not-allowed' : 'pointer', background: 'none', border: 'none', padding: '4px 2px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>

            <button onClick={goNext} disabled={!currentAnswered}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-all duration-150"
              style={{
                background: currentAnswered ? '#465fff' : 'rgba(70,95,255,0.12)',
                color: currentAnswered ? 'white' : '#9ca3af',
                cursor: currentAnswered ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              {isLastQ ? 'Submit' : 'Next'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>

        <span className="text-[11px] text-[#9ca3af] dark:text-[#374151] mt-1 block">{msg.ts}</span>
      </div>
    </div>
  )
}

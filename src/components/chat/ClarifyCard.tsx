'use client'

import { useState } from 'react'
import { CheckIcon, PenIcon } from './icons'
import type { Message, ClarificationAnswer } from '@/types/chat'

const SKIP_LABEL     = 'Lewati'
const FREETEXT_LABEL = 'Lainnya'

interface ClarifyCardProps {
  msg: Message
  onSelect: (answers: ClarificationAnswer[], additionalConstraints?: string) => void
}

export function ClarifyCard({ msg, onSelect }: ClarifyCardProps) {
  const questions = msg.clarification_questions ?? []

  const [index,                 setIndex]                 = useState(0)
  const [chipSelections,        setChipSelections]        = useState<Record<string, string>>({})
  const [ownTexts,              setOwnTexts]              = useState<Record<string, string>>({})
  const [additionalConstraints, setAdditionalConstraints] = useState('')
  const [showingAdditional,     setShowingAdditional]     = useState(false)

  const current  = questions[index]
  const isFirstQ = index === 0
  const isLastQ  = index === questions.length - 1

  const selChip = (id: string) => chipSelections[id] ?? ''
  const ownText = (id: string) => ownTexts[id] ?? ''

  function isAnswered(id: string) {
    if (selChip(id) === FREETEXT_LABEL) return ownText(id).trim().length > 0
    return selChip(id).length > 0
  }

  const currentAnswered = current ? isAnswered(current.id) : false

  function pickChip(option: string) {
    if (!current) return
    setChipSelections((p) => ({ ...p, [current.id]: option }))
  }

  function setOwn(text: string) {
    if (!current) return
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

  function goNext() {
    if (!currentAnswered) return
    if (isLastQ) {
      setShowingAdditional(true)
    } else {
      setIndex((i) => i + 1)
    }
  }

  function goSubmit() {
    onSelect(buildAnswers(), additionalConstraints.trim() || undefined)
  }

  function goBack() {
    if (showingAdditional) {
      setShowingAdditional(false)
    } else if (!isFirstQ) {
      setIndex((i) => i - 1)
    }
  }

  // ── Additional constraints step ───────────────────────────── //
  if (showingAdditional) {
    return (
      <div
        className="bg-white dark:bg-[#111827] border border-[#e5e7eb] dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm w-full"
        style={{ animation: 'msgIn 0.22s ease forwards' }}
      >
        <div className="px-4 pt-4 pb-3 border-b border-[#f3f4f6] dark:border-[#1f2937]">
          <p className="text-[14px] font-medium text-[#111827] dark:text-gray-50 leading-relaxed">
            Ada konteks atau batasan tambahan yang ingin kamu tambahkan?
          </p>
          <p className="text-[12px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
            Opsional — kosongkan jika tidak ada.
          </p>
        </div>
        <div className="px-4 py-3">
          <input
            type="text"
            autoFocus
            value={additionalConstraints}
            onChange={(e) => setAdditionalConstraints(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') goSubmit() }}
            placeholder="Contoh: hanya divisi aktif, tahun 2024…"
            className="w-full text-[12.5px] text-[#374151] dark:text-[#d1d5db] placeholder-[#9ca3af] bg-gray-50 dark:bg-[#1a2535] border border-gray-200 dark:border-[#2d3748] rounded-lg px-3 py-2 outline-none transition-all"
            style={{
              borderColor: additionalConstraints ? '#465fff' : undefined,
              boxShadow:   additionalConstraints ? '0 0 0 3px rgba(70,95,255,0.10)' : undefined,
            }}
          />
        </div>
        <div className="px-4 pb-4 flex items-center justify-between">
          <button onClick={goBack}
            className="flex items-center gap-1 text-[12px] font-medium transition-all duration-150"
            style={{ color: '#6b7280', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 2px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Kembali
          </button>
          <button onClick={goSubmit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-all duration-150"
            style={{ background: '#465fff', color: 'white', cursor: 'pointer', border: 'none' }}
          >
            Kirim
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // ── Active state ──────────────────────────────────────────── //
  return (
    <div
      className="bg-white dark:bg-[#111827] border border-[#e5e7eb] dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm w-full"
      style={{ animation: 'msgIn 0.22s ease forwards' }}
    >
      {/* Header: question text + step badge */}
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

      {/* Options — one row per option, style driven by option value */}
      <div className="px-4 pt-3 pb-2.5 flex flex-col gap-2">
        {current?.options.map((opt) => {
          const chosen = selChip(current.id) === opt

          if (opt === SKIP_LABEL) {
            return (
              <button key={opt} onClick={() => pickChip(opt)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-[10px] text-[13px] font-medium text-left transition-all duration-150"
                style={{
                  border: `1.5px solid ${chosen ? '#9ca3af' : 'rgba(156,163,175,0.4)'}`,
                  background: chosen ? '#9ca3af' : 'rgba(156,163,175,0.07)',
                  color: chosen ? 'white' : '#9ca3af',
                  cursor: 'pointer',
                }}
              >
                <span>{opt}</span>
                {chosen && <span style={{ color: 'white' }}><CheckIcon /></span>}
              </button>
            )
          }

          if (opt === FREETEXT_LABEL) {
            return (
              <button key={opt} onClick={() => pickChip(opt)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-[10px] text-[13px] font-medium text-left transition-all duration-150"
                style={{
                  border: `1.5px solid ${chosen ? '#465fff' : 'rgba(70,95,255,0.25)'}`,
                  background: chosen ? 'rgba(70,95,255,0.08)' : 'transparent',
                  color: chosen ? '#465fff' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                <span className="flex items-center gap-1.5"><PenIcon /> {opt}</span>
                {chosen && <span style={{ color: '#465fff' }}><CheckIcon /></span>}
              </button>
            )
          }

          return (
            <button key={opt} onClick={() => pickChip(opt)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-[10px] text-[13px] font-medium text-left transition-all duration-150"
              style={{
                border: `1.5px solid ${chosen ? '#465fff' : 'rgba(70,95,255,0.25)'}`,
                background: chosen ? '#465fff' : 'rgba(70,95,255,0.05)',
                color: chosen ? 'white' : '#374151',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { if (!chosen) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(70,95,255,0.1)' }}
              onMouseLeave={(e) => { if (!chosen) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(70,95,255,0.05)' }}
            >
              <span>{opt}</span>
              {chosen && <CheckIcon />}
            </button>
          )
        })}
      </div>

      {/* Free-text input — shown only when "Lainnya" is selected */}
      {selChip(current?.id ?? '') === FREETEXT_LABEL && (
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

      {/* Navigation */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <button onClick={goBack} disabled={isFirstQ}
          className="flex items-center gap-1 text-[12px] font-medium transition-all duration-150"
          style={{ color: isFirstQ ? '#d1d5db' : '#6b7280', cursor: isFirstQ ? 'not-allowed' : 'pointer', background: 'none', border: 'none', padding: '4px 2px' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Kembali
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
          Lanjut
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

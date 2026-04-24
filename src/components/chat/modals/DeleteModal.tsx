'use client'

import { TrashIcon } from '../icons'

interface DeleteModalProps {
  title: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteModal({ title, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/55 z-[8000] flex items-center justify-center backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-[#1a2535] rounded-2xl px-7 pt-7 pb-[22px] max-w-[380px] w-[90vw] border border-[#e4e7ec] dark:border-[#2d3748] shadow-[0_24px_60px_rgba(16,24,40,.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,.6)]"
        style={{ animation: 'modalIn 0.22s cubic-bezier(.34,1.56,.64,1) forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-11 h-11 rounded-xl bg-[rgba(240,68,56,.12)] flex items-center justify-center mb-4 text-[#f04438]">
          <TrashIcon />
        </div>
        <h3 className="text-base font-bold text-[#101828] dark:text-[#e5e7eb] mb-2">Delete this chat?</h3>
        <p className="text-[13px] text-[#6b7280] leading-relaxed mb-[22px]">
          "<span className="font-medium text-[#374151] dark:text-[#9ca3af]">{title}</span>" will be permanently deleted. This action cannot be undone.
        </p>
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onCancel}
            className="px-[18px] py-2 rounded-[9px] border border-[#d1d5db] dark:border-[#374151] bg-transparent text-[#374151] dark:text-[#9ca3af] text-[13px] font-medium cursor-pointer hover:bg-[#f9fafb] dark:hover:bg-white/[0.04] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-[18px] py-2 rounded-[9px] border-none bg-[#f04438] text-white text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

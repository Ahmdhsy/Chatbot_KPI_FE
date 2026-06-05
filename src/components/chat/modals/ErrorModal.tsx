'use client'

interface ErrorModalProps {
  title: string
  message: string
  status?: number
  onClose: () => void
}

const AlertCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

export function ErrorModal({ title, message, status, onClose }: ErrorModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/55 z-[8000] flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a2535] rounded-2xl px-7 pt-7 pb-[22px] max-w-[420px] w-[90vw] border border-[#e4e7ec] dark:border-[#2d3748] shadow-[0_24px_60px_rgba(16,24,40,.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,.6)]"
        style={{ animation: 'modalIn 0.22s cubic-bezier(.34,1.56,.64,1) forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-xl bg-[rgba(240,68,56,.12)] flex items-center justify-center flex-shrink-0 text-[#f04438]">
            <AlertCircleIcon />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[17px] font-bold text-[#101828] dark:text-[#e5e7eb]">{title}</h3>
              {status && (
                <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(240,68,56,.1)] text-[#f04438]">
                  {status}
                </span>
              )}
            </div>
            <p className="text-[14px] text-[#6b7280] dark:text-[#9ca3af] leading-relaxed break-words">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-[9px] border-none bg-[#f04438] text-white text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

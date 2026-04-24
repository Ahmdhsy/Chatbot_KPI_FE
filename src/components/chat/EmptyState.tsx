'use client'

import { BotIcon } from './icons'

const SUGGESTIONS = [
  'Summarize Q1 KPIs',
  'Compare revenue by region',
  'Show HR turnover trends',
  'Budget vs Actuals Q4',
]

const ORBS = [
  { size: 48, style: { top: '12%', left: '8%' }, anim: 'floatA 5s ease-in-out infinite', opacity: 0.18, delay: '0s' },
  { size: 32, style: { top: '20%', right: '12%' }, anim: 'floatB 6.5s ease-in-out infinite', opacity: 0.14, delay: '.8s' },
  { size: 56, style: { bottom: '20%', left: '14%' }, anim: 'floatC 7s ease-in-out infinite', opacity: 0.12, delay: '1.2s' },
  { size: 24, style: { bottom: '28%', right: '10%' }, anim: 'floatA 4.5s ease-in-out infinite', opacity: 0.16, delay: '.4s' },
  { size: 40, style: { top: '42%', left: '3%' }, anim: 'floatB 8s ease-in-out infinite', opacity: 0.1, delay: '2s' },
  { size: 20, style: { top: '55%', right: '5%' }, anim: 'floatC 5.5s ease-in-out infinite', opacity: 0.13, delay: '1.6s' },
]

interface EmptyStateProps {
  onSuggest: (text: string) => void
}

export function EmptyState({ onSuggest }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
      {/* Floating orbs */}
      {ORBS.map((o, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: o.size,
            height: o.size,
            background: 'radial-gradient(circle, #465fff, transparent)',
            opacity: o.opacity,
            animation: o.anim,
            animationDelay: o.delay,
            ...o.style,
          }}
        />
      ))}

      {/* Bot icon */}
      <div
        className="w-[68px] h-[68px] rounded-[20px] bg-brand-500 flex items-center justify-center text-white mb-6"
        style={{ animation: 'pulseGlow 3s ease-in-out infinite, fadeSlideUp 0.5s ease forwards' }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M12 2a3 3 0 0 1 3 3v6H9V5a3 3 0 0 1 3-3z" />
          <circle cx="8" cy="16" r="1" fill="currentColor" stroke="none" />
          <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
        </svg>
      </div>

      <h2
        className="text-[22px] font-bold text-[#101828] dark:text-[#e5e7eb] mb-2.5 tracking-tight"
        style={{ animation: 'fadeSlideUp 0.5s 0.1s ease both' }}
      >
        How can I help you?
      </h2>

      <p
        className="text-sm text-[#9ca3af] dark:text-[#6b7280] max-w-[320px] leading-[1.7] mb-8"
        style={{ animation: 'fadeSlideUp 0.5s 0.2s ease both' }}
      >
        Ask me anything about your KPI data — analyze metrics, surface trends, and explain performance across all business areas.
      </p>

      <div
        className="flex flex-wrap gap-2 justify-center max-w-[500px]"
        style={{ animation: 'fadeSlideUp 0.5s 0.3s ease both' }}
      >
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="px-4 py-2.5 rounded-full border border-[#e4e7ec] dark:border-[#2d3748] bg-transparent text-[#475467] dark:text-[#9ca3af] text-[13px] cursor-pointer transition-all hover:bg-[#ecf3ff] dark:hover:bg-[rgba(70,95,255,0.18)] hover:text-brand-500 hover:border-brand-500 hover:-translate-y-0.5"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

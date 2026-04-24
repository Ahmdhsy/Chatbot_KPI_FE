import { BotIcon } from './icons'

export function TypingIndicator() {
  return (
    <div
      className="flex items-start gap-2.5 mb-4"
      style={{ animation: 'msgIn 0.25s ease forwards' }}
    >
      <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
        <BotIcon />
      </div>
      <div className="bg-white dark:bg-[#1a2535] border border-[#e4e7ec] dark:border-[#2d3748] rounded-[16px_16px_16px_4px] shadow-sm dark:shadow-none px-3.5 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block w-[7px] h-[7px] rounded-full bg-brand-500"
            style={{
              animation: `typingBounce 1.2s infinite`,
              animationDelay: `${i * 0.18}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  )
}

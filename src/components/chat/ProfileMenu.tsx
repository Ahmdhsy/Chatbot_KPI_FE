'use client'

import { useRouter } from 'next/navigation'
import { LogoutIcon, ManageIcon } from './icons'

interface ProfileMenuProps {
  userName: string
  userEmail: string
  managementPath: string | null
  onLogoutRequest: () => void
  onClose: () => void
}

export function ProfileMenu({ userName, userEmail, managementPath, onLogoutRequest, onClose }: ProfileMenuProps) {
  const router = useRouter()

  return (
    <div
      className="absolute bottom-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-[#1a2535] border border-[#e4e7ec] dark:border-[#2d3748] rounded-xl p-1.5 shadow-xl dark:shadow-[0_-8px_24px_rgba(0,0,0,.5)] z-50"
      style={{ animation: 'menuPop 0.18s ease forwards' }}
    >
      <div className="px-2.5 py-2 pb-2.5 border-b border-[#f3f4f6] dark:border-[#2d3748] mb-1">
        <p className="text-[14px] font-semibold text-[#101828] dark:text-[#e5e7eb]">{userName}</p>
        <p className="text-[12px] text-[#9ca3af] dark:text-[#4b5563]">{userEmail}</p>
      </div>

      {managementPath && (
        <button
          onClick={() => { router.push(managementPath); onClose() }}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[14px] text-[#344054] dark:text-[#d1d5db] hover:bg-[#f3f4f6] dark:hover:bg-white/[0.06] transition-colors text-left"
        >
          <ManageIcon />
          Manajemen
        </button>
      )}

      <button
        onClick={() => { onLogoutRequest(); onClose() }}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[14px] text-[#f04438] hover:bg-[#fff5f5] dark:hover:bg-[rgba(240,68,56,0.08)] transition-colors text-left"
      >
        <LogoutIcon />
        Keluar
      </button>
    </div>
  )
}

'use client'

import { useChat } from '@/hooks/useChat'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessageList } from './ChatMessageList'
import { ChatInputBar } from './ChatInputBar'
import { DeleteModal } from './modals/DeleteModal'
import { LogoutModal } from './modals/LogoutModal'
import { MenuIcon, SunIcon, MoonIcon } from './icons'
import { useAuth } from '@/context/AuthContext'

export function ChatPage() {
  const { user, logout } = useAuth()
  const userName = user?.full_name ?? 'KPI Analyst'
  const userEmail = user?.email ?? ''

  const {
    sessions, activeSessionId, currentMessages, isTyping,
    sidebarOpen, dark, deleteModal, logoutModal,
    sendMessage, selectClarification, editMessage, retryMessage,
    selectSession, createSession, requestDelete, confirmDelete, cancelDelete,
    renameSession, toggleSidebar, toggleDark, setLogoutModal,
  } = useChat()

  const borderC = dark ? '#1f2937' : '#e4e7ec'
  const panelBg = dark ? '#0d1117' : '#ffffff'
  const activeTitle = sessions.find((s) => s.id === activeSessionId)?.title ?? 'New Chat'

  return (
    <div className={`h-screen flex overflow-hidden font-outfit ${dark ? 'dark' : ''}`}
      style={{ background: dark ? '#111827' : '#f3f4f6' }}
    >
      {/* Delete modal */}
      {deleteModal && (
        <DeleteModal
          title={deleteModal.title}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {/* Logout modal */}
      {logoutModal && (
        <LogoutModal
          userEmail={userEmail}
          onConfirm={async () => { await logout(); window.location.replace('/signin') }}
          onCancel={() => setLogoutModal(false)}
        />
      )}

      {/* Sidebar with animated width */}
      <div
        className="flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(.4,0,.2,1)] h-full"
        style={{ width: sidebarOpen ? 260 : 0 }}
      >
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={selectSession}
          onNew={createSession}
          onDelete={requestDelete}
          onRename={renameSession}
          onLogoutRequest={() => setLogoutModal(true)}
          userName={userName}
          userEmail={userEmail}
        />
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Topbar */}
        <div
          className="h-14 flex items-center justify-between px-5 flex-shrink-0 border-b"
          style={{ borderColor: borderC, background: panelBg }}
        >
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-[7px] border-none bg-transparent cursor-pointer text-[#9ca3af] dark:text-[#6b7280] hover:bg-[#f3f4f6] dark:hover:bg-[#1f2937] transition-colors"
            >
              <MenuIcon />
            </button>
            <p className="text-sm font-semibold text-[#344054] dark:text-[#e5e7eb]">
              {activeTitle}
            </p>
          </div>
          <button
            onClick={toggleDark}
            title={dark ? 'Light mode' : 'Dark mode'}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center border cursor-pointer bg-transparent text-[#6b7280] dark:text-[#9ca3af] hover:bg-[#f2f4f7] dark:hover:bg-[#1f2937] transition-colors"
            style={{ borderColor: borderC }}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        {/* Messages */}
        <ChatMessageList
          messages={currentMessages}
          isTyping={isTyping}
          onSuggest={sendMessage}
          onEditSave={editMessage}
          onRetry={retryMessage}
          onClarifySelect={selectClarification}
        />

        {/* Input */}
        <ChatInputBar onSend={sendMessage} disabled={isTyping} />
      </div>
    </div>
  )
}

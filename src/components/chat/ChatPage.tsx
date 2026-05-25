'use client'

import { useChat } from '@/hooks/useChat'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessageList } from './ChatMessageList'
import { ChatInputBar } from './ChatInputBar'
import { ClarifyCard } from './ClarifyCard'
import { DeleteModal } from './modals/DeleteModal'
import { LogoutModal } from './modals/LogoutModal'
import { ErrorModal } from './modals/ErrorModal'
import { MenuIcon, SunIcon, MoonIcon } from './icons'
import { useAuth } from '@/context/AuthContext'

export function ChatPage() {
  const { user, logout } = useAuth()
  const userName = user?.full_name ?? 'KPI Analyst'
  const userEmail = user?.email ?? ''

  const {
    sessions, activeSessionId, currentMessages, isTyping,
    sidebarOpen, dark, deleteModal, logoutModal, errorModal,
    sendMessage, selectClarification, editMessage, retryMessage,
    selectSession, createSession, requestDelete, confirmDelete, cancelDelete,
    renameSession, toggleSidebar, toggleDark, setLogoutModal, setErrorModal,
  } = useChat()

  const borderC = dark ? '#1f2937' : '#e4e7ec'
  const panelBg = dark ? '#0d1117' : '#ffffff'
  const activeTitle = sessions.find((s) => s.id === activeSessionId)?.title ?? 'New Chat'

  const lastMsg = currentMessages[currentMessages.length - 1]
  const pendingClarify = (lastMsg?.role === 'bot' && lastMsg?.type === 'clarify') ? lastMsg : null

  return (
    <div className={`h-screen flex flex-1 overflow-hidden font-outfit ${dark ? 'dark' : ''}`}
      style={{ background: dark ? '#111827' : '#f3f4f6' }}
    >
      {deleteModal && (
        <DeleteModal
          title={deleteModal.title}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {errorModal && (
        <ErrorModal
          title={errorModal.title}
          message={errorModal.message}
          status={errorModal.status}
          onClose={() => setErrorModal(null)}
        />
      )}

      {logoutModal && (
        <LogoutModal
          userEmail={userEmail}
          onConfirm={async () => { await logout(); window.location.replace('/signin') }}
          onCancel={() => setLogoutModal(false)}
        />
      )}

      <div
        className="flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(.4,0,.2,1)] h-full"
        style={{ width: sidebarOpen ? 350 : 0 }}
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

      <div className="flex flex-col min-w-0 h-full flex-1">
        <div
          className="h-14 flex items-center justify-between px-5 flex-shrink-0 border-b"
          style={{ borderColor: borderC, background: panelBg }}
        >
          <div className="flex items-center gap-2.5">
            <button onClick={toggleSidebar} className="p-1.5 ...">
              <MenuIcon />
            </button>
            <p className="text-sm font-semibold text-[#344054] dark:text-[#e5e7eb]">
              {activeTitle}
            </p>
          </div>

          <button
            onClick={toggleDark}
            title={dark ? 'Light mode' : 'Dark mode'}
            className="w-9 h-9 ..."
            style={{ borderColor: borderC }}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {/* ChatMessageList spans full width so scrollbar sits at the right edge of the screen */}
          <ChatMessageList
            messages={currentMessages}
            isTyping={isTyping}
            onSuggest={sendMessage}
            onEditSave={editMessage}
            onRetry={retryMessage}
          />

          {/* Bottom controls stay centered */}
          <div className="w-full max-w-[720px] mx-auto shrink-0">
            {pendingClarify && (
              <div className="pb-2 border-t" style={{ borderColor: borderC, paddingTop: '10px' }}>
                <ClarifyCard
                  msg={pendingClarify}
                  onSelect={(answers, ac) => selectClarification(answers, ac)}
                />
              </div>
            )}
            <ChatInputBar onSend={sendMessage} disabled={isTyping} />
          </div>
        </div>
      </div>
    </div>
  )
}

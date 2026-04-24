'use client'

import { useState, useEffect, useCallback } from 'react'
import { chatService } from '@/services/chatService'
import { useToast } from '@/context/ToastContext'
import type { Session, Message } from '@/types/chat'

function makeTs() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function useChat() {
  const { addToast } = useToast()

  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dark, setDark] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null)
  const [logoutModal, setLogoutModal] = useState(false)
  const pendingSessionKey = 'pending-new'

  useEffect(() => {
    try { setDark(localStorage.getItem('ck-dark') === 'true') } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('ck-dark', String(dark)) } catch {}
  }, [dark])

  useEffect(() => {
    chatService.getSessions().then((data) => {
      setSessions(data)
      if (data.length > 0) setActiveSessionId(data[0].id)
    }).catch(() => {
      addToast('error', 'Failed to load chat sessions.')
    })
  }, [])

  useEffect(() => {
    if (!activeSessionId) return
    if ((messages[activeSessionId]?.length ?? 0) > 0) return
    chatService.getHistory(activeSessionId).then((history) => {
      if (history.length > 0) {
        setMessages((p) => ({ ...p, [activeSessionId]: history }))
      }
    }).catch(() => {})
  }, [activeSessionId])

  const sendMessage = useCallback(async (text: string) => {
    const tempId = `temp-${Date.now()}`
    const botId = `bot-${Date.now() + 1}`
    const userMsg: Message = { id: tempId, role: 'user', content: text, ts: makeTs(), type: 'text' }
    const key = activeSessionId ?? pendingSessionKey

    setMessages((p) => ({ ...p, [key]: [...(p[key] ?? []), userMsg] }))
    setIsTyping(true)

    try {
      await chatService.sendMessage(activeSessionId, text, {
        onMetadata: (meta) => {
          const sid = meta.session_id
          const botMsg: Message = {
            id: botId,
            role: 'bot',
            ts: makeTs(),
            type: meta.clarification_message_answer_options?.length ? 'clarify' : 'text',
            content: '',
            clarification_options: meta.clarification_message_answer_options,
            graphic_image_base64: meta.graphic_image_base64,
          }
          setIsTyping(false)

          if (sid && sid !== activeSessionId) {
            chatService.getSessions().then((updated) => setSessions(updated)).catch(() => {})
            setMessages((p) => {
              const prev = p[key] ?? []
              const fixed = prev.map((m) =>
                m.id === tempId ? { ...m, id: `user-${Date.now()}` } : m
              )
              const { [key]: _dropped, ...rest } = p
              return { ...rest, [sid]: [...fixed, botMsg] }
            })
            setActiveSessionId(sid)
          } else {
            setMessages((p) => ({
              ...p,
              [key]: [
                ...(p[key] ?? []).map((m) =>
                  m.id === tempId ? { ...m, id: `user-${Date.now()}` } : m
                ),
                botMsg,
              ],
            }))
          }
        },
        onChunk: (chunk) => {
          setMessages((p) => {
            for (const k of Object.keys(p)) {
              const list = p[k]
              const idx = list.findIndex((m) => m.id === botId)
              if (idx !== -1) {
                const updated = [...list]
                updated[idx] = { ...updated[idx], content: (updated[idx].content ?? '') + chunk }
                return { ...p, [k]: updated }
              }
            }
            return p
          })
        },
      })
    } catch {
      setMessages((p) => ({ ...p, [key]: (p[key] ?? []).filter((m) => m.id !== tempId) }))
      addToast('error', 'Failed to send message. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }, [activeSessionId, addToast])

  const selectClarification = useCallback(async (option: string) => {
    if (!activeSessionId) return
    const botId = `bot-${Date.now()}`
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: option,
      ts: makeTs(),
      type: 'text',
    }
    setMessages((p) => ({ ...p, [activeSessionId]: [...(p[activeSessionId] ?? []), userMsg] }))
    setIsTyping(true)

    try {
      await chatService.sendClarification(activeSessionId, option, option, {
        onMetadata: (meta) => {
          const botMsg: Message = {
            id: botId,
            role: 'bot',
            ts: makeTs(),
            type: meta.clarification_message_answer_options?.length ? 'clarify' : 'text',
            content: '',
            clarification_options: meta.clarification_message_answer_options,
            graphic_image_base64: meta.graphic_image_base64,
          }
          setIsTyping(false)
          setMessages((p) => ({
            ...p,
            [activeSessionId]: [...(p[activeSessionId] ?? []), botMsg],
          }))
        },
        onChunk: (chunk) => {
          setMessages((p) => {
            const list = p[activeSessionId] ?? []
            const idx = list.findIndex((m) => m.id === botId)
            if (idx === -1) return p
            const updated = [...list]
            updated[idx] = { ...updated[idx], content: (updated[idx].content ?? '') + chunk }
            return { ...p, [activeSessionId]: updated }
          })
        },
      })
    } catch {
      addToast('error', 'Failed to send clarification.')
    } finally {
      setIsTyping(false)
    }
  }, [activeSessionId, addToast])

  const editMessage = useCallback((msgId: string, newText: string) => {
    if (!activeSessionId) return
    setMessages((p) => {
      const list = [...(p[activeSessionId] ?? [])]
      const idx = list.findIndex((m) => m.id === msgId)
      if (idx === -1) return p
      list[idx] = { ...list[idx], content: newText, ts: makeTs() }
      if (idx + 1 < list.length && list[idx + 1].role === 'bot') {
        list.splice(idx + 1, 1)
      }
      return { ...p, [activeSessionId]: list }
    })
    sendMessage(newText)
  }, [activeSessionId, sendMessage])

  const retryMessage = useCallback((msgId: string) => {
    if (!activeSessionId) return
    setMessages((p) => {
      const list = p[activeSessionId] ?? []
      const idx = list.findIndex((m) => m.id === msgId)
      const prevUser = idx > 0 ? list[idx - 1] : null
      const text = prevUser?.content ?? ''
      const next = list.filter((m) => m.id !== msgId)
      setTimeout(() => sendMessage(text), 0)
      return { ...p, [activeSessionId]: next }
    })
  }, [activeSessionId, sendMessage])

  const selectSession = useCallback((id: string) => {
    setActiveSessionId(id)
  }, [])

  const createSession = useCallback(() => {
    setActiveSessionId(null)
    setMessages((p) => ({ ...p, [pendingSessionKey]: [] }))
  }, [])

  const requestDelete = useCallback((id: string, title: string) => {
    setDeleteModal({ id, title })
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteModal) return
    const { id } = deleteModal
    try {
      await chatService.deleteSession(id)
      setSessions((p) => {
        const next = p.filter((s) => s.id !== id)
        if (activeSessionId === id) {
          setActiveSessionId(next.length > 0 ? next[0].id : null)
        }
        return next
      })
      setMessages((p) => {
        const { [id]: _dropped, ...rest } = p
        return rest
      })
    } catch {
      addToast('error', 'Failed to delete session.')
    } finally {
      setDeleteModal(null)
    }
  }, [deleteModal, activeSessionId, addToast])

  const renameSession = useCallback(async (id: string, title: string) => {
    try {
      await chatService.renameSession(id, title)
      setSessions((p) => p.map((s) => (s.id === id ? { ...s, title } : s)))
    } catch {
      addToast('error', 'Failed to rename session.')
    }
  }, [addToast])

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), [])
  const toggleDark = useCallback(() => setDark((p) => !p), [])
  const cancelDelete = useCallback(() => setDeleteModal(null), [])

  const currentMessages = activeSessionId
    ? (messages[activeSessionId] ?? [])
    : (messages[pendingSessionKey] ?? [])

  return {
    sessions,
    activeSessionId,
    currentMessages,
    isTyping,
    sidebarOpen,
    dark,
    deleteModal,
    logoutModal,
    sendMessage,
    selectClarification,
    editMessage,
    retryMessage,
    selectSession,
    createSession,
    requestDelete,
    confirmDelete,
    cancelDelete,
    renameSession,
    toggleSidebar,
    toggleDark,
    setLogoutModal,
  }
}

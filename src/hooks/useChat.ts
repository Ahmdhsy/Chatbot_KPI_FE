'use client'

import { useState, useEffect, useCallback } from 'react'
import { chatService, ApiError } from '@/services/chatService'
import { useToast } from '@/context/ToastContext'
import type { Session, Message, ClarificationAnswer } from '@/types/chat'

interface ErrorModal {
  title: string
  message: string
  status?: number
}

function httpStatusTitle(status: number): string {
  if (status === 503) return 'Layanan Tidak Tersedia'
  if (status === 500) return 'Kesalahan Server'
  if (status === 408) return 'Request Timeout'
  if (status === 429) return 'Terlalu Banyak Permintaan'
  if (status === 422) return 'Permintaan Tidak Valid'
  if (status === 401) return 'Sesi Berakhir'
  if (status === 403) return 'Akses Ditolak'
  if (status === 404) return 'Tidak Ditemukan'
  return 'Terjadi Kesalahan'
}

function parseError(err: unknown): ErrorModal {
  if (err instanceof ApiError) {
    return { title: httpStatusTitle(err.status), message: err.message, status: err.status }
  }
  const msg = err instanceof Error ? err.message : 'Silakan coba lagi.'
  return { title: 'Terjadi Kesalahan', message: msg }
}

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
  const [errorModal, setErrorModal] = useState<ErrorModal | null>(null)
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
  }, [addToast])

  useEffect(() => {
    if (!activeSessionId) return
    if ((messages[activeSessionId]?.length ?? 0) > 0) return
    chatService.getHistory(activeSessionId).then((history) => {
      if (history.length > 0) {
        setMessages((p) => ({ ...p, [activeSessionId]: history }))
      }
    }).catch(() => {})
  }, [activeSessionId, messages])

  const sendMessage = useCallback(async (text: string) => {
    const tempId = `temp-${Date.now()}`
    const botId = `bot-${Date.now() + 1}`
    let realUserId = tempId
    const userMsg: Message = { id: tempId, role: 'user', content: text, ts: makeTs(), type: 'text' }
    const botPlaceholder: Message = { id: botId, role: 'bot', content: '', ts: makeTs(), type: 'text' }
    const key = activeSessionId ?? pendingSessionKey

    setMessages((p) => ({ ...p, [key]: [...(p[key] ?? []), userMsg, botPlaceholder] }))
    setIsTyping(true)

    try {
      await chatService.sendMessage(activeSessionId, text, {
        onMetadata: (meta) => {
          const sid = meta.session_id
          const newUserId = `user-${Date.now()}`
          realUserId = newUserId

          if (sid && sid !== activeSessionId) {
            chatService.getSessions().then((updated) => setSessions(updated)).catch(() => {})
            setMessages((p) => {
              const prev = p[key] ?? []
              const fixed = prev.map((m) => {
                if (m.id === tempId) return { ...m, id: newUserId }
                if (m.id === botId) return {
                  ...m,
                  type: meta.clarification_questions?.length ? 'clarify' : 'text',
                  clarification_questions: meta.clarification_questions,
                  graphics: meta.graphics,
                }
                return m
              })
              const { [key]: _dropped, ...rest } = p
              return { ...rest, [sid]: fixed }
            })
            setActiveSessionId(sid)
          } else {
            setMessages((p) => ({
              ...p,
              [key]: (p[key] ?? []).map((m) => {
                if (m.id === tempId) return { ...m, id: newUserId }
                if (m.id === botId) return {
                  ...m,
                  type: meta.clarification_questions?.length ? 'clarify' : 'text',
                  clarification_questions: meta.clarification_questions,
                  graphics: meta.graphics,
                }
                return m
              })
            }))
          }
        },
        onChunk: (chunk) => {
          if (!chunk) return
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
    } catch (err) {
      const idsToRemove = new Set([tempId, realUserId, botId])
      setMessages((p) => {
        for (const k of Object.keys(p)) {
          const list = p[k]
          if (list.some((m) => idsToRemove.has(m.id))) {
            return { ...p, [k]: list.filter((m) => !idsToRemove.has(m.id)) }
          }
        }
        return p
      })
      setErrorModal(parseError(err))
    } finally {
      setIsTyping(false)
    }
  }, [activeSessionId, addToast])

  const selectClarification = useCallback(async (answers: ClarificationAnswer[], additionalConstraints?: string) => {
    if (!activeSessionId) return
    const botId = `bot-${Date.now()}`

    const msgs = messages[activeSessionId] ?? []
    const lastTextBotIdx = msgs.reduce((acc, m, i) =>
      m.role === 'bot' && m.type === 'text' ? i : acc, -1)
    const originalMsg = msgs.slice(lastTextBotIdx + 1).find((m) => m.role === 'user')
    const originalQuery = originalMsg?.content ?? ''

    const lastClarifyMsg = [...msgs].reverse().find((m) => m.type === 'clarify')
    const questions = lastClarifyMsg?.clarification_questions ?? []
    const answerText = answers.map((a, i) => {
      const q = questions.find((q) => q.id === a.question_id)
      const aText = a.free_text || a.selected_option
      return q ? `**Q${i + 1}. ${q.question}**\n${aText}` : aText
    }).join('\n\n')

    const userMsgId = `user-${Date.now()}`
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: answerText,
      ts: makeTs(),
      type: 'text',
    }
    const botPlaceholder: Message = { id: botId, role: 'bot', content: '', ts: makeTs(), type: 'text' }
    
    setMessages((p) => ({ ...p, [activeSessionId]: [...(p[activeSessionId] ?? []), userMsg, botPlaceholder] }))
    setIsTyping(true)

    try {
      await chatService.sendClarification(activeSessionId, originalQuery, answers, additionalConstraints, {
        onMetadata: (meta) => {
          setMessages((p) => ({
            ...p,
            [activeSessionId]: (p[activeSessionId] ?? []).map((m) => {
              if (m.id === botId) return {
                ...m,
                type: meta.clarification_questions?.length ? 'clarify' : 'text',
                clarification_questions: meta.clarification_questions,
                graphics: meta.graphics,
              }
              return m
            })
          }))
        },
        onChunk: (chunk) => {
          if (!chunk) return
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
    } catch (err) {
      setMessages((p) => ({
        ...p,
        [activeSessionId]: (p[activeSessionId] ?? []).filter((m) => m.id !== userMsgId),
      }))
      setErrorModal(parseError(err))
    } finally {
      setIsTyping(false)
    }
  }, [activeSessionId, messages, addToast])

  const editMessage = useCallback((msgId: string, newText: string) => {
    if (!activeSessionId) return
    setMessages((p) => {
      const list = p[activeSessionId] ?? []
      const idx = list.findIndex((m) => m.id === msgId)
      if (idx === -1) return p
      return { ...p, [activeSessionId]: list.slice(0, idx) }
    })
    sendMessage(newText)
  }, [activeSessionId, sendMessage])

  const retryMessage = useCallback((msgId: string) => {
    if (!activeSessionId) return
    const list = messages[activeSessionId] ?? []
    const idx = list.findIndex((m) => m.id === msgId)
    if (idx === -1) return
    const prevUserIdx = idx > 0 && list[idx - 1]?.role === 'user' ? idx - 1 : -1
    const text = prevUserIdx >= 0 ? (list[prevUserIdx].content ?? '') : ''
    if (!text) return
    setMessages((p) => ({
      ...p,
      [activeSessionId]: (p[activeSessionId] ?? []).slice(0, prevUserIdx >= 0 ? prevUserIdx : idx),
    }))
    sendMessage(text)
  }, [activeSessionId, messages, sendMessage])

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
    errorModal,
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
    setErrorModal,
  }
}

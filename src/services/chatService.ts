import { apiClientWithAuth } from '@/services/apiClientWithAuth'
import type { Session, ChatStreamMetadata } from '@/types/chat'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

interface SSECallbacks {
  onMetadata?: (meta: ChatStreamMetadata) => void
  onChunk?: (chunk: string) => void
}

async function consumeSSE(
  response: Response,
  callbacks: SSECallbacks,
): Promise<{ metadata: ChatStreamMetadata; message: string }> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let metadata: ChatStreamMetadata = { session_id: '' }
  let message = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      if (!part.trim()) continue
      let eventType = ''
      let dataStr = ''
      for (const line of part.split('\n')) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim()
        else if (line.startsWith('data: ')) dataStr = line.slice(6)
      }
      if (!dataStr) continue
      if (eventType === 'metadata') {
        try {
          metadata = JSON.parse(dataStr)
          callbacks.onMetadata?.(metadata)
        } catch {}
      } else if (eventType === 'message') {
        try {
          const { chunk } = JSON.parse(dataStr)
          if (chunk) { message += chunk; callbacks.onChunk?.(chunk) }
        } catch {}
      }
    }
  }

  return { metadata, message }
}

export const chatService = {
  async getSessions(): Promise<Session[]> {
    const { data } = await apiClientWithAuth.get<Session[]>('/api/v1/chat/sessions')
    return data
  },

  async getHistory(_sessionId: string): Promise<[]> {
    return []
  },

  async sendMessage(
    sessionId: string | null,
    text: string,
    callbacks: SSECallbacks = {},
  ): Promise<{ metadata: ChatStreamMetadata; message: string }> {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ session_id: sessionId, message: text }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return consumeSSE(response, callbacks)
  },

  async sendClarification(
    sessionId: string,
    message: string,
    clarificationAnswer: string,
    callbacks: SSECallbacks = {},
  ): Promise<{ metadata: ChatStreamMetadata; message: string }> {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE}/api/v1/chat/clarification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        clarification_answer: clarificationAnswer,
      }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return consumeSSE(response, callbacks)
  },

  async deleteSession(id: string): Promise<void> {
    await apiClientWithAuth.delete(`/api/v1/chat/sessions/${id}`)
  },

  async renameSession(id: string, title: string): Promise<Session> {
    const { data } = await apiClientWithAuth.patch<Session>(
      `/api/v1/chat/sessions/${id}/title`,
      { title },
    )
    return data
  },
}

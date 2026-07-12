import { apiClientWithAuth, getAuthToken, fetchWithAuth } from '@/services/apiClientWithAuth'
import type { Session, Message, ChatStreamMetadata, ClarificationAnswer } from '@/types/chat'

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (response.ok) return
  let detail: any = `HTTP ${response.status}`
  try {
    const body = await response.clone().json()
    if (body?.detail) {
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    }
  } catch {}
  throw new ApiError(response.status, detail)
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

  // Queue of parsed SSE events to dispatch one-by-one asynchronously.
  // This prevents React 18 auto-batching from collapsing multiple
  // setMessages() calls (fired from onChunk) into a single render.
  const eventQueue: Array<{ type: string; data: string }> = []
  let draining = false

  async function drainQueue() {
    if (draining) return
    draining = true
    while (eventQueue.length > 0) {
      const event = eventQueue.shift()!
      if (event.type === 'metadata') {
        try {
          metadata = JSON.parse(event.data)
          if (metadata.graphics) {
            metadata.graphics = metadata.graphics.map((g: any) => ({
              ...g,
              image_url: g.image_url.startsWith('http') ? g.image_url : `${API_BASE}${g.image_url}`,
            }))
          }
          callbacks.onMetadata?.(metadata)
        } catch {}
      } else if (event.type === 'message') {
        try {
          const { chunk } = JSON.parse(event.data)
          if (chunk) {
            message += chunk
            callbacks.onChunk?.(chunk)
          }
        } catch {}
      }
      // Yield to the event loop between each chunk so React can re-render.
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
    draining = false
  }

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
      if (!dataStr || !eventType) continue
      eventQueue.push({ type: eventType, data: dataStr })
    }

    // Start draining without blocking the reader loop.
    drainQueue()
  }

  // Wait for any remaining items in the queue to be dispatched.
  while (eventQueue.length > 0 || draining) {
    await new Promise<void>((resolve) => setTimeout(resolve, 10))
  }

  return { metadata, message }
}



export const chatService = {
  async getSessions(): Promise<Session[]> {
    const { data } = await apiClientWithAuth.get<Session[]>('/api/v1/chat/sessions')
    return data
  },

  async getHistory(sessionId: string): Promise<Message[]> {
    const { data } = await apiClientWithAuth.get<{
      messages: Array<{
        message_id: string
        message: string
        is_sender_chatbot: boolean
        send_at: string
        clarification_questions: Array<{
          id: string
          ambiguity_type: string | null
          question: string
          options: string[]
          selected_answer: string | null
          free_text_answer: string | null
        }>
        graphics: Array<{
          kpi_name: string | null
          chart_type: string
          image_url: string
        }>
      }>
    }>(`/api/v1/chat/sessions/${sessionId}`)

    // Clarification questions di DB di-link ke user message (bukan bot message).
    // Saat mapping, bot message yang langsung mengikuti user message dengan questions
    // harus di-treat sebagai tipe 'clarify' dengan questions dari user message sebelumnya.
    const raw = data.messages
    const mapped: Message[] = raw.map((m, idx) => {
      const ts = new Date(m.send_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      // Cek apakah bot message ini langsung mengikuti user message yang punya questions
      const prevRaw = idx > 0 ? raw[idx - 1] : null
      const activeQuestions =
        prevRaw?.clarification_questions.filter(
          (q) => q.ambiguity_type && q.ambiguity_type !== 'none',
        ) || []
      const inheritedQuestions =
        m.is_sender_chatbot &&
        prevRaw &&
        !prevRaw.is_sender_chatbot &&
        activeQuestions.length > 0
          ? activeQuestions
          : null

      const hasClarify = inheritedQuestions !== null

      return {
        id: m.message_id,
        role: m.is_sender_chatbot ? 'bot' : 'user',
        content: m.message,
        ts,
        type: hasClarify ? 'clarify' : 'text',
        clarification_questions: hasClarify
          ? inheritedQuestions!.map((q) => ({
              id: q.id,
              ambiguity_type: q.ambiguity_type ?? '',
              question: q.question,
              options: q.options,
              selected_answer: q.selected_answer,
              free_text_answer: q.free_text_answer,
            }))
          : undefined,
        graphics: m.graphics?.length
          ? m.graphics.map((g) => ({
              ...g,
              image_url: g.image_url.startsWith('http') ? g.image_url : `${API_BASE}${g.image_url}`,
            }))
          : undefined,
      } satisfies Message
    })

    // Sisipkan synthetic user message setelah clarify bot message yang sudah dijawab
    const result: Message[] = []
    for (const msg of mapped) {
      result.push(msg)
      if (msg.type === 'clarify' && msg.clarification_questions) {
        const answered = msg.clarification_questions.filter((q) => q.selected_answer)
        if (answered.length > 0) {
          const answerText = answered
            .map((q, i) => `**Q${i + 1}. ${q.question}**\n${q.free_text_answer || q.selected_answer}`)
            .join('\n\n')
          result.push({
            id: `answer-${msg.id}`,
            role: 'user',
            content: answerText,
            ts: msg.ts,
            type: 'text',
          })
        }
      }
    }
    return result
  },

  async sendMessage(
    sessionId: string | null,
    text: string,
    callbacks: SSECallbacks = {},
  ): Promise<{ metadata: ChatStreamMetadata; message: string }> {
    const response = await fetchWithAuth(`${API_BASE}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId, message: text }),
    })
    await throwIfNotOk(response)
    const result = await consumeSSE(response, callbacks)
    if (!result.metadata.session_id && !result.message) {
      throw new ApiError(500, "Tidak dapat memproses permintaan. Chatbot belum dikonfigurasi atau terjadi kesalahan internal.")
    }
    return result
  },

  async sendClarification(
    sessionId: string,
    originalQuery: string,
    clarificationAnswers: ClarificationAnswer[],
    additionalConstraints?: string,
    callbacks: SSECallbacks = {},
  ): Promise<{ metadata: ChatStreamMetadata; message: string }> {
    const response = await fetchWithAuth(`${API_BASE}/api/v1/chat/clarification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: originalQuery,
        clarification_answers: clarificationAnswers,
        ...(additionalConstraints ? { additional_constraints: additionalConstraints } : {}),
      }),
    })
    await throwIfNotOk(response)
    const result = await consumeSSE(response, callbacks)
    if (!result.metadata.session_id && !result.message) {
      throw new ApiError(500, "Tidak dapat memproses permintaan. Chatbot belum dikonfigurasi atau terjadi kesalahan internal.")
    }
    return result
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

export interface Session {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ClarificationQuestion {
  id: string
  ambiguity_type: string
  question: string
  options: string[]
  selected_answer?: string | null
  free_text_answer?: string | null
  metadata?: Record<string, unknown>
}

export interface ClarificationAnswer {
  question_id: string
  selected_option: string
  free_text?: string
}

export interface Message {
  id: string
  role: 'user' | 'bot'
  content?: string
  ts: string
  type: 'text' | 'clarify'
  clarification_questions?: ClarificationQuestion[]
  graphic_image_base64?: string
}

export interface ChatStreamMetadata {
  session_id: string
  clarification_questions?: ClarificationQuestion[]
  graphic_chart_type?: string
  graphic_image_base64?: string
  rows_returned?: number
  execution_time_ms?: number
}

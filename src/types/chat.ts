export interface Session {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  role: 'user' | 'bot'
  content?: string
  ts: string
  type: 'text' | 'clarify'
  clarification_options?: string[]
  graphic_image_base64?: string
}

export interface ChatStreamMetadata {
  session_id: string
  clarification_message_answer_options?: string[]
  graphic_chart_type?: string
  graphic_image_base64?: string
  rows_returned?: number
  execution_time_ms?: number
}

export const CHAT_SESSION_STATUSES = [
  "open",
  "waiting_for_customer",
  "waiting_for_agent",
  "resolved",
  "closed",
  "escalated",
] as const

export const CHAT_SOURCES = ["storefront", "admin", "ai_assistant"] as const

export const CHAT_SENDER_TYPES = [
  "customer",
  "agent",
  "system",
  "ai",
] as const

export const CHAT_MESSAGE_TYPES = ["message", "note", "system"] as const

export const CHAT_ESCALATION_STATUSES = [
  "open",
  "resolved",
  "dismissed",
] as const

export type ChatSessionStatus = (typeof CHAT_SESSION_STATUSES)[number]
export type ChatSource = (typeof CHAT_SOURCES)[number]
export type ChatSenderType = (typeof CHAT_SENDER_TYPES)[number]
export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[number]
export type ChatEscalationStatus =
  (typeof CHAT_ESCALATION_STATUSES)[number]

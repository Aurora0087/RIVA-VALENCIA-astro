export const REVIEW_STATUS_OPTIONS = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "hidden",
  "archived",
] as const

export const REVIEW_VERIFICATION_OPTIONS = [
  "unverified",
  "verified_purchase",
  "manually_verified",
] as const

export const CHAT_STATUS_OPTIONS = [
  "open",
  "waiting_for_customer",
  "waiting_for_agent",
  "resolved",
  "closed",
  "escalated",
] as const

export type ReviewStatus = (typeof REVIEW_STATUS_OPTIONS)[number]
export type ReviewVerificationStatus =
  (typeof REVIEW_VERIFICATION_OPTIONS)[number]
export type ChatStatus = (typeof CHAT_STATUS_OPTIONS)[number]

export type ReviewRecord = {
  id: string
  shopify_product_id: string
  shopify_product_handle?: string | null
  storefront_origin?: string | null
  customer_name: string
  customer_email?: string | null
  rating: number
  title: string
  content: string
  status: ReviewStatus
  verification_status: ReviewVerificationStatus
  source: string
  published_at?: string | null
  approved_at?: string | null
  approved_by?: string | null
  rejected_at?: string | null
  rejected_by?: string | null
  hidden_at?: string | null
  hidden_by?: string | null
  archived_at?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export type ReviewRevisionRecord = {
  id: string
  review_id: string
  rating: number
  title: string
  content: string
  actor_id?: string | null
  actor_type: string
  reason?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
}

export type ReviewModerationActionRecord = {
  id: string
  review_id: string
  action: string
  actor_id?: string | null
  actor_type: string
  from_status?: ReviewStatus | null
  to_status?: ReviewStatus | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
}

export type ReviewListResponse = {
  reviews: ReviewRecord[]
  count: number
  page: number
  limit: number
}

export type ReviewDetailResponse = {
  review: ReviewRecord
  revisions: ReviewRevisionRecord[]
  moderation_actions: ReviewModerationActionRecord[]
}

export type ChatSessionRecord = {
  id: string
  storefront_origin?: string | null
  page_url?: string | null
  page_title?: string | null
  customer_name?: string | null
  customer_email?: string | null
  shopify_customer_id?: string | null
  shopify_customer_email?: string | null
  visitor_id?: string | null
  status: ChatStatus
  source: string
  assigned_agent_id?: string | null
  assigned_agent_name?: string | null
  first_response_at?: string | null
  last_message_at?: string | null
  resolved_at?: string | null
  closed_at?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export type ChatMessageRecord = {
  id: string
  session_id: string
  sender_type: string
  message_type: string
  content: string
  agent_id?: string | null
  agent_name?: string | null
  is_internal: boolean
  has_attachments: boolean
  metadata?: Record<string, unknown> | null
  created_at?: string
}

export type ChatEscalationRecord = {
  id: string
  session_id: string
  status: string
  reason?: string | null
  requested_by_id?: string | null
  requested_by_type: string
  resolved_by_id?: string | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
}

export type ChatSessionListResponse = {
  sessions: ChatSessionRecord[]
  count: number
  page: number
  limit: number
}

export type ChatSessionDetailResponse = {
  session: ChatSessionRecord
  messages: ChatMessageRecord[]
  escalations: ChatEscalationRecord[]
}

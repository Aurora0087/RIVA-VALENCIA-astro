import { MedusaService } from "@medusajs/framework/utils"

import ChatEscalation from "./models/chat-escalation"
import ChatMessage from "./models/chat-message"
import ChatSession from "./models/chat-session"
import type {
  ChatMessageType,
  ChatSenderType,
  ChatSessionStatus,
} from "./types"

type Metadata = Record<string, unknown> | null | undefined

type CreateChatSessionInput = {
  storefront_origin?: string | null
  page_url?: string | null
  page_title?: string | null
  customer_name?: string | null
  customer_email?: string | null
  shopify_customer_id?: string | null
  shopify_customer_email?: string | null
  visitor_id?: string | null
  metadata?: Metadata
  message?: string | null
}

type CreateChatMessageInput = {
  content: string
  sender_type: ChatSenderType
  message_type?: ChatMessageType
  agent_id?: string | null
  agent_name?: string | null
  is_internal?: boolean
  metadata?: Metadata
}

type ChatSessionListFilters = {
  status?: ChatSessionStatus
  customer_email?: string
  assigned_agent_id?: string
}

type ChatSessionListOptions = {
  page?: number
  limit?: number
}

type UpdateChatSessionInput = {
  status?: ChatSessionStatus
  assigned_agent_id?: string | null
  assigned_agent_name?: string | null
  metadata?: Metadata
  escalation_reason?: string | null
  escalation_note?: string | null
  actor_id?: string | null
}

class LiveChatModuleService extends MedusaService({
  ChatSession,
  ChatMessage,
  ChatEscalation,
}) {
  private unwrapOne<T>(value: T | T[]): T {
    return Array.isArray(value) ? value[0] : value
  }

  private timeValue(value: Date | string | null | undefined): number {
    if (!value) {
      return 0
    }

    return new Date(value).getTime()
  }

  private sortNewestFirst<T extends { created_at?: Date | string | null }>(
    items: T[]
  ): T[] {
    return [...items].sort(
      (left, right) =>
        this.timeValue(right.created_at) - this.timeValue(left.created_at)
    )
  }

  private sortOldestFirst<T extends { created_at?: Date | string | null }>(
    items: T[]
  ): T[] {
    return [...items].sort(
      (left, right) =>
        this.timeValue(left.created_at) - this.timeValue(right.created_at)
    )
  }

  private buildSessionFilters(filters: ChatSessionListFilters = {}) {
    const query: Record<string, unknown> = {}

    if (filters.status) {
      query.status = filters.status
    }

    if (filters.customer_email) {
      query.customer_email = filters.customer_email
    }

    if (filters.assigned_agent_id) {
      query.assigned_agent_id = filters.assigned_agent_id
    }

    return query
  }

  private async recordEscalation(input: {
    session_id: string
    reason?: string | null
    notes?: string | null
    requested_by_id?: string | null
    requested_by_type?: ChatSenderType
    metadata?: Metadata
  }) {
    return this.unwrapOne(
      await this.createChatEscalations({
        session_id: input.session_id,
        status: "open",
        reason: input.reason ?? null,
        notes: input.notes ?? null,
        requested_by_id: input.requested_by_id ?? null,
        requested_by_type: input.requested_by_type ?? "system",
        metadata: input.metadata ?? null,
      } as any)
    )
  }

  async createSessionWithInitialMessage(input: CreateChatSessionInput) {
    const now = new Date()
    const status = input.message ? "waiting_for_agent" : "open"

    const session = this.unwrapOne(
      await this.createChatSessions({
        storefront_origin: input.storefront_origin ?? null,
        page_url: input.page_url ?? null,
        page_title: input.page_title ?? null,
        customer_name: input.customer_name ?? null,
        customer_email: input.customer_email ?? null,
        shopify_customer_id: input.shopify_customer_id ?? null,
        shopify_customer_email: input.shopify_customer_email ?? null,
        visitor_id: input.visitor_id ?? null,
        status,
        source: "storefront",
        last_message_at: input.message ? now : null,
        metadata: input.metadata ?? null,
      } as any)
    )

    if (input.message) {
      await this.createChatMessages({
        session_id: session.id,
        sender_type: "customer",
        message_type: "message",
        content: input.message,
        is_internal: false,
        has_attachments: false,
        metadata: null,
      } as any)
    }

    return this.getSessionDetail(session.id, {
      include_internal: false,
    })
  }

  async listAdminSessions(
    filters: ChatSessionListFilters = {},
    options: ChatSessionListOptions = {}
  ) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 25))

    const [sessions, count] = await this.listAndCountChatSessions(
      this.buildSessionFilters(filters) as any,
      {
        order: { updated_at: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
      } as any
    )

    return {
      sessions,
      count,
      page,
      limit,
    }
  }

  async getSessionDetail(
    sessionId: string,
    options: { include_internal?: boolean } = {}
  ) {
    const session = await this.retrieveChatSession(sessionId)
    const [messages, escalations] = await Promise.all([
      this.listChatMessages(
        {
          session_id: sessionId,
        } as any,
        {
          order: { created_at: "ASC" },
        } as any
      ),
      this.listChatEscalations(
        {
          session_id: sessionId,
        } as any,
        {
          order: { created_at: "DESC" },
        } as any
      ),
    ])

    const sessionMessages = options.include_internal
      ? messages
      : messages.filter((message) => !message.is_internal)

    return {
      session,
      messages: this.sortOldestFirst(sessionMessages),
      escalations: this.sortNewestFirst(escalations),
    }
  }

  async addSessionMessage(
    sessionId: string,
    input: CreateChatMessageInput
  ) {
    const session = await this.retrieveChatSession(sessionId)
    const now = new Date()

    const message = this.unwrapOne(
      await this.createChatMessages({
        session_id: sessionId,
        sender_type: input.sender_type,
        message_type: input.message_type ?? "message",
        content: input.content,
        agent_id: input.agent_id ?? null,
        agent_name: input.agent_name ?? null,
        is_internal: input.is_internal ?? false,
        has_attachments: false,
        metadata: input.metadata ?? null,
      } as any)
    )

    const updatePayload: Record<string, unknown> = {
      id: sessionId,
      last_message_at: now,
    }

    if (input.metadata !== undefined) {
      updatePayload.metadata = input.metadata
    }

    if (!input.is_internal) {
      if (input.sender_type === "customer") {
        updatePayload.status = "waiting_for_agent"
      } else if (input.sender_type === "agent" || input.sender_type === "ai") {
        updatePayload.status = "waiting_for_customer"
        if (!session.first_response_at) {
          updatePayload.first_response_at = now
        }
      }
    }

    await this.updateChatSessions(updatePayload as any)

    return message
  }

  async updateSession(sessionId: string, input: UpdateChatSessionInput) {
    const session = await this.retrieveChatSession(sessionId)
    const updatePayload: Record<string, unknown> = {
      id: sessionId,
    }

    if (input.status) {
      updatePayload.status = input.status

      if (input.status === "resolved") {
        updatePayload.resolved_at = new Date()
      }

      if (input.status === "closed") {
        updatePayload.closed_at = new Date()
      }
    }

    if (input.assigned_agent_id !== undefined) {
      updatePayload.assigned_agent_id = input.assigned_agent_id
    }

    if (input.assigned_agent_name !== undefined) {
      updatePayload.assigned_agent_name = input.assigned_agent_name
    }

    if (input.metadata !== undefined) {
      updatePayload.metadata = input.metadata
    }

    const updated = this.unwrapOne(
      await this.updateChatSessions(updatePayload as any)
    )

    if (input.status === "escalated") {
      await this.recordEscalation({
        session_id: sessionId,
        reason: input.escalation_reason ?? "Manual escalation requested",
        notes: input.escalation_note ?? null,
        requested_by_id: input.actor_id ?? null,
        requested_by_type: "agent",
        metadata: input.metadata,
      })
    } else if (
      input.status === "resolved" &&
      session.status === "escalated"
    ) {
      const escalations = await this.listChatEscalations(
        {
          session_id: sessionId,
          status: "open",
        } as any,
        {
          order: { created_at: "DESC" },
        } as any
      )

      if (escalations.length) {
        await this.updateChatEscalations(
          escalations.map((escalation) => ({
            id: escalation.id,
            status: "resolved",
            resolved_by_id: input.actor_id ?? null,
            notes: input.escalation_note ?? escalation.notes ?? null,
          })) as any
        )
      }
    }

    return updated
  }
}

export default LiveChatModuleService

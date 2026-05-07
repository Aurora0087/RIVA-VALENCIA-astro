import { z } from "zod"

import {
  CHAT_MESSAGE_TYPES,
  CHAT_SENDER_TYPES,
  CHAT_SESSION_STATUSES,
} from "../../modules/live-chat/types"

export const StoreCreateChatSessionSchema = z.object({
  storefront_origin: z.string().trim().nullish(),
  page_url: z.string().trim().nullish(),
  page_title: z.string().trim().nullish(),
  customer_name: z.string().trim().max(255).nullish(),
  customer_email: z.string().trim().email().max(255).nullish(),
  shopify_customer_id: z.string().trim().max(255).nullish(),
  shopify_customer_email: z.string().trim().email().max(255).nullish(),
  visitor_id: z.string().trim().max(255).nullish(),
  message: z.string().trim().min(1).max(5000).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export const StoreAddChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const AdminUpdateChatSessionSchema = z
  .object({
    status: z.enum(CHAT_SESSION_STATUSES).optional(),
    assigned_agent_id: z.string().trim().max(255).nullable().optional(),
    assigned_agent_name: z.string().trim().max(255).nullable().optional(),
    escalation_reason: z.string().trim().max(4000).optional(),
    escalation_note: z.string().trim().max(4000).optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine(
    (input) =>
      input.status !== undefined ||
      input.assigned_agent_id !== undefined ||
      input.assigned_agent_name !== undefined ||
      input.escalation_reason !== undefined ||
      input.escalation_note !== undefined ||
      input.metadata !== undefined,
    {
      message: "Provide at least one field to update.",
    }
  )

export const AdminAddChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  sender_type: z.enum(CHAT_SENDER_TYPES).optional(),
  message_type: z.enum(CHAT_MESSAGE_TYPES).optional(),
  is_internal: z.boolean().optional(),
  agent_id: z.string().trim().max(255).optional(),
  agent_name: z.string().trim().max(255).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

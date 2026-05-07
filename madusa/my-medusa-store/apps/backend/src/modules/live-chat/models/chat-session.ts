import { model } from "@medusajs/framework/utils"

import { CHAT_SESSION_STATUSES, CHAT_SOURCES } from "../types"

const ChatSession = model.define("chat_session", {
  id: model.id().primaryKey(),
  storefront_origin: model.text().nullable(),
  page_url: model.text().nullable(),
  page_title: model.text().nullable(),
  customer_name: model.text().nullable(),
  customer_email: model.text().nullable(),
  shopify_customer_id: model.text().nullable(),
  shopify_customer_email: model.text().nullable(),
  visitor_id: model.text().nullable(),
  status: model.enum([...CHAT_SESSION_STATUSES]).default("open"),
  source: model.enum([...CHAT_SOURCES]).default("storefront"),
  assigned_agent_id: model.text().nullable(),
  assigned_agent_name: model.text().nullable(),
  first_response_at: model.dateTime().nullable(),
  last_message_at: model.dateTime().nullable(),
  resolved_at: model.dateTime().nullable(),
  closed_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})

export default ChatSession

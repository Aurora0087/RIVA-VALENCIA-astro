import { model } from "@medusajs/framework/utils"

import { CHAT_MESSAGE_TYPES, CHAT_SENDER_TYPES } from "../types"

const ChatMessage = model.define("chat_message", {
  id: model.id().primaryKey(),
  session_id: model.text(),
  sender_type: model.enum([...CHAT_SENDER_TYPES]),
  message_type: model.enum([...CHAT_MESSAGE_TYPES]).default("message"),
  content: model.text(),
  agent_id: model.text().nullable(),
  agent_name: model.text().nullable(),
  is_internal: model.boolean().default(false),
  has_attachments: model.boolean().default(false),
  metadata: model.json().nullable(),
})

export default ChatMessage

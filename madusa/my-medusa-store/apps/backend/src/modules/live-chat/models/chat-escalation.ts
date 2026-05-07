import { model } from "@medusajs/framework/utils"

import {
  CHAT_ESCALATION_STATUSES,
  CHAT_SENDER_TYPES,
} from "../types"

const ChatEscalation = model.define("chat_escalation", {
  id: model.id().primaryKey(),
  session_id: model.text(),
  status: model.enum([...CHAT_ESCALATION_STATUSES]).default("open"),
  reason: model.text().nullable(),
  requested_by_id: model.text().nullable(),
  requested_by_type: model.enum([...CHAT_SENDER_TYPES]).default("system"),
  resolved_by_id: model.text().nullable(),
  notes: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default ChatEscalation

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { StoreAddChatMessageSchema } from "../../../../../shared/chat-schemas"
import { LIVE_CHAT_MODULE } from "../../../../../../modules/live-chat"
import type LiveChatModuleService from "../../../../../../modules/live-chat/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(LIVE_CHAT_MODULE) as LiveChatModuleService
  const detail = await service.getSessionDetail(req.params.id, {
    include_internal: false,
  })

  res.json({
    session: detail.session,
    messages: detail.messages,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(LIVE_CHAT_MODULE) as LiveChatModuleService
  const payload = StoreAddChatMessageSchema.parse(req.body ?? {})

  const message = await service.addSessionMessage(req.params.id, {
    content: payload.content,
    sender_type: "customer",
    message_type: "message",
    is_internal: false,
    metadata: payload.metadata,
  })

  res.status(201).json({ message })
}

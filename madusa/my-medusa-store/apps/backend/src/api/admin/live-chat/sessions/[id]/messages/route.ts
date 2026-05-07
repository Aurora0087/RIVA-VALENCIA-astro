import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminAddChatMessageSchema } from "../../../../../shared/chat-schemas"
import { LIVE_CHAT_MODULE } from "../../../../../../modules/live-chat"
import type LiveChatModuleService from "../../../../../../modules/live-chat/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(LIVE_CHAT_MODULE) as LiveChatModuleService
  const payload = AdminAddChatMessageSchema.parse(req.body ?? {})
  const actorId = (req as any).auth_context?.actor_id ?? null

  const message = await service.addSessionMessage(req.params.id, {
    content: payload.content,
    sender_type: payload.sender_type ?? "agent",
    message_type: payload.message_type ?? "message",
    is_internal: payload.is_internal ?? false,
    agent_id: payload.agent_id ?? actorId,
    agent_name: payload.agent_name ?? null,
    metadata: payload.metadata,
  })

  res.status(201).json({ message })
}

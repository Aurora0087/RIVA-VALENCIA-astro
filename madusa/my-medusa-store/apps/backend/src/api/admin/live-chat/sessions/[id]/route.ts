import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminUpdateChatSessionSchema } from "../../../../shared/chat-schemas"
import { LIVE_CHAT_MODULE } from "../../../../../modules/live-chat"
import type LiveChatModuleService from "../../../../../modules/live-chat/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(LIVE_CHAT_MODULE) as LiveChatModuleService
  const detail = await service.getSessionDetail(req.params.id, {
    include_internal: true,
  })

  res.json(detail)
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(LIVE_CHAT_MODULE) as LiveChatModuleService
  const payload = AdminUpdateChatSessionSchema.parse(req.body ?? {})
  const actorId = (req as any).auth_context?.actor_id ?? null

  const session = await service.updateSession(req.params.id, {
    status: payload.status,
    assigned_agent_id: payload.assigned_agent_id ?? undefined,
    assigned_agent_name: payload.assigned_agent_name ?? undefined,
    metadata: payload.metadata,
    escalation_reason: payload.escalation_reason,
    escalation_note: payload.escalation_note,
    actor_id: actorId,
  })

  res.json({ session })
}

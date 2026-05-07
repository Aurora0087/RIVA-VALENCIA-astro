import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { pickNumber, pickString } from "../../../shared/request-utils"
import { LIVE_CHAT_MODULE } from "../../../../modules/live-chat"
import type LiveChatModuleService from "../../../../modules/live-chat/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(LIVE_CHAT_MODULE) as LiveChatModuleService
  const query = (req.query ?? {}) as Record<string, unknown>

  const result = await service.listAdminSessions(
    {
      status: pickString(query.status) as any,
      customer_email: pickString(query.customer_email),
      assigned_agent_id: pickString(query.assigned_agent_id),
    },
    {
      page: pickNumber(query.page, 1, { min: 1 }),
      limit: pickNumber(query.limit, 25, { min: 1, max: 100 }),
    }
  )

  res.json(result)
}

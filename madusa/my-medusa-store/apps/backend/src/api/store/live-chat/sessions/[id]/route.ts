import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { LIVE_CHAT_MODULE } from "../../../../../modules/live-chat"
import type LiveChatModuleService from "../../../../../modules/live-chat/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(LIVE_CHAT_MODULE) as LiveChatModuleService
  const detail = await service.getSessionDetail(req.params.id, {
    include_internal: false,
  })

  res.json(detail)
}

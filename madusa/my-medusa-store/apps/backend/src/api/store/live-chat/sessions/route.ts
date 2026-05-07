import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { StoreCreateChatSessionSchema } from "../../../shared/chat-schemas"
import { LIVE_CHAT_MODULE } from "../../../../modules/live-chat"
import type LiveChatModuleService from "../../../../modules/live-chat/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(LIVE_CHAT_MODULE) as LiveChatModuleService
  const payload = StoreCreateChatSessionSchema.parse(req.body ?? {})

  const session = await service.createSessionWithInitialMessage({
    storefront_origin: payload.storefront_origin ?? null,
    page_url: payload.page_url ?? null,
    page_title: payload.page_title ?? null,
    customer_name: payload.customer_name ?? null,
    customer_email: payload.customer_email ?? null,
    shopify_customer_id: payload.shopify_customer_id ?? null,
    shopify_customer_email: payload.shopify_customer_email ?? null,
    visitor_id: payload.visitor_id ?? null,
    metadata: payload.metadata,
    message: payload.message ?? null,
  })

  res.status(201).json(session)
}

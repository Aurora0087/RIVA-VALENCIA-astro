import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminReviewUpdateSchema } from "../../../shared/review-schemas"
import { REVIEWS_MODULE } from "../../../../modules/reviews"
import type ReviewsModuleService from "../../../../modules/reviews/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(REVIEWS_MODULE) as ReviewsModuleService
  const detail = await service.getReviewDetail(req.params.id)

  res.json(detail)
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(REVIEWS_MODULE) as ReviewsModuleService
  const payload = AdminReviewUpdateSchema.parse(req.body ?? {})
  const actorId = (req as any).auth_context?.actor_id ?? null

  const review = await service.updateReviewContent(req.params.id, {
    rating: payload.rating,
    title: payload.title,
    content: payload.content,
    status: payload.status,
    verification_status: payload.verification_status,
    actor_id: actorId,
    actor_type: "admin",
    reason: payload.reason,
    notes: payload.notes,
    metadata: payload.metadata,
  })

  res.json({ review })
}

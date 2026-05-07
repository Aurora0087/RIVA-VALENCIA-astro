import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminReviewModerationSchema } from "../../../../shared/review-schemas"
import { REVIEWS_MODULE } from "../../../../../modules/reviews"
import type ReviewsModuleService from "../../../../../modules/reviews/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(REVIEWS_MODULE) as ReviewsModuleService
  const payload = AdminReviewModerationSchema.parse(req.body ?? {})
  const actorId = (req as any).auth_context?.actor_id ?? null

  const review = await service.moderateReview(req.params.id, {
    action: payload.action,
    target_status: payload.target_status,
    verification_status: payload.verification_status,
    actor_id: actorId,
    notes: payload.notes,
    metadata: payload.metadata,
  })

  res.json({ review })
}

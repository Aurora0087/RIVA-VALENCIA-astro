import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { pickNumber, pickString } from "../../shared/request-utils"
import { REVIEWS_MODULE } from "../../../modules/reviews"
import type ReviewsModuleService from "../../../modules/reviews/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(REVIEWS_MODULE) as ReviewsModuleService
  const query = (req.query ?? {}) as Record<string, unknown>

  const result = await service.listAdminReviews(
    {
      status: pickString(query.status) as any,
      shopify_product_id: pickString(query.product_id),
      shopify_product_handle: pickString(query.product_handle),
      customer_email: pickString(query.customer_email),
    },
    {
      page: pickNumber(query.page, 1, { min: 1 }),
      limit: pickNumber(query.limit, 25, { min: 1, max: 100 }),
    }
  )

  res.json(result)
}

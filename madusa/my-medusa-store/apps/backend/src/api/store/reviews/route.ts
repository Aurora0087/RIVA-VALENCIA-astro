import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { pickNumber, pickString } from "../../shared/request-utils"
import { StoreReviewCreateSchema } from "../../shared/review-schemas"
import { REVIEWS_MODULE } from "../../../modules/reviews"
import type ReviewsModuleService from "../../../modules/reviews/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(REVIEWS_MODULE) as ReviewsModuleService
  const query = (req.query ?? {}) as Record<string, unknown>

  const result = await service.listStorefrontReviews(
    {
      shopify_product_id: pickString(query.product_id),
      shopify_product_handle: pickString(query.product_handle),
    },
    {
      page: pickNumber(query.page, 1, { min: 1 }),
      limit: pickNumber(query.limit, 20, { min: 1, max: 100 }),
    }
  )

  res.json(result)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(REVIEWS_MODULE) as ReviewsModuleService
  const payload = StoreReviewCreateSchema.parse(req.body ?? {})

  const review = await service.submitReview({
    shopify_product_id: payload.product_id,
    shopify_product_handle: payload.product_handle ?? null,
    storefront_origin: payload.storefront_origin ?? null,
    customer_name: payload.customer_name,
    customer_email: payload.customer_email ?? null,
    rating: payload.rating,
    title: payload.title,
    content: payload.content,
    metadata: payload.metadata,
  })

  res.status(201).json({
    review,
    message: "Review submitted and awaiting moderation.",
  })
}

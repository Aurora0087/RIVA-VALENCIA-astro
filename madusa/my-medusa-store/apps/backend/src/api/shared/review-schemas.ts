import { z } from "zod"

import {
  REVIEW_ADMIN_MODERATION_ACTIONS,
  REVIEW_STATUSES,
  REVIEW_VERIFICATION_STATUSES,
} from "../../modules/reviews/types"

export const StoreReviewCreateSchema = z.object({
  product_id: z.string().trim().min(1),
  product_handle: z.string().trim().optional(),
  storefront_origin: z.string().trim().optional(),
  customer_name: z.string().trim().min(1).max(255),
  customer_email: z.string().trim().email().max(255).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1).max(5000),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const AdminReviewUpdateSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    title: z.string().trim().min(1).max(255).optional(),
    content: z.string().trim().min(1).max(5000).optional(),
    status: z.enum(REVIEW_STATUSES).optional(),
    verification_status: z.enum(REVIEW_VERIFICATION_STATUSES).optional(),
    reason: z.string().trim().max(4000).optional(),
    notes: z.string().trim().max(4000).optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine(
    (input) =>
      input.rating !== undefined ||
      input.title !== undefined ||
      input.content !== undefined ||
      input.status !== undefined ||
      input.verification_status !== undefined ||
      input.reason !== undefined ||
      input.notes !== undefined ||
      input.metadata !== undefined,
    {
      message: "Provide at least one field to update.",
    }
  )

export const AdminReviewModerationSchema = z.object({
  action: z.enum(REVIEW_ADMIN_MODERATION_ACTIONS),
  target_status: z.enum(REVIEW_STATUSES).optional(),
  verification_status: z.enum(REVIEW_VERIFICATION_STATUSES).optional(),
  notes: z.string().trim().max(4000).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

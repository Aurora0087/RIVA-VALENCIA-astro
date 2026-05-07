import { MedusaService } from "@medusajs/framework/utils"

import ReviewModerationAction from "./models/review-moderation-action"
import ReviewRevision from "./models/review-revision"
import Review from "./models/review"
import type {
  ReviewActorType,
  ReviewAdminModerationAction,
  ReviewModerationAction as ReviewModerationActionType,
  ReviewStatus,
  ReviewVerificationStatus,
} from "./types"

type Metadata = Record<string, unknown> | null | undefined

type SubmitReviewInput = {
  shopify_product_id: string
  shopify_product_handle?: string | null
  storefront_origin?: string | null
  customer_name: string
  customer_email?: string | null
  rating: number
  title: string
  content: string
  metadata?: Metadata
}

type ReviewListFilters = {
  status?: ReviewStatus
  shopify_product_id?: string
  shopify_product_handle?: string
  customer_email?: string
}

type ReviewListOptions = {
  page?: number
  limit?: number
}

type UpdateReviewInput = {
  rating?: number
  title?: string
  content?: string
  status?: ReviewStatus
  verification_status?: ReviewVerificationStatus
  actor_id?: string | null
  actor_type?: ReviewActorType
  reason?: string | null
  notes?: string | null
  metadata?: Metadata
}

type ModerateReviewInput = {
  action: ReviewAdminModerationAction
  target_status?: ReviewStatus
  verification_status?: ReviewVerificationStatus
  actor_id?: string | null
  notes?: string | null
  metadata?: Metadata
}

type ReviewRecord = {
  id: string
  rating: number
  title: string
  content: string
  status: ReviewStatus
  verification_status: ReviewVerificationStatus
}

class ReviewsModuleService extends MedusaService({
  Review,
  ReviewRevision,
  ReviewModerationAction,
}) {
  private unwrapOne<T>(value: T | T[]): T {
    return Array.isArray(value) ? value[0] : value
  }

  private timeValue(value: Date | string | null | undefined): number {
    if (!value) {
      return 0
    }

    return new Date(value).getTime()
  }

  private sortNewestFirst<T extends { created_at?: Date | string | null }>(
    items: T[]
  ): T[] {
    return [...items].sort(
      (left, right) =>
        this.timeValue(right.created_at) - this.timeValue(left.created_at)
    )
  }

  private buildReviewFilters(filters: ReviewListFilters = {}) {
    const query: Record<string, unknown> = {}

    if (filters.status) {
      query.status = filters.status
    }

    if (filters.shopify_product_id) {
      query.shopify_product_id = filters.shopify_product_id
    }

    if (filters.shopify_product_handle) {
      query.shopify_product_handle = filters.shopify_product_handle
    }

    if (filters.customer_email) {
      query.customer_email = filters.customer_email
    }

    return query
  }

  private buildModerationActionFromStatus(
    status: ReviewStatus
  ): ReviewModerationActionType {
    switch (status) {
      case "approved":
        return "approved"
      case "rejected":
        return "rejected"
      case "hidden":
        return "hidden"
      case "archived":
        return "archived"
      default:
        return "restored"
    }
  }

  private applyStatusTimestamps(
    payload: Record<string, unknown>,
    status: ReviewStatus,
    actorId?: string | null
  ) {
    const now = new Date()

    if (status === "approved") {
      payload.published_at = now
      payload.approved_at = now
      payload.approved_by = actorId ?? null
      payload.rejected_at = null
      payload.rejected_by = null
      payload.hidden_at = null
      payload.hidden_by = null
      payload.archived_at = null
      return
    }

    if (status === "rejected") {
      payload.published_at = null
      payload.rejected_at = now
      payload.rejected_by = actorId ?? null
      return
    }

    if (status === "hidden") {
      payload.published_at = null
      payload.hidden_at = now
      payload.hidden_by = actorId ?? null
      return
    }

    if (status === "archived") {
      payload.published_at = null
      payload.archived_at = now
      return
    }

    payload.published_at = null
  }

  private async recordModerationAction(input: {
    review_id: string
    action: ReviewModerationActionType
    actor_id?: string | null
    actor_type?: ReviewActorType
    from_status?: ReviewStatus | null
    to_status?: ReviewStatus | null
    notes?: string | null
    metadata?: Metadata
  }) {
    return this.unwrapOne(
      await this.createReviewModerationActions({
        review_id: input.review_id,
        action: input.action,
        actor_id: input.actor_id ?? null,
        actor_type: input.actor_type ?? "system",
        from_status: input.from_status ?? null,
        to_status: input.to_status ?? null,
        notes: input.notes ?? null,
        metadata: input.metadata ?? null,
      } as any)
    )
  }

  async submitReview(input: SubmitReviewInput) {
    const review = this.unwrapOne(
      await this.createReviews({
        shopify_product_id: input.shopify_product_id,
        shopify_product_handle: input.shopify_product_handle ?? null,
        storefront_origin: input.storefront_origin ?? null,
        customer_name: input.customer_name,
        customer_email: input.customer_email ?? null,
        rating: input.rating,
        title: input.title,
        content: input.content,
        status: "pending",
        verification_status: "unverified",
        source: "storefront",
        metadata: input.metadata ?? null,
      } as any)
    )

    await this.recordModerationAction({
      review_id: review.id,
      action: "submitted",
      actor_type: "customer",
      to_status: "pending",
      metadata: input.metadata,
    })

    return review
  }

  async listStorefrontReviews(
    filters: Omit<ReviewListFilters, "status" | "customer_email"> = {},
    options: ReviewListOptions = {}
  ) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 20))

    const [reviews, count] = await this.listAndCountReviews(
      this.buildReviewFilters({
        ...filters,
        status: "approved",
      }) as any,
      {
        order: { created_at: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
      } as any
    )

    const summary = await this.getReviewSummary(filters)

    return {
      reviews,
      count,
      page,
      limit,
      summary,
    }
  }

  async listAdminReviews(
    filters: ReviewListFilters = {},
    options: ReviewListOptions = {}
  ) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 25))

    const [reviews, count] = await this.listAndCountReviews(
      this.buildReviewFilters(filters) as any,
      {
        order: { created_at: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
      } as any
    )

    return {
      reviews,
      count,
      page,
      limit,
    }
  }

  async getReviewSummary(
    filters: Omit<ReviewListFilters, "status" | "customer_email"> = {}
  ) {
    const reviews = await this.listReviews(
      this.buildReviewFilters({
        ...filters,
        status: "approved",
      }) as any,
      {
        order: { created_at: "DESC" },
      } as any
    )

    const ratingCounts: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    }

    let ratingTotal = 0

    for (const review of reviews) {
      const rating = String(review.rating ?? 0)
      if (ratingCounts[rating] !== undefined) {
        ratingCounts[rating] += 1
      }
      ratingTotal += Number(review.rating || 0)
    }

    return {
      total_reviews: reviews.length,
      average_rating: reviews.length
        ? Number((ratingTotal / reviews.length).toFixed(2))
        : 0,
      rating_counts: ratingCounts,
    }
  }

  async getReviewDetail(reviewId: string) {
    const review = await this.retrieveReview(reviewId)
    const [revisions, moderationActions] = await Promise.all([
      this.listReviewRevisions(
        {
          review_id: reviewId,
        } as any,
        {
          order: { created_at: "DESC" },
        } as any
      ),
      this.listReviewModerationActions(
        {
          review_id: reviewId,
        } as any,
        {
          order: { created_at: "DESC" },
        } as any
      ),
    ])

    return {
      review,
      revisions: this.sortNewestFirst(revisions),
      moderation_actions: this.sortNewestFirst(moderationActions),
    }
  }

  async updateReviewContent(reviewId: string, input: UpdateReviewInput) {
    const current = (await this.retrieveReview(reviewId)) as ReviewRecord
    const nextRating = input.rating ?? current.rating
    const nextTitle = input.title ?? current.title
    const nextContent = input.content ?? current.content
    const nextStatus = (input.status ?? current.status) as ReviewStatus
    const nextVerificationStatus =
      (input.verification_status ??
        current.verification_status) as ReviewVerificationStatus

    const hasReviewBodyChanges =
      nextRating !== current.rating ||
      nextTitle !== current.title ||
      nextContent !== current.content

    if (hasReviewBodyChanges) {
      await this.createReviewRevisions({
        review_id: reviewId,
        rating: current.rating,
        title: current.title,
        content: current.content,
        actor_id: input.actor_id ?? null,
        actor_type: input.actor_type ?? "admin",
        reason: input.reason ?? null,
        metadata: input.metadata ?? null,
      } as any)
    }

    const updatePayload: Record<string, unknown> = {
      id: reviewId,
      rating: nextRating,
      title: nextTitle,
      content: nextContent,
      verification_status: nextVerificationStatus,
    }

    if (input.metadata !== undefined) {
      updatePayload.metadata = input.metadata
    }

    if (nextStatus !== current.status) {
      updatePayload.status = nextStatus
      this.applyStatusTimestamps(updatePayload, nextStatus, input.actor_id)
    }

    const updated = this.unwrapOne(
      await this.updateReviews(updatePayload as any)
    )

    if (hasReviewBodyChanges) {
      await this.recordModerationAction({
        review_id: reviewId,
        action: "edited",
        actor_id: input.actor_id ?? null,
        actor_type: input.actor_type ?? "admin",
        from_status: current.status,
        to_status: nextStatus,
        notes: input.reason ?? null,
        metadata: input.metadata,
      })
    }

    if (nextStatus !== current.status) {
      await this.recordModerationAction({
        review_id: reviewId,
        action: this.buildModerationActionFromStatus(nextStatus),
        actor_id: input.actor_id ?? null,
        actor_type: input.actor_type ?? "admin",
        from_status: current.status,
        to_status: nextStatus,
        notes: input.notes ?? null,
        metadata: input.metadata,
      })
    }

    return updated
  }

  async moderateReview(reviewId: string, input: ModerateReviewInput) {
    const current = (await this.retrieveReview(reviewId)) as ReviewRecord
    const nextStatus = (
      input.action === "restored"
        ? input.target_status ?? "approved"
        : input.action
    ) as ReviewStatus
    const updatePayload: Record<string, unknown> = {
      id: reviewId,
      status: nextStatus,
      verification_status:
        input.verification_status ?? current.verification_status,
    }

    if (input.metadata !== undefined) {
      updatePayload.metadata = input.metadata
    }

    this.applyStatusTimestamps(updatePayload, nextStatus, input.actor_id)

    const updated = this.unwrapOne(
      await this.updateReviews(updatePayload as any)
    )

    await this.recordModerationAction({
      review_id: reviewId,
      action: input.action,
      actor_id: input.actor_id ?? null,
      actor_type: "admin",
      from_status: current.status,
      to_status: nextStatus,
      notes: input.notes ?? null,
      metadata: input.metadata,
    })

    return updated
  }
}

export default ReviewsModuleService

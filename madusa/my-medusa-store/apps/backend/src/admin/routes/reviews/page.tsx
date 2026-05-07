import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { adminFetch } from "../../lib/api"
import type {
  ReviewListResponse,
  ReviewRecord,
  ReviewStatus,
} from "../../lib/types"
import { REVIEW_STATUS_OPTIONS } from "../../lib/types"
import {
  ErrorState,
  formatDateTime,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../lib/ui"

export const config = defineRouteConfig({
  label: "Reviews",
  rank: 90,
})

const QUICK_ACTIONS: Record<
  ReviewStatus,
  Array<{ action: "approved" | "rejected" | "hidden" | "archived" | "restored"; label: string }>
> = {
  draft: [
    { action: "approved", label: "Approve" },
    { action: "rejected", label: "Reject" },
  ],
  pending: [
    { action: "approved", label: "Approve" },
    { action: "rejected", label: "Reject" },
  ],
  approved: [
    { action: "hidden", label: "Hide" },
    { action: "archived", label: "Archive" },
  ],
  rejected: [{ action: "restored", label: "Restore" }],
  hidden: [{ action: "restored", label: "Restore" }],
  archived: [{ action: "restored", label: "Restore" }],
}

export default function ReviewsPage() {
  const [data, setData] = useState<ReviewListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("")
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const loadReviews = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (status) {
        params.set("status", status)
      }

      const query = params.toString()
      const response = await adminFetch<ReviewListResponse>(
        `/admin/reviews${query ? `?${query}` : ""}`
      )

      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReviews()
  }, [status])

  const handleModeration = async (
    reviewId: string,
    action: "approved" | "rejected" | "hidden" | "archived" | "restored"
  ) => {
    const actionKey = `${reviewId}:${action}`
    setPendingAction(actionKey)
    setError(null)

    try {
      await adminFetch(`/admin/reviews/${reviewId}/moderate`, {
        method: "POST",
        body: JSON.stringify({ action }),
      })

      await loadReviews()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update review status."
      )
    } finally {
      setPendingAction(null)
    }
  }

  const reviews = data?.reviews ?? []
  const countsByStatus = reviews.reduce<Record<string, number>>((acc, review) => {
    acc[review.status] = (acc[review.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Reviews"
        description="Moderate, edit, and publish customer reviews from your Shopify headless storefront. Approved reviews are ready for storefront display, while pending reviews stay queued for staff review."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Loaded reviews" value={data?.count ?? 0} tone="accent" />
        <StatCard label="Pending" value={countsByStatus.pending ?? 0} />
        <StatCard label="Approved" value={countsByStatus.approved ?? 0} />
        <StatCard label="Hidden / Rejected" value={(countsByStatus.hidden ?? 0) + (countsByStatus.rejected ?? 0)} />
      </div>

      <SectionCard
        title="Moderation queue"
        description="Use the filters and quick actions below, or open a review to edit its content and audit history."
      >
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <label className="flex max-w-xs flex-col gap-2 text-sm font-medium text-slate-700">
            Filter by status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">All statuses</option>
              {REVIEW_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void loadReviews()}
            className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {error ? <ErrorState message={error} retry={() => void loadReviews()} /> : null}

        {loading ? (
          <LoadingState label="Loading reviews..." />
        ) : reviews.length === 0 ? (
          <LoadingState label="No reviews matched this filter yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    pendingAction={pendingAction}
                    onModerate={handleModeration}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function ReviewRow({
  review,
  pendingAction,
  onModerate,
}: {
  review: ReviewRecord
  pendingAction: string | null
  onModerate: (
    reviewId: string,
    action: "approved" | "rejected" | "hidden" | "archived" | "restored"
  ) => Promise<void>
}) {
  return (
    <tr className="align-top">
      <td className="px-4 py-4">
        <div className="font-medium text-slate-900">{review.customer_name}</div>
        <div className="mt-1 text-xs text-slate-500">
          {review.customer_email || "No email captured"}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="font-medium text-slate-900">
          {review.shopify_product_handle || review.shopify_product_id}
        </div>
        <div className="mt-1 line-clamp-2 text-xs text-slate-500">
          {review.title}
        </div>
      </td>
      <td className="px-4 py-4 font-medium text-slate-900">{review.rating}/5</td>
      <td className="px-4 py-4">
        <StatusBadge value={review.status} />
      </td>
      <td className="px-4 py-4 text-slate-600">
        {formatDateTime(review.created_at)}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/reviews/${review.id}`}
            className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Open
          </Link>
          {QUICK_ACTIONS[review.status].map((actionItem) => {
            const actionKey = `${review.id}:${actionItem.action}`
            const isBusy = pendingAction === actionKey

            return (
              <button
                key={actionItem.action}
                type="button"
                disabled={isBusy}
                onClick={() => void onModerate(review.id, actionItem.action)}
                className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? "Saving..." : actionItem.label}
              </button>
            )
          })}
        </div>
      </td>
    </tr>
  )
}

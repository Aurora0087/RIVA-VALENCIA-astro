import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { adminFetch } from "../../../lib/api"
import type {
  ReviewDetailResponse,
  ReviewModerationActionRecord,
  ReviewRevisionRecord,
  ReviewStatus,
  ReviewVerificationStatus,
} from "../../../lib/types"
import { REVIEW_VERIFICATION_OPTIONS } from "../../../lib/types"
import {
  ErrorState,
  formatCompactStatus,
  formatDateTime,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "../../../lib/ui"

const MODERATION_ACTIONS: Array<{
  action: "approved" | "rejected" | "hidden" | "archived" | "restored"
  label: string
}> = [
  { action: "approved", label: "Approve" },
  { action: "rejected", label: "Reject" },
  { action: "hidden", label: "Hide" },
  { action: "archived", label: "Archive" },
  { action: "restored", label: "Restore" },
]

export default function ReviewDetailPage() {
  const params = useParams<{ id: string }>()
  const reviewId = params.id

  const [data, setData] = useState<ReviewDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [rating, setRating] = useState("5")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [verificationStatus, setVerificationStatus] =
    useState<ReviewVerificationStatus>("unverified")
  const [saveReason, setSaveReason] = useState("")

  const loadDetail = async () => {
    if (!reviewId) {
      setError("Missing review id.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await adminFetch<ReviewDetailResponse>(
        `/admin/reviews/${reviewId}`
      )

      setData(response)
      setRating(String(response.review.rating))
      setTitle(response.review.title)
      setContent(response.review.content)
      setVerificationStatus(response.review.verification_status)
      setSaveReason("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDetail()
  }, [reviewId])

  const handleSave = async () => {
    if (!reviewId) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      await adminFetch<{ review: unknown }>(`/admin/reviews/${reviewId}`, {
        method: "PATCH",
        body: JSON.stringify({
          rating: Number(rating),
          title,
          content,
          verification_status: verificationStatus,
          reason: saveReason || null,
        }),
      })

      await loadDetail()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review.")
    } finally {
      setSaving(false)
    }
  }

  const handleModeration = async (
    action: "approved" | "rejected" | "hidden" | "archived" | "restored"
  ) => {
    if (!reviewId) {
      return
    }

    setActiveAction(action)
    setError(null)

    try {
      await adminFetch(`/admin/reviews/${reviewId}/moderate`, {
        method: "POST",
        body: JSON.stringify({ action }),
      })

      await loadDetail()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update review status."
      )
    } finally {
      setActiveAction(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState label="Loading review..." />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <ErrorState message={error} retry={() => void loadDetail()} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <ErrorState message="Review not found." />
      </div>
    )
  }

  const review = data.review

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Review detail"
        description="Edit review copy, verify customer trust signals, and keep a moderation audit trail for storefront reviews."
        action={
          <Link
            to="/reviews"
            className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to reviews
          </Link>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Review content"
            description="These fields control what is shown publicly when the review is approved."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Rating
                <select
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} stars
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Verification
                <select
                  value={verificationStatus}
                  onChange={(event) =>
                    setVerificationStatus(
                      event.target.value as ReviewVerificationStatus
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  {REVIEW_VERIFICATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatCompactStatus(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-700">
              Review title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </label>

            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-700">
              Review body
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={8}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </label>

            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-700">
              Edit reason
              <textarea
                value={saveReason}
                onChange={(event) => setSaveReason(event.target.value)}
                rows={3}
                placeholder="Optional note for the audit trail"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save review"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void loadDetail()}
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset changes
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Moderation history"
            description="Every status change is recorded here for transparency and support follow-up."
          >
            <div className="space-y-3">
              {data.moderation_actions.length === 0 ? (
                <p className="text-sm text-slate-500">No moderation actions yet.</p>
              ) : (
                data.moderation_actions.map((action) => (
                  <HistoryRow key={action.id} action={action} />
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Revision history"
            description="Previous versions are stored whenever the review content is edited by staff."
          >
            <div className="space-y-4">
              {data.revisions.length === 0 ? (
                <p className="text-sm text-slate-500">No saved revisions yet.</p>
              ) : (
                data.revisions.map((revision) => (
                  <RevisionRow key={revision.id} revision={revision} />
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard
            title="Review summary"
            description="Use the quick actions below to move the review through your moderation workflow."
          >
            <dl className="grid gap-4 text-sm text-slate-700">
              <SummaryItem label="Status">
                <StatusBadge value={review.status} />
              </SummaryItem>
              <SummaryItem label="Product handle">
                {review.shopify_product_handle || review.shopify_product_id}
              </SummaryItem>
              <SummaryItem label="Customer">
                <div>
                  <div className="font-medium text-slate-900">
                    {review.customer_name}
                  </div>
                  <div className="text-slate-500">
                    {review.customer_email || "No email captured"}
                  </div>
                </div>
              </SummaryItem>
              <SummaryItem label="Created">
                {formatDateTime(review.created_at)}
              </SummaryItem>
              <SummaryItem label="Last updated">
                {formatDateTime(review.updated_at)}
              </SummaryItem>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              {MODERATION_ACTIONS.map((item) => (
                <button
                  key={item.action}
                  type="button"
                  disabled={activeAction === item.action}
                  onClick={() => void handleModeration(item.action)}
                  className="inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {activeAction === item.action ? "Saving..." : item.label}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Metadata"
            description="Extra storefront or import context stored with this review."
          >
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(review.metadata ?? {}, null, 2)}
            </pre>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function SummaryItem({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

function HistoryRow({
  action,
}: {
  action: ReviewModerationActionRecord
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={action.action} />
        <span className="text-xs text-slate-500">
          {formatDateTime(action.created_at)}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">
        Actor: {action.actor_type}
        {action.actor_id ? ` (${action.actor_id})` : ""}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        From {action.from_status ?? "n/a"} to {action.to_status ?? "n/a"}
      </p>
      {action.notes ? (
        <p className="mt-2 text-sm text-slate-600">{action.notes}</p>
      ) : null}
    </div>
  )
}

function RevisionRow({
  revision,
}: {
  revision: ReviewRevisionRecord
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
          {revision.rating}/5
        </span>
        <span className="text-xs text-slate-500">
          {formatDateTime(revision.created_at)}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">
        {revision.title}
      </h3>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
        {revision.content}
      </p>
      {revision.reason ? (
        <p className="mt-3 text-xs text-slate-500">Reason: {revision.reason}</p>
      ) : null}
    </div>
  )
}

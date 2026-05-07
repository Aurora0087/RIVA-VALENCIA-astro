import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { adminFetch } from "../../lib/api"
import { CHAT_STATUS_OPTIONS, type ChatSessionListResponse } from "../../lib/types"
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
  label: "Live Chat",
  rank: 91,
})

export default function LiveChatPage() {
  const [data, setData] = useState<ChatSessionListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("")

  const loadSessions = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (status) {
        params.set("status", status)
      }

      const query = params.toString()
      const response = await adminFetch<ChatSessionListResponse>(
        `/admin/live-chat/sessions${query ? `?${query}` : ""}`
      )

      setData(response)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load live chat sessions."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSessions()
  }, [status])

  const sessions = data?.sessions ?? []
  const openCount = sessions.filter((session) =>
    ["open", "waiting_for_agent", "waiting_for_customer"].includes(
      session.status
    )
  ).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Live Chat"
        description="Track storefront conversations, keep support context in one place, and respond to customers without leaving the Medusa dashboard."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Loaded sessions" value={data?.count ?? 0} tone="accent" />
        <StatCard label="Open queue" value={openCount} />
        <StatCard
          label="Escalated"
          value={sessions.filter((session) => session.status === "escalated").length}
        />
        <StatCard
          label="Resolved"
          value={sessions.filter((session) => session.status === "resolved").length}
        />
      </div>

      <SectionCard
        title="Conversation list"
        description="Open a session to reply, add internal notes, assign an owner, or mark the conversation resolved."
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
              {CHAT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void loadSessions()}
            className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {error ? <ErrorState message={error} retry={() => void loadSessions()} /> : null}

        {loading ? (
          <LoadingState label="Loading chat sessions..." />
        ) : sessions.length === 0 ? (
          <LoadingState label="No chat sessions matched this filter yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Context</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                  <th className="px-4 py-3 font-medium">Last activity</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {sessions.map((session) => (
                  <tr key={session.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">
                        {session.customer_name || "Anonymous visitor"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {session.customer_email || session.shopify_customer_email || "No email captured"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">
                        {session.page_title || "Storefront chat"}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {session.page_url || session.storefront_origin || "No page context captured"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={session.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {session.assigned_agent_name || "Unassigned"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDateTime(
                        session.last_message_at || session.updated_at || session.created_at
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/live-chat/${session.id}`}
                        className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

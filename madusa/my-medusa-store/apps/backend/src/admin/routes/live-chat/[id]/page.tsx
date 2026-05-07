import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { adminFetch } from "../../../lib/api"
import {
  CHAT_STATUS_OPTIONS,
  type ChatSessionDetailResponse,
  type ChatStatus,
} from "../../../lib/types"
import {
  ErrorState,
  formatCompactStatus,
  formatDateTime,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "../../../lib/ui"

export default function LiveChatDetailPage() {
  const params = useParams<{ id: string }>()
  const sessionId = params.id

  const [data, setData] = useState<ChatSessionDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingSession, setSavingSession] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [assignedAgentName, setAssignedAgentName] = useState("")
  const [status, setStatus] = useState<ChatStatus>("open")
  const [reply, setReply] = useState("")
  const [internalNote, setInternalNote] = useState(false)
  const [escalationReason, setEscalationReason] = useState("")
  const [escalationNote, setEscalationNote] = useState("")

  const loadSession = async () => {
    if (!sessionId) {
      setError("Missing session id.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await adminFetch<ChatSessionDetailResponse>(
        `/admin/live-chat/sessions/${sessionId}`
      )

      setData(response)
      setAssignedAgentName(response.session.assigned_agent_name || "")
      setStatus(response.session.status)
      setEscalationReason("")
      setEscalationNote("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat session.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSession()
  }, [sessionId])

  const handleSaveSession = async () => {
    if (!sessionId) {
      return
    }

    setSavingSession(true)
    setError(null)

    try {
      await adminFetch(`/admin/live-chat/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          assigned_agent_name: assignedAgentName || null,
          escalation_reason: escalationReason || null,
          escalation_note: escalationNote || null,
        }),
      })

      await loadSession()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update the chat session."
      )
    } finally {
      setSavingSession(false)
    }
  }

  const handleSendMessage = async () => {
    if (!sessionId || !reply.trim()) {
      return
    }

    setSendingMessage(true)
    setError(null)

    try {
      await adminFetch(`/admin/live-chat/sessions/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: reply.trim(),
          agent_name: assignedAgentName || "Support team",
          is_internal: internalNote,
        }),
      })

      setReply("")
      setInternalNote(false)
      await loadSession()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send the message."
      )
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState label="Loading chat session..." />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <ErrorState message={error} retry={() => void loadSession()} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <ErrorState message="Chat session not found." />
      </div>
    )
  }

  const { session, messages, escalations } = data

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Chat session"
        description="Reply to the customer, keep internal notes, and manage assignment or escalation from one workspace."
        action={
          <Link
            to="/live-chat"
            className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to live chat
          </Link>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Conversation"
            description="Customer messages and staff replies are shown below in chronological order."
          >
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages in this session yet.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-xl border p-4 ${
                      message.is_internal
                        ? "border-amber-200 bg-amber-50"
                        : message.sender_type === "customer"
                          ? "border-slate-200 bg-white"
                          : "border-slate-900 bg-slate-900 text-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold">
                        {message.is_internal
                          ? "Internal note"
                          : formatCompactStatus(message.sender_type)}
                      </span>
                      <span
                        className={
                          message.sender_type === "agent" && !message.is_internal
                            ? "text-slate-300"
                            : "text-slate-500"
                        }
                      >
                        {formatDateTime(message.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                      {message.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Reply"
            description="Send a customer-facing response or save an internal note for your support team."
          >
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={internalNote}
                onChange={(event) => setInternalNote(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Save as internal note
            </label>

            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              rows={6}
              placeholder={
                internalNote
                  ? "Add a private note for the support team"
                  : "Write your reply to the customer"
              }
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={sendingMessage || !reply.trim()}
                onClick={() => void handleSendMessage()}
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingMessage
                  ? "Sending..."
                  : internalNote
                    ? "Save note"
                    : "Send reply"}
              </button>
              <button
                type="button"
                disabled={sendingMessage}
                onClick={() => {
                  setReply("")
                  setInternalNote(false)
                }}
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear
              </button>
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard
            title="Session summary"
            description="Update ownership, conversation status, or add escalation context for later support follow-up."
          >
            <div className="grid gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Current status
                </p>
                <div className="mt-2">
                  <StatusBadge value={session.status} />
                </div>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Assigned agent name
                <input
                  value={assignedAgentName}
                  onChange={(event) => setAssignedAgentName(event.target.value)}
                  placeholder="Support team member"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ChatStatus)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  {CHAT_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatCompactStatus(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Escalation reason
                <input
                  value={escalationReason}
                  onChange={(event) => setEscalationReason(event.target.value)}
                  placeholder="Optional escalation headline"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Escalation note
                <textarea
                  value={escalationNote}
                  onChange={(event) => setEscalationNote(event.target.value)}
                  rows={4}
                  placeholder="Optional internal context"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </label>

              <button
                type="button"
                disabled={savingSession}
                onClick={() => void handleSaveSession()}
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingSession ? "Saving..." : "Save session"}
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Customer context"
            description="Storefront and customer details captured when the chat was created."
          >
            <dl className="grid gap-4 text-sm text-slate-700">
              <ContextItem label="Customer">
                {session.customer_name || "Anonymous visitor"}
              </ContextItem>
              <ContextItem label="Email">
                {session.customer_email || session.shopify_customer_email || "No email captured"}
              </ContextItem>
              <ContextItem label="Page title">
                {session.page_title || "Storefront chat"}
              </ContextItem>
              <ContextItem label="Page URL">
                {session.page_url || "No page context captured"}
              </ContextItem>
              <ContextItem label="Started">
                {formatDateTime(session.created_at)}
              </ContextItem>
              <ContextItem label="Last message">
                {formatDateTime(session.last_message_at || session.updated_at)}
              </ContextItem>
            </dl>
          </SectionCard>

          <SectionCard
            title="Escalation history"
            description="Every escalation entry is preserved so support handoffs stay clear."
          >
            <div className="space-y-3">
              {escalations.length === 0 ? (
                <p className="text-sm text-slate-500">No escalations recorded yet.</p>
              ) : (
                escalations.map((escalation) => (
                  <div
                    key={escalation.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={escalation.status} />
                      <span className="text-xs text-slate-500">
                        {formatDateTime(escalation.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {escalation.reason || "No reason provided"}
                    </p>
                    {escalation.notes ? (
                      <p className="mt-2 text-sm text-slate-500">
                        {escalation.notes}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function ContextItem({
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

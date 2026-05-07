import type { PropsWithChildren, ReactNode } from "react"

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not available"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function formatCompactStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getStatusClasses(value: string) {
  switch (value) {
    case "approved":
    case "resolved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200"
    case "pending":
    case "waiting_for_agent":
    case "escalated":
      return "bg-amber-50 text-amber-700 ring-amber-200"
    case "rejected":
    case "hidden":
    case "archived":
    case "closed":
      return "bg-rose-50 text-rose-700 ring-rose-200"
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200"
  }
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
        value
      )}`}
    >
      {formatCompactStatus(value)}
    </span>
  )
}

export function SectionCard({
  title,
  description,
  children,
}: PropsWithChildren<{
  title: string
  description?: string
}>) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: ReactNode
  tone?: "default" | "accent"
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        tone === "accent"
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-[0.2em] ${
          tone === "accent" ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
      {label}
    </div>
  )
}

export function ErrorState({
  message,
  retry,
}: {
  message: string
  retry?: () => void
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
      <p>{message}</p>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="mt-3 inline-flex rounded-md border border-rose-300 px-3 py-2 font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}

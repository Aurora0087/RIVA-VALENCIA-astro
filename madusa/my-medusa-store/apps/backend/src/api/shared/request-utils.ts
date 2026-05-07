export function pickString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    const trimmed = value[0].trim()
    return trimmed ? trimmed : undefined
  }

  return undefined
}

export function pickNumber(
  value: unknown,
  fallback: number,
  limits: { min?: number; max?: number } = {}
) {
  const parsed = Number(pickString(value) ?? fallback)
  const min = limits.min ?? Number.NEGATIVE_INFINITY
  const max = limits.max ?? Number.POSITIVE_INFINITY

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(max, Math.max(min, parsed))
}

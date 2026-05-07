export async function adminFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers ?? {})

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    try {
      const data = (await response.json()) as Record<string, unknown>
      const detail =
        typeof data.message === "string"
          ? data.message
          : typeof data.error === "string"
            ? data.error
            : null

      if (detail) {
        message = detail
      }
    } catch {
      // Ignore invalid JSON errors and keep the default message.
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

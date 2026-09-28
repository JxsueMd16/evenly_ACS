import { API_BASE_URL, type NotificationCounts } from "./api"

export interface Notice {
  kind:
    | "friend-request"
    | "friend-accepted"
    | "group-added"
    | "expense-added"
    | "payment-reported"
    | "payment-confirmed"
    | "payment-rejected"
  message: string
  link?: string
}

interface Handlers {
  onCounts: (counts: NotificationCounts) => void
  onNotice: (notice: Notice) => void
  /** El servidor respondió 401: la sesión ya no es válida. */
  onUnauthorized: () => void
  /** true al abrir la conexión; false cuando se corta (antes de reintentar). */
  onConnectionChange: (connected: boolean) => void
}

/**
 * Se conecta a GET /notifications/stream (Server-Sent Events) y avisa de
 * cada evento. Usa fetch en lugar de EventSource para mandar el token en el
 * header Authorization y no en la URL. Si la conexión se cae, reintenta con
 * espera creciente (1 s, 2 s, 4 s… hasta 30 s). Devuelve una función para cerrarla.
 */
export function connectNotifications(token: string, handlers: Handlers): () => void {
  const controller = new AbortController()
  let attempt = 0
  let retryTimer: ReturnType<typeof setTimeout> | undefined

  function dispatch(rawEvent: string) {
    let event = "message"
    const dataLines: string[] = []
    for (const line of rawEvent.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim()
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim())
    }
    if (dataLines.length === 0) return // comentarios (": ping") y "retry:"
    try {
      const data = JSON.parse(dataLines.join("\n"))
      if (event === "counts") handlers.onCounts(data)
      else if (event === "notice") handlers.onNotice(data)
    } catch {
      // Evento mal formado: se ignora.
    }
  }

  async function run() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
        signal: controller.signal,
      })
      if (response.status === 401) return handlers.onUnauthorized()
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

      attempt = 0
      handlers.onConnectionChange(true)
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ""
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += value.replace(/\r\n/g, "\n")
        let separator: number
        while ((separator = buffer.indexOf("\n\n")) !== -1) {
          dispatch(buffer.slice(0, separator))
          buffer = buffer.slice(separator + 2)
        }
      }
    } catch {
      if (controller.signal.aborted) return
    }
    if (controller.signal.aborted) return
    handlers.onConnectionChange(false)
    // Se cortó (servidor reiniciado, red caída…): reintentar.
    const delay = Math.min(30_000, 1000 * 2 ** attempt++)
    retryTimer = setTimeout(run, delay)
  }

  run()

  return () => {
    controller.abort()
    clearTimeout(retryTimer)
  }
}

/**
 * Comparte un enlace con el menú nativo del dispositivo (WhatsApp, Telegram,
 * correo…) cuando el navegador lo soporta; si no, lo copia al portapapeles.
 */
export async function shareLink(data: { title: string; text: string; url: string }): Promise<"shared" | "copied" | "cancelled"> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(data)
      return "shared"
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled"
      // Si el menú nativo falla por otra razón, se intenta copiar.
    }
  }
  await copyText(data.url)
  return "copied"
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    throw new Error("No se pudo copiar. Selecciona el enlace y cópialo manualmente.")
  }
}

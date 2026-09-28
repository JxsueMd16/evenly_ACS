/**
 * Reduce una foto (por ejemplo, la captura de una transferencia) a máximo
 * 1600 px por lado en JPEG, para que el comprobante pese poco al subirlo.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Elige una imagen (JPG, PNG o WebP).")
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("No se pudo leer la imagen. Prueba con otra.")
  })
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
  if (!blob) throw new Error("No se pudo procesar la imagen.")
  if (blob.size > 3 * 1024 * 1024) throw new Error("La imagen es demasiado grande (máximo 3 MB).")
  return blob
}

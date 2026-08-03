/**
 * Downscales and JPEG-compresses an image file client-side before it's
 * stored as a data URL in the mock store (localStorage-backed — keeping
 * payloads small avoids blowing the ~5MB quota after a handful of product
 * photos).
 */
export function fileToCompressedDataUrl(
  file: File,
  maxDimension = 480,
  quality = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      URL.revokeObjectURL(objectUrl)

      if (!ctx) {
        reject(new Error('Kanvas tidak didukung di perangkat ini'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Gagal membaca gambar'))
    }
    img.src = objectUrl
  })
}

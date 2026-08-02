import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { CameraSlash } from '@phosphor-icons/react'

/**
 * Formats relevant to a phone-accessory konter: EAN/UPC for printed retail
 * barcodes, CODE_128 for some supplier labels, QR as a fallback.
 */
const SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.QR_CODE,
]

interface BarcodeScannerProps {
  /** Mount/unmount the live camera feed. Kept false when a sheet/dialog covers it. */
  active: boolean
  onScan: (code: string) => void
}

/**
 * Thin wrapper around html5-qrcode. Debounces repeat reads of the same code
 * (the camera keeps decoding the same barcode every frame while it's in
 * view) and surfaces a manual-input nudge if the camera can't be reached —
 * PRD §4 calls for camera scan with manual entry as the fallback path.
 */
export function BarcodeScanner({ active, onScan }: BarcodeScannerProps) {
  const rawId = useId()
  const elementId = `scanner-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 })
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan
  const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'error'>('idle')

  useEffect(() => {
    if (!active) {
      setStatus('idle')
      return
    }

    let cancelled = false
    setStatus('starting')

    const scanner = new Html5Qrcode(elementId, {
      verbose: false,
      formatsToSupport: SCAN_FORMATS,
    })
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decodedText) => {
          const now = Date.now()
          if (decodedText === lastScanRef.current.code && now - lastScanRef.current.time < 1500) {
            return
          }
          lastScanRef.current = { code: decodedText, time: now }
          onScanRef.current(decodedText)
        },
        () => {
          // Fired continuously while no code is in frame — expected, not an error.
        },
      )
      .then(() => {
        if (!cancelled) setStatus('running')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      const instance = scannerRef.current
      scannerRef.current = null
      if (instance) {
        instance
          .stop()
          .then(() => instance.clear())
          .catch(() => {
            // Teardown before start finished (StrictMode double-invoke) — safe to ignore.
          })
      }
    }
  }, [active, elementId])

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
      <div
        id={elementId}
        className="size-full [&_video]:block [&_video]:size-full [&_video]:object-cover"
      />
      {status === 'starting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
          Mengaktifkan kamera…
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 px-6 text-center text-white">
          <CameraSlash size={24} weight="bold" />
          <p className="text-sm">Kamera tidak dapat diakses.</p>
          <p className="text-xs text-white/70">Gunakan input barcode manual di bawah.</p>
        </div>
      )}
      {status === 'running' && (
        <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-white/80" />
      )}
    </div>
  )
}

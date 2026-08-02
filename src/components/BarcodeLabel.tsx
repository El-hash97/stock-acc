import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeLabelProps {
  value: string
  productName: string
}

/**
 * Printable barcode sticker. Rendered as CODE128 regardless of the source
 * barcode's original symbology — mock/seed barcodes aren't guaranteed valid
 * EAN-13 checksums, and CODE128 encodes any string without that constraint
 * while still being one of the formats BarcodeScanner reads back.
 */
export function BarcodeLabel({ value, productName }: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    JsBarcode(svgRef.current, value, {
      format: 'CODE128',
      width: 2,
      height: 70,
      fontSize: 14,
      margin: 10,
      background: '#FFFFFF',
      lineColor: '#000000',
    })
  }, [value])

  return (
    <div className="print-barcode-label flex flex-col items-center gap-1 rounded-xl border border-border bg-white p-4">
      <p className="max-w-full truncate text-sm font-medium text-black">{productName}</p>
      <svg ref={svgRef} />
    </div>
  )
}

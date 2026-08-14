import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db.js'
import { requireRole } from '../_auth.js'
import { sendError } from '../_http.js'

function randomBarcodeCandidate(): string {
  const random = Math.floor(Math.random() * 1e10)
    .toString()
    .padStart(10, '0')
  return `899${random}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner', 'staff_gudang'])

    let barcode = randomBarcodeCandidate()
    let attempts = 0
    while (attempts < 10) {
      const rows = await sql`select id from products where barcode = ${barcode}`
      if (rows.length === 0) break
      barcode = randomBarcodeCandidate()
      attempts += 1
    }

    res.status(200).json({ barcode })
  } catch (err) {
    sendError(res, err)
  }
}

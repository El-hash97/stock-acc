import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db'
import { requireRole } from '../_auth'
import { sendError } from '../_http'
import type { Product } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner', 'kasir', 'staff_gudang'])
    const rows = (await sql`
      select * from products where stok <= stok_min order by stok asc
    `) as Product[]
    res.status(200).json(rows)
  } catch (err) {
    sendError(res, err)
  }
}

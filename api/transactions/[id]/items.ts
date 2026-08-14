import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../_db.js'
import { requireRole } from '../../_auth.js'
import { sendError } from '../../_http.js'
import type { TransactionItem } from '../../../src/types/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner', 'kasir'])
    const id = req.query.id as string
    const rows = (await sql`
      select * from transaction_items where transaction_id = ${id}
    `) as TransactionItem[]
    res.status(200).json(rows)
  } catch (err) {
    sendError(res, err)
  }
}

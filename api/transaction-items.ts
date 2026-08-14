import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'
import { requireRole } from './_auth'
import { sendError } from './_http'
import type { TransactionItem } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner'])
    const rows = (await sql`select * from transaction_items`) as TransactionItem[]
    res.status(200).json(rows)
  } catch (err) {
    sendError(res, err)
  }
}

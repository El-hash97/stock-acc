import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'
import { requireRole } from './_auth'
import { sendError, readBody } from './_http'
import type { Category } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      requireRole(req, ['owner', 'kasir', 'staff_gudang'])
      const rows = (await sql`select * from categories order by nama`) as Category[]
      res.status(200).json(rows)
      return
    }

    if (req.method === 'POST') {
      requireRole(req, ['owner'])
      const { nama } = readBody<{ nama: string }>(req)
      if (!nama || !nama.trim()) {
        res.status(400).json({ error: 'Nama kategori wajib diisi' })
        return
      }
      const rows = (await sql`
        insert into categories (nama) values (${nama.trim()}) returning *
      `) as Category[]
      res.status(201).json(rows[0])
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}

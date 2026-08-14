import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db'
import { requireRole, ApiError } from '../_auth'
import { sendError, readBody } from '../_http'
import type { Category } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'PATCH') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner'])

    const id = req.query.id as string
    const { nama } = readBody<{ nama: string }>(req)
    if (!nama || !nama.trim()) {
      res.status(400).json({ error: 'Nama kategori wajib diisi' })
      return
    }

    const rows = (await sql`
      update categories set nama = ${nama.trim()} where id = ${id} returning *
    `) as Category[]

    if (!rows[0]) {
      throw new ApiError(404, `Kategori dengan id "${id}" tidak ditemukan`)
    }

    res.status(200).json(rows[0])
  } catch (err) {
    sendError(res, err)
  }
}

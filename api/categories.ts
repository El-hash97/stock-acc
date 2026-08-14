import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'
import { requireRole, ApiError } from './_auth.js'
import { sendError, readBody } from './_http.js'
import type { Category } from '../src/types/index.js'

// Merged with the former api/categories/[id].ts (PATCH by id) so this
// resource stays a single Vercel Function — Hobby plan caps deployments at
// 12 functions, and `vercel dev --local`'s dynamic-segment routing proved
// unreliable for splitting this further, so `id` travels as a query param
// (?id=...) instead of a path segment.
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

    if (req.method === 'PATCH') {
      requireRole(req, ['owner'])
      const id = typeof req.query.id === 'string' ? req.query.id : null
      if (!id) {
        res.status(400).json({ error: 'Parameter id wajib diisi' })
        return
      }
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
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}

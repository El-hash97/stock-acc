import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { sql } from './_db.js'
import { requireRole, ApiError } from './_auth.js'
import { sendError, readBody } from './_http.js'
import type { PublicUser } from '../src/types/index.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      requireRole(req, ['owner'])
      const rows = (await sql`
        select id, nama, username, role, status, created_at from users order by nama
      `) as PublicUser[]
      res.status(200).json(rows)
      return
    }

    if (req.method === 'PATCH') {
      requireRole(req, ['owner'])
      const id = typeof req.query.id === 'string' ? req.query.id : null
      if (!id) {
        res.status(400).json({ error: 'Parameter id wajib diisi' })
        return
      }

      const { password } = readBody<{ password: string }>(req)
      if (!password || password.length < 6) {
        res.status(400).json({ error: 'Password baru minimal 6 karakter' })
        return
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const rows = (await sql`
        update users set password_hash = ${passwordHash} where id = ${id}
        returning id, nama, username, role, status, created_at
      `) as PublicUser[]

      if (!rows[0]) {
        throw new ApiError(404, `Pengguna dengan id "${id}" tidak ditemukan`)
      }

      res.status(200).json(rows[0])
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}

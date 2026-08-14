import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { sql, NeonDbError } from './_db.js'
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

      const body = readBody<{ nama?: string; username?: string; password?: string }>(req)

      if (body.nama !== undefined && !body.nama.trim()) {
        res.status(400).json({ error: 'Nama tidak boleh kosong' })
        return
      }
      if (body.username !== undefined && !body.username.trim()) {
        res.status(400).json({ error: 'Username tidak boleh kosong' })
        return
      }
      if (body.password !== undefined && body.password.length < 6) {
        res.status(400).json({ error: 'Password baru minimal 6 karakter' })
        return
      }

      const existingRows = (await sql`
        select nama, username, password_hash from users where id = ${id}
      `) as { nama: string; username: string; password_hash: string }[]
      const existing = existingRows[0]
      if (!existing) {
        throw new ApiError(404, `Pengguna dengan id "${id}" tidak ditemukan`)
      }

      const nama = body.nama !== undefined ? body.nama.trim() : existing.nama
      const username = body.username !== undefined ? body.username.trim() : existing.username
      const passwordHash =
        body.password !== undefined ? await bcrypt.hash(body.password, 10) : existing.password_hash

      let rows: PublicUser[]
      try {
        rows = (await sql`
          update users set nama = ${nama}, username = ${username}, password_hash = ${passwordHash}
          where id = ${id}
          returning id, nama, username, role, status, created_at
        `) as PublicUser[]
      } catch (err) {
        if (err instanceof NeonDbError && err.code === '23505') {
          throw new ApiError(409, `Username "${username}" sudah digunakan pengguna lain`)
        }
        throw err
      }

      res.status(200).json(rows[0])
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}

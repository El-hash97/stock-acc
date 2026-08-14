import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { sql } from '../_db.js'
import { signToken } from '../_auth.js'
import { sendError, readBody } from '../_http.js'
import type { Role } from '../../src/types/index.js'

interface LoginBody {
  username: string
  password: string
}

interface UserRow {
  id: string
  nama: string
  username: string
  password_hash: string
  role: Role
  status: 'aktif' | 'nonaktif'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metode tidak diizinkan' })
    return
  }

  try {
    const { username, password } = readBody<LoginBody>(req)
    if (!username || !password) {
      res.status(400).json({ error: 'Username dan password wajib diisi' })
      return
    }

    const rows = (await sql`
      select id, nama, username, password_hash, role, status
      from users
      where username = ${username}
    `) as UserRow[]
    const user = rows[0]

    if (!user || user.status !== 'aktif') {
      res.status(401).json({ error: 'Username atau password salah' })
      return
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ error: 'Username atau password salah' })
      return
    }

    const token = signToken({ sub: user.id, role: user.role, nama: user.nama })
    res.status(200).json({
      token,
      user: { id: user.id, nama: user.nama, role: user.role },
    })
  } catch (err) {
    sendError(res, err)
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db'
import { requireRole, ApiError } from '../_auth'
import { sendError, readBody } from '../_http'
import type { Product } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = req.query.id as string

    if (req.method === 'GET') {
      requireRole(req, ['owner', 'kasir', 'staff_gudang'])
      const rows = (await sql`select * from products where id = ${id}`) as Product[]
      res.status(200).json(rows[0] ?? null)
      return
    }

    if (req.method === 'PATCH') {
      requireRole(req, ['owner', 'staff_gudang'])
      const body = readBody<{
        nama?: string
        tipe?: string | null
        harga_modal?: number
        harga_jual?: number
        foto_url?: string | null
      }>(req)

      const existingRows = (await sql`select * from products where id = ${id}`) as Product[]
      const existing = existingRows[0]
      if (!existing) {
        throw new ApiError(404, `Produk dengan id "${id}" tidak ditemukan`)
      }

      const nama = body.nama ?? existing.nama
      const tipe = body.tipe !== undefined ? body.tipe : existing.tipe
      const hargaModal = body.harga_modal ?? existing.harga_modal
      const hargaJual = body.harga_jual ?? existing.harga_jual
      const fotoUrl = body.foto_url !== undefined ? body.foto_url : existing.foto_url

      const rows = (await sql`
        update products
        set nama = ${nama}, tipe = ${tipe}, harga_modal = ${hargaModal},
            harga_jual = ${hargaJual}, foto_url = ${fotoUrl}
        where id = ${id}
        returning *
      `) as Product[]

      res.status(200).json(rows[0])
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}

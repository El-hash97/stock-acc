import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, NeonDbError } from '../_db'
import { requireRole, ApiError } from '../_auth'
import { sendError, readBody } from '../_http'
import type { Product } from '../../src/types'

/** Kasir tidak boleh melihat harga_modal/profit (matriks akses PRD §3). */
function stripCost(product: Product, role: string): Product {
  if (role === 'kasir') {
    return { ...product, harga_modal: 0 }
  }
  return product
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const payload = requireRole(req, ['owner', 'kasir', 'staff_gudang'])

      const search =
        typeof req.query.search === 'string' && req.query.search.trim()
          ? req.query.search.trim()
          : null
      const categoryId =
        typeof req.query.category_id === 'string' ? req.query.category_id : null

      const rows = (await sql`
        select * from products
        where (${categoryId}::uuid is null or category_id = ${categoryId}::uuid)
          and (
            ${search}::text is null
            or nama ilike ${'%' + (search ?? '') + '%'}
            or barcode like ${'%' + (search ?? '') + '%'}
          )
        order by nama
      `) as Product[]

      res.status(200).json(rows.map((p) => stripCost(p, payload.role)))
      return
    }

    if (req.method === 'POST') {
      const payload = requireRole(req, ['owner', 'staff_gudang'])
      const body = readBody<{
        barcode: string
        nama: string
        tipe?: string | null
        category_id: string
        harga_modal: number
        harga_jual: number
        stok: number
        stok_min: number
        foto_url?: string | null
      }>(req)

      if (!body.barcode || !body.nama || !body.category_id) {
        res.status(400).json({ error: 'Barcode, nama, dan kategori wajib diisi' })
        return
      }

      const productId = crypto.randomUUID()
      let product: Product

      try {
        const rows = (await sql`
          insert into products
            (id, barcode, nama, tipe, category_id, harga_modal, harga_jual, stok, stok_min, foto_url, status)
          values
            (${productId}, ${body.barcode}, ${body.nama}, ${body.tipe ?? null}, ${body.category_id},
             ${body.harga_modal}, ${body.harga_jual}, ${body.stok}, ${body.stok_min}, ${body.foto_url ?? null}, 'aktif')
          returning *
        `) as Product[]
        product = rows[0]
      } catch (err) {
        if (err instanceof NeonDbError && err.code === '23505') {
          throw new ApiError(409, `Barcode "${body.barcode}" sudah digunakan produk lain`)
        }
        throw err
      }

      if (body.stok > 0) {
        await sql`
          insert into stock_movements (id, product_id, tipe, qty, user_id, catatan, created_at)
          values (${crypto.randomUUID()}, ${productId}, 'in', ${body.stok}, ${payload.sub}, 'Stok awal produk baru', ${new Date().toISOString()})
        `
      }

      res.status(201).json(product)
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, NeonDbError } from './_db'
import { requireRole, ApiError } from './_auth'
import { sendError, readBody } from './_http'
import type { Product } from '../src/types'

// Merged with the former api/products/[id].ts, api/products/barcode/[barcode].ts,
// and api/products/low-stock.ts so this resource stays a single Vercel
// Function — see api/categories.ts for why (Hobby plan's 12-function cap).
// id/barcode/low-stock all travel as query params instead of path segments.

/** Kasir tidak boleh melihat harga_modal/profit (matriks akses PRD §3). */
function stripCost(product: Product, role: string): Product {
  if (role === 'kasir') {
    return { ...product, harga_modal: 0 }
  }
  return product
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = typeof req.query.id === 'string' ? req.query.id : null
    const barcode = typeof req.query.barcode === 'string' ? req.query.barcode : null
    const lowStock = typeof req.query.low_stock === 'string'

    if (req.method === 'GET' && lowStock) {
      requireRole(req, ['owner', 'kasir', 'staff_gudang'])
      const rows = (await sql`
        select * from products where stok <= stok_min order by stok asc
      `) as Product[]
      res.status(200).json(rows)
      return
    }

    if (req.method === 'GET' && barcode) {
      requireRole(req, ['owner', 'kasir', 'staff_gudang'])
      const rows = (await sql`select * from products where barcode = ${barcode}`) as Product[]
      res.status(200).json(rows[0] ?? null)
      return
    }

    if (req.method === 'GET' && id) {
      requireRole(req, ['owner', 'kasir', 'staff_gudang'])
      const rows = (await sql`select * from products where id = ${id}`) as Product[]
      res.status(200).json(rows[0] ?? null)
      return
    }

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

    if (req.method === 'PATCH' && id) {
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

    if (req.method === 'PATCH' && !id) {
      res.status(400).json({ error: 'Parameter id wajib diisi' })
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}

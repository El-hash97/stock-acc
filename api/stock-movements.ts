import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'
import { requireRole, ApiError } from './_auth'
import { sendError, readBody } from './_http'
import type { StockMovement } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      requireRole(req, ['owner', 'kasir', 'staff_gudang'])
      const productId = typeof req.query.product_id === 'string' ? req.query.product_id : null

      const rows = (
        productId
          ? await sql`select * from stock_movements where product_id = ${productId} order by created_at desc`
          : await sql`select * from stock_movements order by created_at desc`
      ) as StockMovement[]

      res.status(200).json(rows)
      return
    }

    if (req.method === 'POST') {
      const payload = requireRole(req, ['owner', 'staff_gudang'])
      const body = readBody<{
        product_id: string
        tipe: StockMovement['tipe']
        qty: number
        catatan?: string
      }>(req)

      const existing = await sql`select id from products where id = ${body.product_id}`
      if (existing.length === 0) {
        throw new ApiError(404, `Produk dengan id "${body.product_id}" tidak ditemukan`)
      }

      const movementId = crypto.randomUUID()
      const now = new Date().toISOString()

      const [movementRows] = (await sql.transaction([
        sql`
          insert into stock_movements (id, product_id, tipe, qty, user_id, catatan, created_at)
          values (${movementId}, ${body.product_id}, ${body.tipe}, ${body.qty}, ${payload.sub}, ${body.catatan ?? null}, ${now})
          returning *
        `,
        sql`
          update products
          set stok = case
            when ${body.tipe} = 'in' then stok + ${body.qty}
            when ${body.tipe} = 'out' then greatest(stok - ${body.qty}, 0)
            else greatest(stok + ${body.qty}, 0)
          end
          where id = ${body.product_id}
        `,
      ])) as [StockMovement[], unknown]

      res.status(201).json(movementRows[0])
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}

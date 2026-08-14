import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, NeonDbError } from '../_db'
import { requireRole, ApiError } from '../_auth'
import { sendError, readBody } from '../_http'
import type { CreateTransactionInput, Transaction } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      requireRole(req, ['owner', 'kasir'])
      const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : null

      const rows = (
        limitParam
          ? await sql`select * from transactions order by created_at desc limit ${limitParam}`
          : await sql`select * from transactions order by created_at desc`
      ) as Transaction[]

      res.status(200).json(rows)
      return
    }

    if (req.method === 'POST') {
      // user_id datang dari JWT (payload.sub), bukan dari body — client tidak
      // dipercaya untuk menentukan atas nama siapa transaksi dicatat.
      const payload = requireRole(req, ['owner', 'kasir'])
      const body = readBody<CreateTransactionInput>(req)

      if (!body.items || body.items.length === 0) {
        res.status(400).json({ error: 'Transaksi harus memiliki minimal 1 item' })
        return
      }

      const total = body.items.reduce((sum, item) => sum + item.harga * item.qty, 0)
      const dibayar = body.dibayar
      const kembalian = Math.max(dibayar - total, 0)
      const now = new Date().toISOString()
      const datePart = now.slice(0, 10).replace(/-/g, '')

      const countRows = (await sql`select count(*)::int as count from transactions`) as {
        count: number
      }[]
      const noNota = `INV-${datePart}-${String(countRows[0].count + 1).padStart(3, '0')}`
      const transactionId = crypto.randomUUID()

      const queries = [
        sql`
          insert into transactions (id, no_nota, user_id, total, metode_bayar, dibayar, kembalian, status, created_at)
          values (${transactionId}, ${noNota}, ${payload.sub}, ${total}, ${body.metode_bayar}, ${dibayar}, ${kembalian}, 'selesai', ${now})
        `,
      ]

      for (const item of body.items) {
        queries.push(
          sql`
            insert into transaction_items (id, transaction_id, product_id, qty, harga, subtotal)
            values (${crypto.randomUUID()}, ${transactionId}, ${item.product_id}, ${item.qty}, ${item.harga}, ${item.harga * item.qty})
          `,
        )
        queries.push(
          sql`update products set stok = greatest(stok - ${item.qty}, 0) where id = ${item.product_id}`,
        )
        queries.push(
          sql`
            insert into stock_movements (id, product_id, tipe, qty, user_id, catatan, created_at)
            values (${crypto.randomUUID()}, ${item.product_id}, 'out', ${item.qty}, ${payload.sub}, ${'Penjualan ' + noNota}, ${now})
          `,
        )
      }

      try {
        await sql.transaction(queries)
      } catch (err) {
        if (err instanceof NeonDbError && err.code === '23505') {
          throw new ApiError(409, 'Nomor nota bentrok, silakan coba lagi')
        }
        throw err
      }

      const transaction: Transaction = {
        id: transactionId,
        no_nota: noNota,
        user_id: payload.sub,
        total,
        metode_bayar: body.metode_bayar,
        dibayar,
        kembalian,
        status: 'selesai',
        created_at: now,
      }

      res.status(201).json(transaction)
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'
import { requireRole } from './_auth'
import { sendError } from './_http'
import type { DashboardSummary } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    // created_at::date dibandingkan ke current_date pakai timezone server DB
    // (UTC di Neon) — sama seperti mock yang memakai timezone proses Node,
    // keduanya tidak diselaraskan ke timezone toko secara eksplisit (di luar
    // scope PRD untuk pass ini).
    const payload = requireRole(req, ['owner', 'kasir'])

    const penjualanRows = await sql`
      select
        coalesce(sum(total), 0)::int as penjualan_hari_ini,
        count(*)::int as transaksi_hari_ini
      from transactions
      where status = 'selesai' and created_at::date = current_date
    `

    const stokRows = await sql`
      select
        count(*) filter (where stok > 0 and stok <= stok_min)::int as produk_menipis,
        count(*) filter (where stok = 0)::int as produk_habis
      from products
    `

    const labaRows = await sql`
      select coalesce(sum(ti.subtotal - (p.harga_modal * ti.qty)), 0)::int as laba_hari_ini
      from transaction_items ti
      join transactions t on t.id = ti.transaction_id
      join products p on p.id = ti.product_id
      where t.status = 'selesai' and t.created_at::date = current_date
    `

    const summary: DashboardSummary = {
      penjualan_hari_ini: penjualanRows[0].penjualan_hari_ini,
      transaksi_hari_ini: penjualanRows[0].transaksi_hari_ini,
      produk_menipis: stokRows[0].produk_menipis,
      produk_habis: stokRows[0].produk_habis,
      laba_hari_ini: payload.role === 'kasir' ? 0 : labaRows[0].laba_hari_ini,
    }

    res.status(200).json(summary)
  } catch (err) {
    sendError(res, err)
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ApiError } from './_auth.js'

/** Maps a thrown error to an HTTP response. Call from the catch block of every handler. */
export function sendError(res: VercelResponse, err: unknown): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Terjadi kesalahan tak terduga' })
}

/** Vercel parses JSON bodies into req.body automatically; this guards the rare string case. */
export function readBody<T>(req: VercelRequest): T {
  return (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as T
}

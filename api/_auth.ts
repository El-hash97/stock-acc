import jwt from 'jsonwebtoken'
import type { VercelRequest } from '@vercel/node'
import type { Role } from '../src/types/index.js'

// See api/_db.ts for why this fallback load is needed under `vercel dev --local`.
if (!process.env.JWT_SECRET) {
  try {
    process.loadEnvFile('.env.local')
  } catch {
    // .env.local not present — fine in deployed environments.
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

// A function return type of `string` (rather than a narrowed module-level
// `const`) is required here: TypeScript does not carry control-flow
// narrowing into the closures below (signToken/requireRole), so a plain
// `if (!jwtSecret) throw` guard would still leave `jwtSecret` typed as
// `string | undefined` at every call site.
const jwtSecret = requireEnv('JWT_SECRET')

export interface AuthPayload {
  sub: string
  role: Role
  nama: string
}

/** Thrown by request handlers; `_http.ts#sendError` maps it to the right HTTP status. */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, jwtSecret, { expiresIn: '8h' })
}

/** Verifies the Bearer token and checks the caller's role. Throws ApiError(401|403) on failure. */
export function requireRole(req: VercelRequest, allowedRoles: Role[]): AuthPayload {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Belum login')
  }

  const token = header.slice('Bearer '.length)
  let payload: AuthPayload
  try {
    payload = jwt.verify(token, jwtSecret) as unknown as AuthPayload
  } catch {
    throw new ApiError(401, 'Sesi tidak valid, silakan login ulang')
  }

  if (!allowedRoles.includes(payload.role)) {
    throw new ApiError(403, 'Anda tidak memiliki akses untuk aksi ini')
  }

  return payload
}

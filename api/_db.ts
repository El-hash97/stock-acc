import { neon, NeonDbError } from '@neondatabase/serverless'

// `vercel dev --local` (unlinked mode) does not inject .env.local into the
// Function's process.env — only the linked/deployed platform does that
// automatically. Load it ourselves as a fallback; a no-op wherever the var
// is already set (deployed envs, or `vercel dev` once linked).
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile('.env.local')
  } catch {
    // .env.local not present — fine in deployed environments.
  }
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

export const sql = neon(databaseUrl)
export { NeonDbError }

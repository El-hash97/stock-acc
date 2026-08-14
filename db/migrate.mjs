import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const file = process.argv[2]

if (!file) {
  console.error('Usage: npm run db:migrate -- <schema.sql|seed.sql>')
  process.exit(1)
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Run via: npm run db:migrate -- <file>')
  process.exit(1)
}

const sql = neon(databaseUrl)

const rawText = readFileSync(path.resolve(process.cwd(), file), 'utf8')
// Strip whole-line comments first so a `;`-split chunk never starts with
// `--` while still containing real SQL on a later line.
const withoutComments = rawText
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

const statements = withoutComments
  .split(';')
  .map((statement) => statement.trim())
  .filter((statement) => statement.length > 0)

for (const statement of statements) {
  const preview = statement.slice(0, 70).replace(/\s+/g, ' ')
  console.log(`Running: ${preview}...`)
  await sql.query(statement)
}

console.log(`Done. Ran ${statements.length} statements from ${file}.`)

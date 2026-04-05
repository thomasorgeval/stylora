import { Pool } from 'pg'

import { getDatabaseUrl } from './env.js'

const MAX_ATTEMPTS = 30
const DELAY_MS = 1000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function canQueryDatabase(connectionString: string) {
  const url = new URL(connectionString)
  const pool = new Pool({
    host: url.hostname === 'localhost' ? '127.0.0.1' : url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    max: 1,
    connectionTimeoutMillis: 1000,
  })

  try {
    await pool.query('select 1')
    return true
  } catch {
    return false
  } finally {
    await pool.end()
  }
}

async function waitForDatabase() {
  const connectionString = getDatabaseUrl()

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (await canQueryDatabase(connectionString)) {
      console.log(`Database is queryable after ${attempt} attempt(s).`)
      return
    }

    await sleep(DELAY_MS)
  }

  throw new Error(`Database did not become queryable after ${MAX_ATTEMPTS} attempts.`)
}

await waitForDatabase()

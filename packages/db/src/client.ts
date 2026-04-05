import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool, type PoolConfig } from 'pg'

import { getDatabaseUrl } from './env.js'
import { schema } from './schema.js'

export function createPool(connectionString: string, config: Omit<PoolConfig, 'connectionString'> = {}) {
  return new Pool({
    ...config,
    connectionString,
  })
}

export function createDb(connectionString: string, config: Omit<PoolConfig, 'connectionString'> = {}) {
  const pool = createPool(connectionString, config)

  return drizzle({ client: pool, schema })
}

export function createAppDb(env: NodeJS.ProcessEnv = process.env) {
  return createDb(getDatabaseUrl(env))
}

export const appDb = createAppDb()

export type Database = ReturnType<typeof createDb>

export async function pingDatabase(db: Database) {
  await db.execute(sql`select 1`)
}

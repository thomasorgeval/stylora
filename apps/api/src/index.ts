import { serve } from '@hono/node-server'
import { auth } from '@stylora/auth'
import { createAppDb, getDatabaseUrl, pingDatabase } from '@stylora/db'
import { Hono } from 'hono'

const app = new Hono()
const db = createAppDb()

app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    databaseMode: process.env.DATABASE_URL ? 'env' : 'default-local',
    databaseUrl: getDatabaseUrl().replace(/:[^:@/]+@/, ':****@'),
  })
})

app.get('/health/db', async (c) => {
  try {
    await pingDatabase(db)

    return c.json({ status: 'ok' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed'

    return c.json({ status: 'error', message }, 503)
  }
})

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)

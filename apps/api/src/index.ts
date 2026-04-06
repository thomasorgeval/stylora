import { serve } from '@hono/node-server'
import { auth, getBetterAuthTrustedOrigins } from '@stylora/auth'
import { createAppDb, getDatabaseUrl, pingDatabase } from '@stylora/db'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()
const db = createAppDb()
const trustedOrigins = new Set(getBetterAuthTrustedOrigins())

app.use(
  '/api/auth/*',
  cors({
    origin: (origin) => {
      if (!origin) {
        return null
      }

      return trustedOrigins.has(origin) ? origin : null
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
    maxAge: 600,
  }),
)

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

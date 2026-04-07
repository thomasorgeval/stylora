import { serve } from '@hono/node-server'
import { auth, getBetterAuthTrustedOrigins } from '@stylora/auth'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { type ApiAuthEnv, sessionContextMiddleware } from './middleware/auth.js'
import { createConnectionsRouter } from './routes/connections.js'
import { createProjectsRouter } from './routes/projects.js'

const app = new Hono<ApiAuthEnv>()
const trustedOrigins = new Set(getBetterAuthTrustedOrigins())

app.use('*', sessionContextMiddleware())

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
  return c.json({ status: 'ok' })
})

app.route('/api/projects', createProjectsRouter())
app.route('/api', createConnectionsRouter())

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)

import { RequestAuthError } from '@stylora/auth'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { type ApiAuthEnv, createProjectPermissionGuard, getAuthContext, sessionContextMiddleware } from './auth.js'

describe('session context middleware', () => {
  it('stores null user and session when the request is anonymous', async () => {
    const app = new Hono<ApiAuthEnv>()

    app.use(
      '*',
      sessionContextMiddleware({
        async getSessionFromHeaders() {
          return null
        },
      }),
    )

    app.get('/session', (c) => {
      return c.json({
        user: c.get('user'),
        session: c.get('session'),
      })
    })

    const response = await app.request('/session')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ user: null, session: null })
  })
})

describe('project permission guard', () => {
  it('returns a structured forbidden error when the member lacks permission', async () => {
    const app = new Hono<ApiAuthEnv>()

    app.use(
      '*',
      createProjectPermissionGuard('delete', {
        async requireProjectPermission() {
          throw new RequestAuthError('FORBIDDEN', 'You cannot delete projects.', 403)
        },
      }),
    )

    app.get('/projects', (c) => c.json({ ok: true }))

    const response = await app.request('/projects')

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: 'FORBIDDEN',
      message: 'You cannot delete projects.',
    })
  })

  it('attaches the authorization context when permission is granted', async () => {
    const app = new Hono<ApiAuthEnv>()

    app.use(
      '*',
      createProjectPermissionGuard('read', {
        async requireProjectPermission() {
          return {
            session: {
              id: 'session_123',
              userId: 'user_123',
              token: 'token_123',
              activeOrganizationId: 'org_123',
              createdAt: new Date('2026-04-06T12:00:00.000Z'),
              updatedAt: new Date('2026-04-06T12:00:00.000Z'),
              expiresAt: new Date('2026-04-07T12:00:00.000Z'),
            },
            user: {
              id: 'user_123',
              email: 'thomas@example.com',
              emailVerified: true,
              name: 'Thomas',
              createdAt: new Date('2026-04-06T12:00:00.000Z'),
              updatedAt: new Date('2026-04-06T12:00:00.000Z'),
            },
            activeOrganization: {
              id: 'org_123',
              name: 'Thomas Workspace',
              slug: 'thomas-workspace',
              createdAt: new Date('2026-04-06T12:00:00.000Z'),
            },
          }
        },
      }),
    )

    app.get('/projects', (c) => {
      const authContext = getAuthContext(c)

      return c.json({
        userId: authContext.user.id,
        organizationId: authContext.activeOrganization.id,
      })
    })

    const response = await app.request('/projects')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      userId: 'user_123',
      organizationId: 'org_123',
    })
  })
})

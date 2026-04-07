import { describe, expect, it } from 'vitest'

import { createRequestAuth, type RequestAuthError } from './request-auth.js'

function buildHeaders() {
  return new Headers({ cookie: 'better-auth.session_token=test' })
}

describe('request auth helpers', () => {
  it('rejects missing sessions when requiring the current user', async () => {
    const requestAuth = createRequestAuth({
      async getSession() {
        return null
      },
      async getFullOrganization() {
        throw new Error('not reached')
      },
      async hasPermission() {
        throw new Error('not reached')
      },
    })

    await expect(requestAuth.requireCurrentUser(buildHeaders())).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
    } satisfies Partial<RequestAuthError>)
  })

  it('rejects when no active organization exists in session state', async () => {
    const requestAuth = createRequestAuth({
      async getSession() {
        return {
          session: {
            id: 'session_123',
            userId: 'user_123',
            token: 'token_123',
            activeOrganizationId: null,
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
        }
      },
      async getFullOrganization() {
        throw new Error('not reached')
      },
      async hasPermission() {
        throw new Error('not reached')
      },
    })

    await expect(requestAuth.requireActiveOrganization(buildHeaders())).rejects.toMatchObject({
      code: 'NO_ACTIVE_ORGANIZATION',
      status: 409,
    } satisfies Partial<RequestAuthError>)
  })

  it('builds project authorization context and checks permissions against the active organization', async () => {
    const calls: Array<{ organizationId?: string; permissions: Record<string, string[]> }> = []
    const requestAuth = createRequestAuth({
      async getSession() {
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
        }
      },
      async getFullOrganization() {
        return {
          id: 'org_123',
          name: 'Thomas Workspace',
          slug: 'thomas-workspace',
          createdAt: new Date('2026-04-06T12:00:00.000Z'),
          members: [],
          invitations: [],
        }
      },
      async hasPermission({ body }) {
        calls.push(body)
        return { success: true, error: null }
      },
    })

    const context = await requestAuth.requireProjectPermission(buildHeaders(), 'update')

    expect(calls).toEqual([
      {
        organizationId: 'org_123',
        permissions: { project: ['update'] },
      },
    ])
    expect(context.activeOrganization.id).toBe('org_123')
    expect(context.user.email).toBe('thomas@example.com')
  })

  it('rejects forbidden project permissions', async () => {
    const requestAuth = createRequestAuth({
      async getSession() {
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
        }
      },
      async getFullOrganization() {
        return {
          id: 'org_123',
          name: 'Thomas Workspace',
          slug: 'thomas-workspace',
          createdAt: new Date('2026-04-06T12:00:00.000Z'),
          members: [],
          invitations: [],
        }
      },
      async hasPermission() {
        return { success: false, error: null }
      },
    })

    await expect(requestAuth.requireProjectPermission(buildHeaders(), 'delete')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    } satisfies Partial<RequestAuthError>)
  })
})

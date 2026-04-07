import type { StyloraAuthorizationContext } from '@stylora/auth'
import { decryptConnectionPassword, encryptConnectionPassword } from '@stylora/db'
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApiAuthEnv } from '../middleware/auth.js'
import {
  type ConnectionRecord,
  type ConnectionsRepository,
  createConnectionsRouter,
  type TestDatabaseConnection,
} from './connections.js'

const VALID_ENV = {
  DATABASE_ENCRYPTION_KEY: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
} satisfies NodeJS.ProcessEnv

function createAuthorizationContext(): StyloraAuthorizationContext {
  return {
    session: {
      id: 'session_123',
      userId: 'user_123',
      token: 'token_123',
      activeOrganizationId: 'org_123',
      createdAt: new Date('2026-04-07T12:00:00.000Z'),
      updatedAt: new Date('2026-04-07T12:00:00.000Z'),
      expiresAt: new Date('2026-04-08T12:00:00.000Z'),
    },
    user: {
      id: 'user_123',
      email: 'thomas@example.com',
      emailVerified: true,
      name: 'Thomas',
      createdAt: new Date('2026-04-07T12:00:00.000Z'),
      updatedAt: new Date('2026-04-07T12:00:00.000Z'),
    },
    activeOrganization: {
      id: 'org_123',
      name: 'Thomas Workspace',
      slug: 'thomas-workspace',
      createdAt: new Date('2026-04-07T12:00:00.000Z'),
    },
  }
}

function createConnection(overrides: Partial<ConnectionRecord> = {}): ConnectionRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    projectId: '22222222-2222-4222-8222-222222222222',
    name: 'Primary database',
    engine: 'postgresql',
    host: 'db.internal',
    port: 5432,
    databaseName: 'stylora',
    username: 'postgres',
    passwordEncrypted: encryptConnectionPassword('super-secret', VALID_ENV),
    sslMode: 'prefer',
    connectionOptions: null,
    lastTestedAt: null,
    lastTestStatus: null,
    createdByUserId: 'user_123',
    createdAt: new Date('2026-04-07T12:00:00.000Z'),
    updatedAt: new Date('2026-04-07T12:00:00.000Z'),
    ...overrides,
  }
}

function createRepository(): ConnectionsRepository {
  return {
    getProjectById: vi.fn(async () => ({ id: '22222222-2222-4222-8222-222222222222' })),
    listConnectionsByProject: vi.fn(async () => []),
    createConnection: vi.fn(async (args) => createConnection(args)),
    getConnectionById: vi.fn(async () => null),
    updateConnectionById: vi.fn(async () => null),
    deleteConnectionById: vi.fn(async () => false),
  }
}

function createApp(
  repository: ConnectionsRepository,
  actions: string[],
  testDatabaseConnection = vi.fn<TestDatabaseConnection>(async () => {}),
  authorizationContext = createAuthorizationContext(),
) {
  const app = new Hono<ApiAuthEnv>()

  const guardFactory = (action: 'create' | 'read' | 'update' | 'delete') => {
    actions.push(action)

    return createMiddleware<ApiAuthEnv>(async (c, next) => {
      c.set('auth', authorizationContext)
      c.set('session', authorizationContext.session)
      c.set('user', authorizationContext.user)
      await next()
    })
  }

  app.route(
    '/api',
    createConnectionsRouter({
      repository,
      guardFactory,
      testDatabaseConnection,
      env: VALID_ENV,
    }),
  )

  return { app, testDatabaseConnection }
}

describe('connections router', () => {
  let repository: ConnectionsRepository
  let actions: string[]

  beforeEach(() => {
    repository = createRepository()
    actions = []
  })

  it('creates a project connection with an encrypted password', async () => {
    const { app } = createApp(repository, actions)
    const response = await app.request('/api/projects/22222222-2222-4222-8222-222222222222/connections', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '  Analytics replica  ',
        engine: 'postgresql',
        host: '  replica.internal  ',
        port: 5432,
        databaseName: '  analytics  ',
        username: '  reader  ',
        password: 'top-secret',
        sslMode: 'prefer',
      }),
    })

    expect(response.status).toBe(201)
    expect(repository.createConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: '22222222-2222-4222-8222-222222222222',
        organizationId: 'org_123',
        createdByUserId: 'user_123',
        name: 'Analytics replica',
        engine: 'postgresql',
        host: 'replica.internal',
        databaseName: 'analytics',
        username: 'reader',
        sslMode: 'prefer',
      }),
    )

    const createArgs = vi.mocked(repository.createConnection).mock.calls[0]?.[0]
    expect(createArgs?.passwordEncrypted).toBeTruthy()
    expect(createArgs?.passwordEncrypted).not.toBe('top-secret')
    expect(decryptConnectionPassword(createArgs?.passwordEncrypted ?? '', VALID_ENV)).toBe('top-secret')
  })

  it('keeps the stored password when updating a connection with a blank password field', async () => {
    const existingConnection = createConnection()
    vi.mocked(repository.getConnectionById).mockResolvedValue(existingConnection)
    vi.mocked(repository.updateConnectionById).mockResolvedValue(
      createConnection({
        name: 'Analytics replica',
        passwordEncrypted: existingConnection.passwordEncrypted,
      }),
    )

    const { app } = createApp(repository, actions)
    const response = await app.request(`/api/connections/${existingConnection.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '  Analytics replica  ',
        password: '   ',
      }),
    })

    expect(response.status).toBe(200)
    expect(repository.updateConnectionById).toHaveBeenCalledWith({
      connectionId: existingConnection.id,
      organizationId: 'org_123',
      name: 'Analytics replica',
      passwordEncrypted: existingConnection.passwordEncrypted,
    })
  })

  it('tests draft connection settings with the stored password when connectionId is provided', async () => {
    const existingConnection = createConnection({
      passwordEncrypted: encryptConnectionPassword('stored-password', VALID_ENV),
    })
    vi.mocked(repository.getConnectionById).mockResolvedValue(existingConnection)

    const { app, testDatabaseConnection } = createApp(repository, actions)
    const response = await app.request('/api/projects/22222222-2222-4222-8222-222222222222/connections/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        connectionId: existingConnection.id,
        engine: 'postgresql',
        host: 'db.internal',
        port: 5432,
        databaseName: 'stylora',
        username: 'postgres',
        password: '   ',
        sslMode: 'prefer',
      }),
    })

    expect(response.status).toBe(200)
    expect(testDatabaseConnection).toHaveBeenCalledWith({
      engine: 'postgresql',
      host: 'db.internal',
      port: 5432,
      databaseName: 'stylora',
      username: 'postgres',
      password: 'stored-password',
      sslMode: 'prefer',
      connectionOptions: undefined,
    })
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it('sanitizes driver errors when testing a connection', async () => {
    const { app } = createApp(
      repository,
      actions,
      vi.fn(async () => {
        throw new Error('password authentication failed for user postgres at 10.0.0.2')
      }),
    )

    const response = await app.request('/api/projects/22222222-2222-4222-8222-222222222222/connections/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        engine: 'postgresql',
        host: 'db.internal',
        port: 5432,
        databaseName: 'stylora',
        username: 'postgres',
        password: 'secret',
        sslMode: 'prefer',
      }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Unable to connect using the provided settings.',
    })
  })
})

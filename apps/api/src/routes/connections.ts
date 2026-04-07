import {
  type CreateDatabaseConnectionInput,
  createDatabaseConnectionSchema,
  databaseConnectionIdParamsSchema,
  type ProjectDatabaseConnectionTestInput,
  projectDatabaseConnectionTestSchema,
  projectIdParamsSchema,
  updateDatabaseConnectionSchema,
} from '@stylora/contracts'
import {
  appDb,
  type Database,
  databaseConnections,
  decryptConnectionPassword,
  encryptConnectionPassword,
  projects,
} from '@stylora/db'
import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { Pool } from 'pg'

import { notFoundError, parseValidatedJsonBody, parseValidatedParams } from '../lib/http.js'
import {
  type ApiAuthEnv,
  createProjectPermissionGuard,
  getAuthContext,
  type ResourceAction,
} from '../middleware/auth.js'

type ProjectScope = {
  projectId: string
  organizationId: string
}

type ConnectionScope = {
  connectionId: string
  organizationId: string
}

type ProjectLookupResult = {
  id: string
}

type CreateConnectionArgs = ProjectScope &
  CreateDatabaseConnectionInput & {
    createdByUserId: string
    passwordEncrypted: string
  }

type UpdateConnectionArgs = ConnectionScope & {
  name?: string
  engine?: 'postgresql'
  host?: string
  port?: number
  databaseName?: string
  username?: string
  passwordEncrypted?: string
  sslMode?: 'disable' | 'prefer' | 'require' | 'verify-ca' | 'verify-full'
  connectionOptions?: Record<string, unknown> | null
}

export type ConnectionRecord = typeof databaseConnections.$inferSelect

export type TestDatabaseConnectionInput = Pick<
  ProjectDatabaseConnectionTestInput,
  'engine' | 'host' | 'port' | 'databaseName' | 'username' | 'password' | 'sslMode' | 'connectionOptions'
>

export type TestDatabaseConnection = (input: TestDatabaseConnectionInput) => Promise<void>

export type ConnectionsRepository = {
  getProjectById(args: ProjectScope): Promise<ProjectLookupResult | null>
  listConnectionsByProject(args: ProjectScope): Promise<ConnectionRecord[]>
  createConnection(args: CreateConnectionArgs): Promise<ConnectionRecord>
  getConnectionById(args: ConnectionScope): Promise<ConnectionRecord | null>
  updateConnectionById(args: UpdateConnectionArgs): Promise<ConnectionRecord | null>
  deleteConnectionById(args: ConnectionScope): Promise<boolean>
}

type ConnectionGuardFactory = (action: ResourceAction) => ReturnType<typeof createProjectPermissionGuard>

function toPublicConnection(record: ConnectionRecord) {
  const { passwordEncrypted: _passwordEncrypted, ...connection } = record

  return connection
}

function createConnectionPoolConfig(input: TestDatabaseConnectionInput) {
  const ssl =
    input.sslMode === 'disable'
      ? false
      : input.sslMode === 'prefer'
        ? undefined
        : {
            rejectUnauthorized: input.sslMode === 'verify-ca' || input.sslMode === 'verify-full',
          }

  return {
    host: input.host,
    port: input.port,
    user: input.username,
    password: input.password,
    database: input.databaseName,
    ssl,
    max: 1,
    connectionTimeoutMillis: 2_000,
    idleTimeoutMillis: 2_000,
  }
}

export const testPostgresConnection: TestDatabaseConnection = async (input) => {
  const pool = new Pool(createConnectionPoolConfig(input))

  try {
    await pool.query('select 1')
  } finally {
    await pool.end()
  }
}

export function createDrizzleConnectionsRepository(db: Database = appDb): ConnectionsRepository {
  return {
    async getProjectById({ projectId, organizationId }) {
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)))
        .limit(1)

      return project ?? null
    },

    async listConnectionsByProject({ projectId }) {
      return db
        .select()
        .from(databaseConnections)
        .where(eq(databaseConnections.projectId, projectId))
        .orderBy(desc(databaseConnections.createdAt))
    },

    async createConnection({ organizationId: _organizationId, ...values }) {
      const [connection] = await db.insert(databaseConnections).values(values).returning()

      return connection
    },

    async getConnectionById({ connectionId, organizationId }) {
      const [connection] = await db
        .select()
        .from(databaseConnections)
        .where(eq(databaseConnections.id, connectionId))
        .limit(1)

      if (!connection) {
        return null
      }

      const project = await this.getProjectById({
        projectId: connection.projectId,
        organizationId,
      })

      return project ? connection : null
    },

    async updateConnectionById({ connectionId, organizationId, ...updates }) {
      const existingConnection = await this.getConnectionById({ connectionId, organizationId })

      if (!existingConnection) {
        return null
      }

      const [connection] = await db
        .update(databaseConnections)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(databaseConnections.id, connectionId))
        .returning()

      return connection ?? null
    },

    async deleteConnectionById({ connectionId, organizationId }) {
      const existingConnection = await this.getConnectionById({ connectionId, organizationId })

      if (!existingConnection) {
        return false
      }

      const deletedConnections = await db
        .delete(databaseConnections)
        .where(eq(databaseConnections.id, connectionId))
        .returning({ id: databaseConnections.id })

      return deletedConnections.length > 0
    },
  }
}

async function requireProject(repository: ConnectionsRepository, projectId: string, organizationId: string) {
  return repository.getProjectById({ projectId, organizationId })
}

function sanitizeConnectionTestFailure() {
  return {
    success: false as const,
    message: 'Unable to connect using the provided settings.',
  }
}

function buildTestInput(payload: ProjectDatabaseConnectionTestInput, password: string): TestDatabaseConnectionInput {
  return {
    engine: payload.engine,
    host: payload.host,
    port: payload.port,
    databaseName: payload.databaseName,
    username: payload.username,
    password,
    sslMode: payload.sslMode,
    connectionOptions: payload.connectionOptions,
  }
}

export function createConnectionsRouter({
  repository = createDrizzleConnectionsRepository(),
  guardFactory = createProjectPermissionGuard,
  testDatabaseConnection = testPostgresConnection,
  env = process.env,
}: {
  repository?: ConnectionsRepository
  guardFactory?: ConnectionGuardFactory
  testDatabaseConnection?: TestDatabaseConnection
  env?: NodeJS.ProcessEnv
} = {}) {
  const router = new Hono<ApiAuthEnv>()

  router.get('/projects/:projectId/connections', guardFactory('read'), async (c) => {
    const authContext = getAuthContext(c)
    const parsedParams = parseValidatedParams(c.req.param(), projectIdParamsSchema, 'Project id is invalid.')

    if (parsedParams.error) {
      return c.json(parsedParams.error, 400)
    }

    const project = await requireProject(repository, parsedParams.data.projectId, authContext.activeOrganization.id)

    if (!project) {
      return c.json(notFoundError('Project not found.'), 404)
    }

    const result = await repository.listConnectionsByProject({
      projectId: parsedParams.data.projectId,
      organizationId: authContext.activeOrganization.id,
    })

    return c.json(result.map(toPublicConnection))
  })

  router.post('/projects/:projectId/connections', guardFactory('create'), async (c) => {
    const authContext = getAuthContext(c)
    const parsedParams = parseValidatedParams(c.req.param(), projectIdParamsSchema, 'Project id is invalid.')

    if (parsedParams.error) {
      return c.json(parsedParams.error, 400)
    }

    const parsedPayload = await parseValidatedJsonBody(
      c.req.raw,
      createDatabaseConnectionSchema,
      'Database connection payload is invalid.',
    )

    if (parsedPayload.error) {
      return c.json(parsedPayload.error, 400)
    }

    const project = await requireProject(repository, parsedParams.data.projectId, authContext.activeOrganization.id)

    if (!project) {
      return c.json(notFoundError('Project not found.'), 404)
    }

    const connection = await repository.createConnection({
      organizationId: authContext.activeOrganization.id,
      projectId: parsedParams.data.projectId,
      createdByUserId: authContext.user.id,
      ...parsedPayload.data,
      passwordEncrypted: encryptConnectionPassword(parsedPayload.data.password, env),
    })

    return c.json(toPublicConnection(connection), 201)
  })

  router.post('/projects/:projectId/connections/test', guardFactory('create'), async (c) => {
    const authContext = getAuthContext(c)
    const parsedParams = parseValidatedParams(c.req.param(), projectIdParamsSchema, 'Project id is invalid.')

    if (parsedParams.error) {
      return c.json(parsedParams.error, 400)
    }

    const parsedPayload = await parseValidatedJsonBody(
      c.req.raw,
      projectDatabaseConnectionTestSchema,
      'Database connection payload is invalid.',
    )

    if (parsedPayload.error) {
      return c.json(parsedPayload.error, 400)
    }

    const project = await requireProject(repository, parsedParams.data.projectId, authContext.activeOrganization.id)

    if (!project) {
      return c.json(notFoundError('Project not found.'), 404)
    }

    let password = parsedPayload.data.password

    if (parsedPayload.data.connectionId && password === '') {
      const existingConnection = await repository.getConnectionById({
        connectionId: parsedPayload.data.connectionId,
        organizationId: authContext.activeOrganization.id,
      })

      if (!existingConnection || existingConnection.projectId !== parsedParams.data.projectId) {
        return c.json(notFoundError('Connection not found.'), 404)
      }

      password = decryptConnectionPassword(existingConnection.passwordEncrypted, env)
    }

    try {
      await testDatabaseConnection(buildTestInput(parsedPayload.data, password))

      return c.json({ success: true })
    } catch {
      return c.json(sanitizeConnectionTestFailure())
    }
  })

  router.get('/connections/:connectionId', guardFactory('read'), async (c) => {
    const authContext = getAuthContext(c)
    const parsedParams = parseValidatedParams(
      c.req.param(),
      databaseConnectionIdParamsSchema,
      'Connection id is invalid.',
    )

    if (parsedParams.error) {
      return c.json(parsedParams.error, 400)
    }

    const connection = await repository.getConnectionById({
      connectionId: parsedParams.data.connectionId,
      organizationId: authContext.activeOrganization.id,
    })

    if (!connection) {
      return c.json(notFoundError('Connection not found.'), 404)
    }

    return c.json(toPublicConnection(connection))
  })

  router.patch('/connections/:connectionId', guardFactory('update'), async (c) => {
    const authContext = getAuthContext(c)
    const parsedParams = parseValidatedParams(
      c.req.param(),
      databaseConnectionIdParamsSchema,
      'Connection id is invalid.',
    )

    if (parsedParams.error) {
      return c.json(parsedParams.error, 400)
    }

    const parsedPayload = await parseValidatedJsonBody(
      c.req.raw,
      updateDatabaseConnectionSchema,
      'Database connection payload is invalid.',
    )

    if (parsedPayload.error) {
      return c.json(parsedPayload.error, 400)
    }

    const existingConnection = await repository.getConnectionById({
      connectionId: parsedParams.data.connectionId,
      organizationId: authContext.activeOrganization.id,
    })

    if (!existingConnection) {
      return c.json(notFoundError('Connection not found.'), 404)
    }

    const { password, ...updates } = parsedPayload.data
    const nextPasswordEncrypted =
      password === undefined
        ? undefined
        : password === ''
          ? existingConnection.passwordEncrypted
          : encryptConnectionPassword(password, env)

    const connection = await repository.updateConnectionById({
      connectionId: parsedParams.data.connectionId,
      organizationId: authContext.activeOrganization.id,
      ...updates,
      ...(nextPasswordEncrypted ? { passwordEncrypted: nextPasswordEncrypted } : {}),
    })

    if (!connection) {
      return c.json(notFoundError('Connection not found.'), 404)
    }

    return c.json(toPublicConnection(connection))
  })

  router.delete('/connections/:connectionId', guardFactory('delete'), async (c) => {
    const authContext = getAuthContext(c)
    const parsedParams = parseValidatedParams(
      c.req.param(),
      databaseConnectionIdParamsSchema,
      'Connection id is invalid.',
    )

    if (parsedParams.error) {
      return c.json(parsedParams.error, 400)
    }

    const deleted = await repository.deleteConnectionById({
      connectionId: parsedParams.data.connectionId,
      organizationId: authContext.activeOrganization.id,
    })

    if (!deleted) {
      return c.json(notFoundError('Connection not found.'), 404)
    }

    return c.body(null, 204)
  })

  return router
}

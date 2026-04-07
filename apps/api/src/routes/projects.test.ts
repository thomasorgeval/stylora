import type { StyloraAuthorizationContext } from '@stylora/auth'
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApiAuthEnv } from '../middleware/auth.js'
import { createProjectsRouter, type ProjectRecord, type ProjectsRepository } from './projects.js'

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

function createProject(overrides: Partial<ProjectRecord> = {}): ProjectRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    organizationId: 'org_123',
    name: 'Production',
    slug: 'production-ab12cd',
    description: 'Primary database',
    createdByUserId: 'user_123',
    createdAt: new Date('2026-04-07T12:00:00.000Z'),
    updatedAt: new Date('2026-04-07T12:00:00.000Z'),
    ...overrides,
  }
}

function createRepository(): ProjectsRepository {
  return {
    listProjects: vi.fn(async () => []),
    createProject: vi.fn(async ({ name, description, organizationId, createdByUserId }) =>
      createProject({ name, description, organizationId, createdByUserId }),
    ),
    getProjectById: vi.fn(async () => null),
    updateProjectById: vi.fn(async () => null),
    deleteProjectById: vi.fn(async () => false),
  }
}

function createApp(
  repository: ProjectsRepository,
  actions: string[],
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

  app.route('/api/projects', createProjectsRouter({ repository, guardFactory }))

  return app
}

describe('projects router', () => {
  let repository: ProjectsRepository
  let actions: string[]

  beforeEach(() => {
    repository = createRepository()
    actions = []
  })

  it('wires the expected permission guards to each route', () => {
    createApp(repository, actions)

    expect(actions).toEqual(['read', 'create', 'read', 'update', 'delete'])
  })

  it('lists projects for the active organization', async () => {
    const project = createProject()
    vi.mocked(repository.listProjects).mockResolvedValue([project])

    const response = await createApp(repository, actions).request('/api/projects')

    expect(response.status).toBe(200)
    expect(repository.listProjects).toHaveBeenCalledWith({ organizationId: 'org_123' })
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: project.id,
        organizationId: 'org_123',
        name: 'Production',
      }),
    ])
  })

  it('creates a project in the active organization', async () => {
    const response = await createApp(repository, actions).request('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '  Analytics  ',
        description: '  Reporting workspace  ',
      }),
    })

    expect(response.status).toBe(201)
    expect(repository.createProject).toHaveBeenCalledWith({
      organizationId: 'org_123',
      createdByUserId: 'user_123',
      name: 'Analytics',
      description: 'Reporting workspace',
    })
  })

  it('rejects invalid create payloads', async () => {
    const response = await createApp(repository, actions).request('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    })

    expect(response.status).toBe(400)
    expect(repository.createProject).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
      }),
    )
  })

  it('returns a single project scoped to the active organization', async () => {
    const project = createProject()
    vi.mocked(repository.getProjectById).mockResolvedValue(project)

    const response = await createApp(repository, actions).request(`/api/projects/${project.id}`)

    expect(response.status).toBe(200)
    expect(repository.getProjectById).toHaveBeenCalledWith({
      projectId: project.id,
      organizationId: 'org_123',
    })
  })

  it('updates a project when the payload is valid', async () => {
    const project = createProject({ name: 'Warehouse' })
    vi.mocked(repository.updateProjectById).mockResolvedValue(project)

    const response = await createApp(repository, actions).request(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '  Warehouse  ' }),
    })

    expect(response.status).toBe(200)
    expect(repository.updateProjectById).toHaveBeenCalledWith({
      projectId: project.id,
      organizationId: 'org_123',
      name: 'Warehouse',
    })
  })

  it('deletes a project within the active organization', async () => {
    const project = createProject()
    vi.mocked(repository.deleteProjectById).mockResolvedValue(true)

    const response = await createApp(repository, actions).request(`/api/projects/${project.id}`, {
      method: 'DELETE',
    })

    expect(response.status).toBe(204)
    expect(repository.deleteProjectById).toHaveBeenCalledWith({
      projectId: project.id,
      organizationId: 'org_123',
    })
  })
})

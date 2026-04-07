import { createProjectSchema, projectIdParamsSchema, updateProjectSchema } from '@stylora/contracts'
import { appDb, type Database, projects } from '@stylora/db'
import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { notFoundError, parseValidatedJsonBody, parseValidatedParams } from '../lib/http.js'
import {
  type ApiAuthEnv,
  createProjectPermissionGuard,
  getAuthContext,
  type ResourceAction,
} from '../middleware/auth.js'

export type ProjectRecord = typeof projects.$inferSelect

type CreateProjectArgs = {
  organizationId: string
  createdByUserId: string
  name: string
  description?: string
}

type UpdateProjectArgs = {
  projectId: string
  organizationId: string
  name?: string
  description?: string | null
}

type ProjectLookupArgs = {
  projectId: string
  organizationId: string
}

export type ProjectsRepository = {
  listProjects(args: { organizationId: string }): Promise<ProjectRecord[]>
  createProject(args: CreateProjectArgs): Promise<ProjectRecord>
  getProjectById(args: ProjectLookupArgs): Promise<ProjectRecord | null>
  updateProjectById(args: UpdateProjectArgs): Promise<ProjectRecord | null>
  deleteProjectById(args: ProjectLookupArgs): Promise<boolean>
}

type ProjectGuardFactory = (action: ResourceAction) => ReturnType<typeof createProjectPermissionGuard>

function buildProjectSlug(name: string) {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6)

  return `${base || 'project'}-${suffix}`
}

export function createDrizzleProjectsRepository(db: Database = appDb): ProjectsRepository {
  return {
    async listProjects({ organizationId }) {
      return db
        .select()
        .from(projects)
        .where(eq(projects.organizationId, organizationId))
        .orderBy(desc(projects.createdAt))
    },

    async createProject({ organizationId, createdByUserId, name, description }) {
      const [project] = await db
        .insert(projects)
        .values({
          organizationId,
          createdByUserId,
          name,
          slug: buildProjectSlug(name),
          description,
        })
        .returning()

      return project
    },

    async getProjectById({ projectId, organizationId }) {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)))
        .limit(1)

      return project ?? null
    },

    async updateProjectById({ projectId, organizationId, ...updates }) {
      const [project] = await db
        .update(projects)
        .set({
          ...updates,
          ...(updates.name ? { slug: buildProjectSlug(updates.name) } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)))
        .returning()

      return project ?? null
    },

    async deleteProjectById({ projectId, organizationId }) {
      const deletedProjects = await db
        .delete(projects)
        .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)))
        .returning({ id: projects.id })

      return deletedProjects.length > 0
    },
  }
}

export function createProjectsRouter({
  repository = createDrizzleProjectsRepository(),
  guardFactory = createProjectPermissionGuard,
}: {
  repository?: ProjectsRepository
  guardFactory?: ProjectGuardFactory
} = {}) {
  const router = new Hono<ApiAuthEnv>()

  router.get('/', guardFactory('read'), async (c) => {
    const authContext = getAuthContext(c)
    const result = await repository.listProjects({ organizationId: authContext.activeOrganization.id })

    return c.json(result)
  })

  router.post('/', guardFactory('create'), async (c) => {
    const authContext = getAuthContext(c)
    const parsedPayload = await parseValidatedJsonBody(c.req.raw, createProjectSchema, 'Project payload is invalid.')

    if (parsedPayload.error) {
      return c.json(parsedPayload.error, 400)
    }

    const project = await repository.createProject({
      organizationId: authContext.activeOrganization.id,
      createdByUserId: authContext.user.id,
      ...parsedPayload.data,
    })

    return c.json(project, 201)
  })

  router.get('/:projectId', guardFactory('read'), async (c) => {
    const authContext = getAuthContext(c)
    const parsedParams = parseValidatedParams(c.req.param(), projectIdParamsSchema, 'Project id is invalid.')

    if (parsedParams.error) {
      return c.json(parsedParams.error, 400)
    }

    const project = await repository.getProjectById({
      projectId: parsedParams.data.projectId,
      organizationId: authContext.activeOrganization.id,
    })

    if (!project) {
      return c.json(notFoundError('Project not found.'), 404)
    }

    return c.json(project)
  })

  router.patch('/:projectId', guardFactory('update'), async (c) => {
    const authContext = getAuthContext(c)
    const parsedParams = parseValidatedParams(c.req.param(), projectIdParamsSchema, 'Project id is invalid.')

    if (parsedParams.error) {
      return c.json(parsedParams.error, 400)
    }

    const parsedPayload = await parseValidatedJsonBody(c.req.raw, updateProjectSchema, 'Project payload is invalid.')

    if (parsedPayload.error) {
      return c.json(parsedPayload.error, 400)
    }

    const project = await repository.updateProjectById({
      projectId: parsedParams.data.projectId,
      organizationId: authContext.activeOrganization.id,
      ...parsedPayload.data,
    })

    if (!project) {
      return c.json(notFoundError('Project not found.'), 404)
    }

    return c.json(project)
  })

  router.delete('/:projectId', guardFactory('delete'), async (c) => {
    const authContext = getAuthContext(c)
    const parsedParams = parseValidatedParams(c.req.param(), projectIdParamsSchema, 'Project id is invalid.')

    if (parsedParams.error) {
      return c.json(parsedParams.error, 400)
    }

    const deleted = await repository.deleteProjectById({
      projectId: parsedParams.data.projectId,
      organizationId: authContext.activeOrganization.id,
    })

    if (!deleted) {
      return c.json(notFoundError('Project not found.'), 404)
    }

    return c.body(null, 204)
  })

  return router
}

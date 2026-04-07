import { describe, expect, it } from 'vitest'

import {
  activeOrganizationSchema,
  apiErrorSchema,
  authorizationContextSchema,
  createProjectSchema,
  projectIdParamsSchema,
  updateProjectSchema,
} from './index.js'

describe('project contracts', () => {
  it('trims project names when creating a project', () => {
    const payload = createProjectSchema.parse({
      name: '  Production data  ',
      description: '  Main cluster  ',
    })

    expect(payload).toEqual({
      name: 'Production data',
      description: 'Main cluster',
    })
  })

  it('rejects invalid project ids', () => {
    expect(() => projectIdParamsSchema.parse({ projectId: 'not-a-uuid' })).toThrow()
  })

  it('requires at least one field when updating a project', () => {
    expect(() => updateProjectSchema.parse({})).toThrow('At least one project field')
  })
})

describe('auth contracts', () => {
  it('accepts an authorization context with session, user, and active organization', () => {
    const context = authorizationContextSchema.parse({
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
    })

    expect(activeOrganizationSchema.parse(context.activeOrganization).slug).toBe('thomas-workspace')
  })
})

describe('error contracts', () => {
  it('accepts the shared api error shape', () => {
    const payload = apiErrorSchema.parse({
      code: 'FORBIDDEN',
      message: 'Project access is not allowed for the current member.',
    })

    expect(payload.code).toBe('FORBIDDEN')
  })
})

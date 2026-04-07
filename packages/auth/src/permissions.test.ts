import { describe, expect, it } from 'vitest'

import { accessControl, organizationRoles } from './permissions.js'

describe('organization roles', () => {
  it('keeps default organization permissions for admins and owners', () => {
    expect(organizationRoles.admin.authorize({ organization: ['update'] })).toEqual({ success: true })
    expect(organizationRoles.owner.authorize({ organization: ['delete'] })).toEqual({ success: true })
  })

  it('adds project permissions with a read-only member role', () => {
    expect(accessControl.statements.project).toEqual(['create', 'read', 'update', 'delete'])
    expect(organizationRoles.member.authorize({ project: ['read'] })).toEqual({ success: true })

    const result = organizationRoles.member.authorize({ project: ['delete'] })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error).toContain('project')
    }
  })
})

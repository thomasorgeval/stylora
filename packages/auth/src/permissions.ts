import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements, memberAc, ownerAc } from 'better-auth/plugins/organization/access'

export const projectActions = ['create', 'read', 'update', 'delete'] as const

export const projectStatements = {
  ...defaultStatements,
  project: projectActions,
} as const

export const accessControl = createAccessControl(projectStatements)

export const organizationRoles = {
  owner: accessControl.newRole({
    ...ownerAc.statements,
    project: [...projectActions],
  }),
  admin: accessControl.newRole({
    ...adminAc.statements,
    project: [...projectActions],
  }),
  member: accessControl.newRole({
    ...memberAc.statements,
    project: ['read'],
  }),
} as const

export type ProjectAction = (typeof projectActions)[number]

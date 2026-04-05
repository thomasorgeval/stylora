import { describe, expect, it } from 'vitest'

import { buildPersonalOrganization } from './personal-organization.js'

describe('buildPersonalOrganization', () => {
  it('uses the user display name and a stable slug suffix', () => {
    expect(
      buildPersonalOrganization({
        id: 'user_12345678abcd',
        email: 'thomas@example.com',
        name: 'Thomas Laurent',
      }),
    ).toEqual({
      name: "Thomas Laurent's Workspace",
      slug: 'thomas-laurent-user1234',
    })
  })

  it('falls back to the email local part when no display name exists', () => {
    expect(
      buildPersonalOrganization({
        id: 'usr_abcdef123456',
        email: 'db.admin+ops@example.com',
        name: '',
      }),
    ).toEqual({
      name: "db admin ops's Workspace",
      slug: 'db-admin-ops-usrabcde',
    })
  })
})

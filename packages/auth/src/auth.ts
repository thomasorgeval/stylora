import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { appDb, member, schema } from '@stylora/db'
import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { asc, eq } from 'drizzle-orm'

import { getBetterAuthBaseUrl, getBetterAuthSecret } from './env.js'
import { buildPersonalOrganization } from './personal-organization.js'

type CreatedUser = {
  id: string
  email: string
  name?: string | null
}

type CreatedSession = {
  userId: string
  activeOrganizationId?: string | null
} & Record<string, unknown>

const authOptions = {
  appName: 'Stylora',
  baseURL: getBetterAuthBaseUrl(),
  secret: getBetterAuthSecret(),
  database: drizzleAdapter(appDb, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [organization()],
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser: CreatedUser) => {
          const personalOrganization = buildPersonalOrganization(createdUser)

          await auth.api.createOrganization({
            body: {
              ...personalOrganization,
              userId: createdUser.id,
              keepCurrentActiveOrganization: false,
            },
          })
        },
      },
    },
    session: {
      create: {
        before: async (createdSession: CreatedSession) => {
          const activeMembership = await appDb
            .select({ organizationId: member.organizationId })
            .from(member)
            .where(eq(member.userId, createdSession.userId))
            .orderBy(asc(member.createdAt))
            .limit(1)

          return {
            data: {
              ...createdSession,
              activeOrganizationId: activeMembership[0]?.organizationId ?? null,
            },
          }
        },
      },
    },
  },
}

export const auth = betterAuth(authOptions)

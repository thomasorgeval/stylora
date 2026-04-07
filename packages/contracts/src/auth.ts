import { z } from 'zod'

import { genericIdSchema, nonEmptyTrimmedStringSchema, slugSchema } from './common.js'

export const sessionSchema = z
  .object({
    id: genericIdSchema,
    userId: genericIdSchema,
    token: nonEmptyTrimmedStringSchema,
    activeOrganizationId: genericIdSchema.nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    expiresAt: z.date(),
  })
  .loose()

export const sessionUserSchema = z
  .object({
    id: genericIdSchema,
    email: z.email(),
    emailVerified: z.boolean(),
    name: nonEmptyTrimmedStringSchema,
    image: z.string().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .loose()

export const sessionContextSchema = z.object({
  session: sessionSchema,
  user: sessionUserSchema,
})

export const activeOrganizationSchema = z
  .object({
    id: genericIdSchema,
    name: nonEmptyTrimmedStringSchema,
    slug: slugSchema,
    logo: z.string().nullable().optional(),
    metadata: z.unknown().optional(),
    createdAt: z.date(),
  })
  .loose()

export const authorizationContextSchema = sessionContextSchema.extend({
  activeOrganization: activeOrganizationSchema,
})

export type SessionData = z.infer<typeof sessionSchema>
export type SessionUser = z.infer<typeof sessionUserSchema>
export type SessionContext = z.infer<typeof sessionContextSchema>
export type ActiveOrganization = z.infer<typeof activeOrganizationSchema>
export type AuthorizationContext = z.infer<typeof authorizationContextSchema>

import { z } from 'zod'

import { nonEmptyTrimmedStringSchema, uuidSchema } from './common.js'

const connectionOptionsSchema = z.record(z.string(), z.unknown())
const connectionPasswordSchema = nonEmptyTrimmedStringSchema.max(1024)
const updatableConnectionPasswordSchema = z.string().trim().max(1024)

export const databaseConnectionEngineSchema = z.enum(['postgresql'])

export const databaseConnectionSslModeSchema = z.enum(['disable', 'prefer', 'require', 'verify-ca', 'verify-full'])

export const databaseConnectionIdParamsSchema = z.object({
  connectionId: uuidSchema,
})

export const databaseConnectionNameSchema = nonEmptyTrimmedStringSchema.max(120)
export const databaseConnectionHostSchema = nonEmptyTrimmedStringSchema.max(255)
export const databaseConnectionPortSchema = z.int().min(1).max(65535)
export const databaseNameSchema = nonEmptyTrimmedStringSchema.max(255)
export const databaseUsernameSchema = nonEmptyTrimmedStringSchema.max(255)

export const createDatabaseConnectionSchema = z.object({
  name: databaseConnectionNameSchema,
  engine: databaseConnectionEngineSchema,
  host: databaseConnectionHostSchema,
  port: databaseConnectionPortSchema,
  databaseName: databaseNameSchema,
  username: databaseUsernameSchema,
  password: connectionPasswordSchema,
  sslMode: databaseConnectionSslModeSchema,
  connectionOptions: connectionOptionsSchema.optional(),
})

export const updateDatabaseConnectionSchema = z
  .object({
    name: databaseConnectionNameSchema.optional(),
    engine: databaseConnectionEngineSchema.optional(),
    host: databaseConnectionHostSchema.optional(),
    port: databaseConnectionPortSchema.optional(),
    databaseName: databaseNameSchema.optional(),
    username: databaseUsernameSchema.optional(),
    password: updatableConnectionPasswordSchema.optional(),
    sslMode: databaseConnectionSslModeSchema.optional(),
    connectionOptions: connectionOptionsSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one database connection field',
  })

export const projectDatabaseConnectionTestSchema = z
  .object({
    connectionId: uuidSchema.optional(),
    engine: databaseConnectionEngineSchema,
    host: databaseConnectionHostSchema,
    port: databaseConnectionPortSchema,
    databaseName: databaseNameSchema,
    username: databaseUsernameSchema,
    password: updatableConnectionPasswordSchema.default(''),
    sslMode: databaseConnectionSslModeSchema,
    connectionOptions: connectionOptionsSchema.optional(),
  })
  .refine((value) => value.connectionId || value.password.length > 0, {
    message: 'Password is required when testing a new connection',
    path: ['password'],
  })

export const databaseConnectionResponseSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  name: databaseConnectionNameSchema,
  engine: databaseConnectionEngineSchema,
  host: databaseConnectionHostSchema,
  port: databaseConnectionPortSchema,
  databaseName: databaseNameSchema,
  username: databaseUsernameSchema,
  sslMode: databaseConnectionSslModeSchema,
  connectionOptions: connectionOptionsSchema.nullable().optional(),
  lastTestedAt: z.date().nullable(),
  lastTestStatus: z.enum(['success', 'failure']).nullable(),
  createdByUserId: nonEmptyTrimmedStringSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const databaseConnectionTestResultSchema = z.union([
  z.object({ success: z.literal(true) }),
  z.object({
    success: z.literal(false),
    message: nonEmptyTrimmedStringSchema,
  }),
])

export type CreateDatabaseConnectionInput = z.infer<typeof createDatabaseConnectionSchema>
export type UpdateDatabaseConnectionInput = z.infer<typeof updateDatabaseConnectionSchema>
export type ProjectDatabaseConnectionTestInput = z.infer<typeof projectDatabaseConnectionTestSchema>
export type DatabaseConnectionResponse = z.infer<typeof databaseConnectionResponseSchema>
export type DatabaseConnectionTestResult = z.infer<typeof databaseConnectionTestResultSchema>

import { z } from 'zod'

export const trimmedStringSchema = z.string().trim()

export const nonEmptyTrimmedStringSchema = trimmedStringSchema.min(1)

export const genericIdSchema = nonEmptyTrimmedStringSchema

export const uuidSchema = z.string().uuid()

export const slugSchema = trimmedStringSchema
  .min(1)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase letters, numbers, and hyphens only')

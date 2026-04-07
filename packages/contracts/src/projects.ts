import { z } from 'zod'

import { nonEmptyTrimmedStringSchema, uuidSchema } from './common.js'

export const projectIdParamsSchema = z.object({
  projectId: uuidSchema,
})

export const projectNameSchema = nonEmptyTrimmedStringSchema.max(120)

export const projectDescriptionSchema = nonEmptyTrimmedStringSchema.max(280)

export const createProjectSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema.optional(),
})

export const updateProjectSchema = z
  .object({
    name: projectNameSchema.optional(),
    description: z.union([projectDescriptionSchema, z.null()]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one project field',
  })

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

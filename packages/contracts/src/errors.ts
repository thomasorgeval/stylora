import { z } from 'zod'

import { nonEmptyTrimmedStringSchema } from './common.js'

export const apiErrorCodeSchema = z.enum(['UNAUTHENTICATED', 'NO_ACTIVE_ORGANIZATION', 'FORBIDDEN', 'VALIDATION_ERROR'])

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: nonEmptyTrimmedStringSchema,
  details: z.record(z.string(), z.unknown()).optional(),
})

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>
export type ApiError = z.infer<typeof apiErrorSchema>

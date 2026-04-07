export function validationError(message: string, details?: unknown) {
  return {
    code: 'VALIDATION_ERROR',
    message,
    details,
  }
}

export function notFoundError(message: string) {
  return {
    code: 'NOT_FOUND',
    message,
  }
}

export async function parseJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

type ValidationResult<T> =
  | {
      data: T
      error: null
    }
  | {
      data: null
      error: ReturnType<typeof validationError>
    }

type SafeParseSchema<T> = {
  safeParse(value: unknown):
    | {
        success: true
        data: T
      }
    | {
        success: false
        error: {
          flatten(): unknown
        }
      }
}

export function parseValidatedParams<T>(
  params: unknown,
  schema: SafeParseSchema<T>,
  message: string,
): ValidationResult<T> {
  const parsedParams = schema.safeParse(params)

  if (!parsedParams.success) {
    return {
      data: null,
      error: validationError(message, parsedParams.error.flatten()),
    }
  }

  return {
    data: parsedParams.data,
    error: null,
  }
}

export async function parseValidatedJsonBody<T>(
  request: Request,
  schema: SafeParseSchema<T>,
  message: string,
): Promise<ValidationResult<T>> {
  const payload = await parseJsonBody(request)

  if (payload === null) {
    return {
      data: null,
      error: validationError('Request body must be valid JSON.'),
    }
  }

  const parsedPayload = schema.safeParse(payload)

  if (!parsedPayload.success) {
    return {
      data: null,
      error: validationError(message, parsedPayload.error.flatten()),
    }
  }

  return {
    data: parsedPayload.data,
    error: null,
  }
}

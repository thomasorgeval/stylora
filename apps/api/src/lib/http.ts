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

import type { StyloraAuthorizationContext, StyloraSession, StyloraSessionContext, StyloraUser } from '@stylora/auth'
import { getSessionFromHeaders, RequestAuthError, requireProjectPermission } from '@stylora/auth'
import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'

type ProjectAction = 'create' | 'read' | 'update' | 'delete'

export type ApiAuthVariables = {
  auth: StyloraAuthorizationContext | null
  session: StyloraSession | null
  user: StyloraUser | null
}

export type ApiAuthEnv = {
  Variables: ApiAuthVariables
}

type SessionContextService = {
  getSessionFromHeaders(headers: Headers): Promise<StyloraSessionContext | null>
}

type ProjectPermissionService = {
  requireProjectPermission(headers: Headers, action: ProjectAction): Promise<StyloraAuthorizationContext>
}

type RequestAuthErrorLike = {
  code: string
  message: string
  status: number
}

function isRequestAuthErrorLike(error: unknown): error is RequestAuthErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'status' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.status === 'number'
  )
}

function toErrorResponse(error: RequestAuthErrorLike) {
  return {
    code: error.code,
    message: error.message,
  }
}

export function sessionContextMiddleware(service: SessionContextService = { getSessionFromHeaders }) {
  return createMiddleware<ApiAuthEnv>(async (c, next) => {
    const sessionContext = await service.getSessionFromHeaders(c.req.raw.headers)

    c.set('auth', null)
    c.set('session', sessionContext?.session ?? null)
    c.set('user', sessionContext?.user ?? null)

    await next()
  })
}

export function createProjectPermissionGuard(
  action: ProjectAction,
  service: ProjectPermissionService = { requireProjectPermission },
) {
  return createMiddleware<ApiAuthEnv>(async (c, next) => {
    try {
      const authContext = await service.requireProjectPermission(c.req.raw.headers, action)

      c.set('auth', authContext)
      c.set('session', authContext.session)
      c.set('user', authContext.user)

      await next()
    } catch (error) {
      if (error instanceof RequestAuthError || isRequestAuthErrorLike(error)) {
        return c.json(toErrorResponse(error), error.status as 401 | 403 | 409)
      }

      throw error
    }
  })
}

export function getAuthContext(context: Context<ApiAuthEnv>) {
  const authContext = context.get('auth')

  if (!authContext) {
    throw new Error('Auth context is not available on this route.')
  }

  return authContext
}

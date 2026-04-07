import {
  type ActiveOrganization,
  type ApiErrorCode,
  type AuthorizationContext,
  activeOrganizationSchema,
  authorizationContextSchema,
  type SessionContext,
  type SessionUser,
  sessionContextSchema,
} from '@stylora/contracts'

import { auth } from './auth.js'
import type { ProjectAction } from './permissions.js'

type PermissionRequest = Record<string, string[]>

type RequestAuthApi = {
  getSession(args: { headers: Headers }): Promise<SessionContext | null>
  getFullOrganization(args: {
    headers: Headers
    query?: { organizationId?: string }
  }): Promise<ActiveOrganization | null>
  hasPermission(args: {
    headers: Headers
    body: { organizationId?: string; permissions: PermissionRequest }
  }): Promise<{ success: boolean; error: string | null }>
}

export class RequestAuthError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'RequestAuthError'
  }
}

export function isRequestAuthError(error: unknown): error is RequestAuthError {
  return error instanceof RequestAuthError
}

function createRequestAuthError(code: ApiErrorCode, message: string, status: number) {
  return new RequestAuthError(code, message, status)
}

export function createRequestAuth(api: RequestAuthApi = auth.api) {
  async function getSessionFromHeaders(headers: Headers) {
    const sessionContext = await api.getSession({ headers })

    return sessionContext ? sessionContextSchema.parse(sessionContext) : null
  }

  async function requireSessionContext(headers: Headers) {
    const sessionContext = await getSessionFromHeaders(headers)

    if (!sessionContext) {
      throw createRequestAuthError('UNAUTHENTICATED', 'Authentication is required.', 401)
    }

    return sessionContext
  }

  async function requireCurrentUser(headers: Headers): Promise<SessionUser> {
    const sessionContext = await requireSessionContext(headers)

    return sessionContext.user
  }

  async function getActiveOrganizationFromHeaders(headers: Headers, sessionContext?: SessionContext) {
    const resolvedSessionContext = sessionContext ?? (await getSessionFromHeaders(headers))
    const organizationId = resolvedSessionContext?.session.activeOrganizationId

    if (!organizationId) {
      return null
    }

    const activeOrganization = await api.getFullOrganization({
      headers,
      query: { organizationId },
    })

    return activeOrganization ? activeOrganizationSchema.parse(activeOrganization) : null
  }

  async function requireActiveOrganization(headers: Headers): Promise<ActiveOrganization> {
    const sessionContext = await requireSessionContext(headers)

    if (!sessionContext.session.activeOrganizationId) {
      throw createRequestAuthError(
        'NO_ACTIVE_ORGANIZATION',
        'Select an active organization before accessing project resources.',
        409,
      )
    }

    const activeOrganization = await getActiveOrganizationFromHeaders(headers, sessionContext)

    if (!activeOrganization) {
      throw createRequestAuthError(
        'NO_ACTIVE_ORGANIZATION',
        'The active organization could not be loaded for this session.',
        409,
      )
    }

    return activeOrganization
  }

  async function buildAuthorizationContext(headers: Headers): Promise<AuthorizationContext> {
    const sessionContext = await requireSessionContext(headers)
    const activeOrganization = await requireActiveOrganization(headers)

    return authorizationContextSchema.parse({
      ...sessionContext,
      activeOrganization,
    })
  }

  async function requirePermission(headers: Headers, permissions: PermissionRequest): Promise<AuthorizationContext> {
    const sessionContext = await requireSessionContext(headers)
    const organizationId = sessionContext.session.activeOrganizationId

    if (!organizationId) {
      throw createRequestAuthError(
        'NO_ACTIVE_ORGANIZATION',
        'Select an active organization before accessing project resources.',
        409,
      )
    }

    const activeOrganization = await requireActiveOrganization(headers)
    const result = await api.hasPermission({
      headers,
      body: {
        organizationId,
        permissions,
      },
    })

    if (!result.success) {
      throw createRequestAuthError('FORBIDDEN', 'Project access is not allowed for the current member.', 403)
    }

    return authorizationContextSchema.parse({
      ...sessionContext,
      activeOrganization,
    })
  }

  async function requireProjectPermission(headers: Headers, action: ProjectAction) {
    return requirePermission(headers, { project: [action] })
  }

  return {
    buildAuthorizationContext,
    getActiveOrganizationFromHeaders,
    getSessionFromHeaders,
    requireActiveOrganization,
    requireCurrentUser,
    requirePermission,
    requireProjectPermission,
  }
}

export const requestAuth = createRequestAuth()

export const {
  buildAuthorizationContext,
  getActiveOrganizationFromHeaders,
  getSessionFromHeaders,
  requireActiveOrganization,
  requireCurrentUser,
  requirePermission,
  requireProjectPermission,
} = requestAuth

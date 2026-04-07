export declare const auth: {
  handler: (request: Request) => Promise<Response>
  api: Record<string, unknown>
}

export type ProjectAction = 'create' | 'read' | 'update' | 'delete'
export type ApiErrorCode = 'UNAUTHENTICATED' | 'NO_ACTIVE_ORGANIZATION' | 'FORBIDDEN' | 'VALIDATION_ERROR'

export type StyloraSession = {
  id: string
  userId: string
  token: string
  activeOrganizationId?: string | null
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

export type StyloraUser = {
  id: string
  email: string
  emailVerified: boolean
  name: string
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export type StyloraSessionContext = {
  session: StyloraSession
  user: StyloraUser
}

export type StyloraActiveOrganization = {
  id: string
  name: string
  slug: string
  logo?: string | null
  metadata?: unknown
  createdAt: Date
}

export type StyloraAuthorizationContext = StyloraSessionContext & {
  activeOrganization: StyloraActiveOrganization
}

export declare const accessControl: {
  statements: {
    readonly organization: readonly ['update', 'delete']
    readonly member: readonly ['create', 'update', 'delete']
    readonly invitation: readonly ['create', 'cancel']
    readonly team: readonly ['create', 'update', 'delete']
    readonly ac: readonly ['create', 'read', 'update', 'delete']
    readonly project: readonly ['create', 'read', 'update', 'delete']
  }
}

export declare const organizationRoles: {
  owner: {
    authorize(request: Record<string, string[]>): { success: boolean; error?: string }
  }
  admin: {
    authorize(request: Record<string, string[]>): { success: boolean; error?: string }
  }
  member: {
    authorize(request: Record<string, string[]>): { success: boolean; error?: string }
  }
}

export declare class RequestAuthError extends Error {
  code: ApiErrorCode
  status: number
  constructor(code: ApiErrorCode, message: string, status: number)
}

export declare function isRequestAuthError(error: unknown): error is RequestAuthError
export declare function createRequestAuth(api?: {
  getSession(args: { headers: Headers }): Promise<StyloraSessionContext | null>
  getFullOrganization(args: {
    headers: Headers
    query?: { organizationId?: string }
  }): Promise<StyloraActiveOrganization | null>
  hasPermission(args: {
    headers: Headers
    body: { organizationId?: string; permissions: Record<string, string[]> }
  }): Promise<{ success: boolean; error: string | null }>
}): {
  getSessionFromHeaders(headers: Headers): Promise<StyloraSessionContext | null>
  requireCurrentUser(headers: Headers): Promise<StyloraUser>
  getActiveOrganizationFromHeaders(
    headers: Headers,
    sessionContext?: StyloraSessionContext,
  ): Promise<StyloraActiveOrganization | null>
  requireActiveOrganization(headers: Headers): Promise<StyloraActiveOrganization>
  buildAuthorizationContext(headers: Headers): Promise<StyloraAuthorizationContext>
  requirePermission(headers: Headers, permissions: Record<string, string[]>): Promise<StyloraAuthorizationContext>
  requireProjectPermission(headers: Headers, action: ProjectAction): Promise<StyloraAuthorizationContext>
}

export declare function getSessionFromHeaders(headers: Headers): Promise<StyloraSessionContext | null>
export declare function requireCurrentUser(headers: Headers): Promise<StyloraUser>
export declare function getActiveOrganizationFromHeaders(
  headers: Headers,
  sessionContext?: StyloraSessionContext,
): Promise<StyloraActiveOrganization | null>
export declare function requireActiveOrganization(headers: Headers): Promise<StyloraActiveOrganization>
export declare function buildAuthorizationContext(headers: Headers): Promise<StyloraAuthorizationContext>
export declare function requirePermission(
  headers: Headers,
  permissions: Record<string, string[]>,
): Promise<StyloraAuthorizationContext>
export declare function requireProjectPermission(
  headers: Headers,
  action: ProjectAction,
): Promise<StyloraAuthorizationContext>

export declare function getBetterAuthSecret(env?: NodeJS.ProcessEnv): string
export declare function getBetterAuthBaseUrl(env?: NodeJS.ProcessEnv): string
export declare function getStyloraEnvironment(env?: NodeJS.ProcessEnv): 'local' | 'development' | 'production'
export declare function getBetterAuthConfig(env?: NodeJS.ProcessEnv): {
  environment: 'local' | 'development' | 'production'
  secret: string
  baseURL: string
  trustedOrigins: string[]
  useSecureCookies: boolean
}
export declare function getBetterAuthTrustedOrigins(env?: NodeJS.ProcessEnv): string[]
export declare function getBetterAuthUseSecureCookies(env?: NodeJS.ProcessEnv): boolean

export declare function buildPersonalOrganization(user: { id: string; email: string; name?: string | null }): {
  name: string
  slug: string
}

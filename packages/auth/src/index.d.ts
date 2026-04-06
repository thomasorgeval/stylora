export declare const auth: {
  handler: (request: Request) => Promise<Response>
  api: Record<string, unknown>
}

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

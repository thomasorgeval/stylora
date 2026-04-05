export declare const auth: {
  handler: (request: Request) => Promise<Response>
  api: Record<string, unknown>
}

export declare function getBetterAuthSecret(env?: NodeJS.ProcessEnv): string
export declare function getBetterAuthBaseUrl(env?: NodeJS.ProcessEnv): string

export declare function buildPersonalOrganization(user: { id: string; email: string; name?: string | null }): {
  name: string
  slug: string
}

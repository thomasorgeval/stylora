const DEFAULT_BETTER_AUTH_SECRET = 'stylora-local-development-secret-1234567890'
const DEFAULT_BETTER_AUTH_URL = 'http://localhost:3000'

export function getBetterAuthSecret(env: NodeJS.ProcessEnv = process.env) {
  return env.BETTER_AUTH_SECRET ?? DEFAULT_BETTER_AUTH_SECRET
}

export function getBetterAuthBaseUrl(env: NodeJS.ProcessEnv = process.env) {
  return env.BETTER_AUTH_URL ?? DEFAULT_BETTER_AUTH_URL
}

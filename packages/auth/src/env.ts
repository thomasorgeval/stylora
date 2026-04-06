const DEFAULT_BETTER_AUTH_SECRET = 'stylora-local-development-secret-1234567890'
const DEFAULT_BETTER_AUTH_URL = 'http://localhost:3000'
const DEFAULT_LOCAL_WEB_APP_URL = 'http://localhost:4200'

export type StyloraEnvironment = 'local' | 'development' | 'production'

type BetterAuthConfig = {
  environment: StyloraEnvironment
  secret: string
  baseURL: string
  trustedOrigins: string[]
  useSecureCookies: boolean
}

function isStyloraEnvironment(value: string): value is StyloraEnvironment {
  return value === 'local' || value === 'development' || value === 'production'
}

function requireEnvValue(
  name: 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL',
  env: NodeJS.ProcessEnv,
  environment: StyloraEnvironment,
) {
  const value = env[name]?.trim()

  if (value) {
    return value
  }

  throw new Error(`${name} must be set when STYLORA_ENV=${environment}`)
}

function parseOrigins(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function uniqueOrigins(origins: Array<string | undefined>) {
  return [...new Set(origins.filter((origin): origin is string => Boolean(origin)))]
}

export function getStyloraEnvironment(env: NodeJS.ProcessEnv = process.env): StyloraEnvironment {
  const configuredEnvironment = env.STYLORA_ENV?.trim().toLowerCase()

  return configuredEnvironment && isStyloraEnvironment(configuredEnvironment) ? configuredEnvironment : 'local'
}

export function getBetterAuthConfig(env: NodeJS.ProcessEnv = process.env): BetterAuthConfig {
  const environment = getStyloraEnvironment(env)
  const secret =
    environment === 'local'
      ? env.BETTER_AUTH_SECRET?.trim() || env.AUTH_SECRET?.trim() || DEFAULT_BETTER_AUTH_SECRET
      : env.BETTER_AUTH_SECRET?.trim() ||
        env.AUTH_SECRET?.trim() ||
        requireEnvValue('BETTER_AUTH_SECRET', env, environment)
  const baseURL =
    environment === 'local'
      ? env.BETTER_AUTH_URL?.trim() || DEFAULT_BETTER_AUTH_URL
      : requireEnvValue('BETTER_AUTH_URL', env, environment)
  const webAppUrl =
    environment === 'local' ? env.WEB_APP_URL?.trim() || DEFAULT_LOCAL_WEB_APP_URL : env.WEB_APP_URL?.trim()

  return {
    environment,
    secret,
    baseURL,
    trustedOrigins: uniqueOrigins([baseURL, webAppUrl, ...parseOrigins(env.BETTER_AUTH_TRUSTED_ORIGINS)]),
    useSecureCookies: environment !== 'local',
  }
}

export function getBetterAuthSecret(env: NodeJS.ProcessEnv = process.env) {
  return getBetterAuthConfig(env).secret
}

export function getBetterAuthBaseUrl(env: NodeJS.ProcessEnv = process.env) {
  return getBetterAuthConfig(env).baseURL
}

export function getBetterAuthTrustedOrigins(env: NodeJS.ProcessEnv = process.env) {
  return getBetterAuthConfig(env).trustedOrigins
}

export function getBetterAuthUseSecureCookies(env: NodeJS.ProcessEnv = process.env) {
  return getBetterAuthConfig(env).useSecureCookies
}

export const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/stylora'

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.DATABASE_URL ?? DEFAULT_DATABASE_URL
}

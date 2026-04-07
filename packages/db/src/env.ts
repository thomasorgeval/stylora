export const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/stylora'

const ENCRYPTION_KEY_BYTES = 32

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.DATABASE_URL ?? DEFAULT_DATABASE_URL
}

export function getDatabaseEncryptionKey(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.DATABASE_ENCRYPTION_KEY?.trim()

  if (!value) {
    throw new Error('DATABASE_ENCRYPTION_KEY must be set')
  }

  const key = Buffer.from(value, 'base64')

  if (key.length !== ENCRYPTION_KEY_BYTES || key.toString('base64') !== value) {
    throw new Error('DATABASE_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
  }

  return value
}

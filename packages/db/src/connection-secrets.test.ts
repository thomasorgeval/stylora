import { describe, expect, it } from 'vitest'

import { decryptConnectionPassword, encryptConnectionPassword } from './connection-secrets.js'
import { getDatabaseEncryptionKey } from './env.js'

const VALID_ENV = {
  DATABASE_ENCRYPTION_KEY: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
}

describe('getDatabaseEncryptionKey', () => {
  it('returns the configured base64 key when it decodes to 32 bytes', () => {
    expect(getDatabaseEncryptionKey(VALID_ENV)).toBe(VALID_ENV.DATABASE_ENCRYPTION_KEY)
  })

  it('requires DATABASE_ENCRYPTION_KEY everywhere', () => {
    expect(() => getDatabaseEncryptionKey({})).toThrow('DATABASE_ENCRYPTION_KEY must be set')
  })

  it('rejects keys that do not decode to 32 bytes', () => {
    expect(() =>
      getDatabaseEncryptionKey({
        DATABASE_ENCRYPTION_KEY: 'c3R5bG9yYS1pbnZhbGlkLWtleQ==',
      }),
    ).toThrow('DATABASE_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
  })
})

describe('connection password encryption', () => {
  it('round-trips an encrypted password with the configured key', () => {
    const encrypted = encryptConnectionPassword('sup3r-secret!', VALID_ENV)

    expect(decryptConnectionPassword(encrypted, VALID_ENV)).toBe('sup3r-secret!')
  })

  it('uses a random iv so the same password encrypts differently each time', () => {
    const first = encryptConnectionPassword('sup3r-secret!', VALID_ENV)
    const second = encryptConnectionPassword('sup3r-secret!', VALID_ENV)

    expect(first).not.toBe(second)
  })

  it('stores a versioned serialized payload', () => {
    const encrypted = encryptConnectionPassword('sup3r-secret!', VALID_ENV)

    expect(JSON.parse(encrypted)).toMatchObject({
      version: 1,
    })
  })

  it('rejects malformed encrypted payloads', () => {
    expect(() => decryptConnectionPassword('not-json', VALID_ENV)).toThrow(
      'Invalid encrypted connection password payload',
    )
  })

  it('rejects tampered encrypted payloads', () => {
    const encrypted = encryptConnectionPassword('sup3r-secret!', VALID_ENV)
    const tampered = JSON.stringify({
      ...JSON.parse(encrypted),
      ciphertext: 'AAAA',
    })

    expect(() => decryptConnectionPassword(tampered, VALID_ENV)).toThrow(
      'Encrypted connection password payload could not be decrypted',
    )
  })
})

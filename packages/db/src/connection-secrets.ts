import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import { getDatabaseEncryptionKey } from './env.js'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 16
const VERSION = 1

type ConnectionSecretPayload = {
  version: number
  iv: string
  tag: string
  ciphertext: string
}

function getEncryptionKeyBuffer(env: NodeJS.ProcessEnv) {
  return Buffer.from(getDatabaseEncryptionKey(env), 'base64')
}

function parsePayload(value: string): ConnectionSecretPayload {
  try {
    const payload = JSON.parse(value)

    if (
      typeof payload !== 'object' ||
      payload === null ||
      payload.version !== VERSION ||
      typeof payload.iv !== 'string' ||
      typeof payload.tag !== 'string' ||
      typeof payload.ciphertext !== 'string'
    ) {
      throw new Error('invalid payload')
    }

    return payload as ConnectionSecretPayload
  } catch {
    throw new Error('Invalid encrypted connection password payload')
  }
}

export function encryptConnectionPassword(password: string, env: NodeJS.ProcessEnv = process.env) {
  const key = getEncryptionKeyBuffer(env)
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return JSON.stringify({
    version: VERSION,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  })
}

export function decryptConnectionPassword(payload: string, env: NodeJS.ProcessEnv = process.env) {
  const encrypted = parsePayload(payload)

  try {
    const key = getEncryptionKeyBuffer(env)
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(encrypted.iv, 'base64'))

    decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'))

    return Buffer.concat([decipher.update(Buffer.from(encrypted.ciphertext, 'base64')), decipher.final()]).toString(
      'utf8',
    )
  } catch {
    throw new Error('Encrypted connection password payload could not be decrypted')
  }
}

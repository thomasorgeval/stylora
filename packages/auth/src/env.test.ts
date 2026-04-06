import { describe, expect, it } from 'vitest'

import { getBetterAuthConfig, getStyloraEnvironment } from './env.js'

describe('getStyloraEnvironment', () => {
  it('defaults to local when no runtime environment is provided', () => {
    expect(getStyloraEnvironment({})).toBe('local')
  })

  it('uses the explicit Stylora runtime environment when provided', () => {
    expect(getStyloraEnvironment({ STYLORA_ENV: 'development' })).toBe('development')
    expect(getStyloraEnvironment({ STYLORA_ENV: 'production' })).toBe('production')
  })
})

describe('getBetterAuthConfig', () => {
  it('returns safe local defaults for local development', () => {
    expect(getBetterAuthConfig({})).toEqual({
      environment: 'local',
      secret: 'stylora-local-development-secret-1234567890',
      baseURL: 'http://localhost:3000',
      trustedOrigins: ['http://localhost:3000', 'http://localhost:4200'],
      useSecureCookies: false,
    })
  })

  it('uses explicit development settings and secure cookies outside local', () => {
    expect(
      getBetterAuthConfig({
        STYLORA_ENV: 'development',
        BETTER_AUTH_SECRET: 'development-secret-abcdefghijklmnopqrstuvwxyz',
        BETTER_AUTH_URL: 'https://api.dev.stylora.local',
        WEB_APP_URL: 'https://app.dev.stylora.local',
        BETTER_AUTH_TRUSTED_ORIGINS: 'https://admin.dev.stylora.local, https://docs.dev.stylora.local',
      }),
    ).toEqual({
      environment: 'development',
      secret: 'development-secret-abcdefghijklmnopqrstuvwxyz',
      baseURL: 'https://api.dev.stylora.local',
      trustedOrigins: [
        'https://api.dev.stylora.local',
        'https://app.dev.stylora.local',
        'https://admin.dev.stylora.local',
        'https://docs.dev.stylora.local',
      ],
      useSecureCookies: true,
    })
  })
})

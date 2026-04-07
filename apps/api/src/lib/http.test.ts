import { createProjectSchema, projectIdParamsSchema } from '@stylora/contracts'
import { describe, expect, it } from 'vitest'

import { notFoundError, parseJsonBody, parseValidatedJsonBody, parseValidatedParams, validationError } from './http.js'

describe('http helpers', () => {
  it('builds a validation error payload with optional details', () => {
    expect(validationError('Payload is invalid.', { fieldErrors: { name: ['Required'] } })).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Payload is invalid.',
      details: { fieldErrors: { name: ['Required'] } },
    })
  })

  it('builds a not found error payload', () => {
    expect(notFoundError('Project not found.')).toEqual({
      code: 'NOT_FOUND',
      message: 'Project not found.',
    })
  })

  it('parses valid JSON request bodies', async () => {
    const request = new Request('http://localhost/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Production' }),
    })

    await expect(parseJsonBody(request)).resolves.toEqual({ name: 'Production' })
  })

  it('returns null when the request body is not valid JSON', async () => {
    const request = new Request('http://localhost/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json}',
    })

    await expect(parseJsonBody(request)).resolves.toBeNull()
  })

  it('validates and returns parsed JSON payloads', async () => {
    const request = new Request('http://localhost/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '  Production  ' }),
    })

    await expect(parseValidatedJsonBody(request, createProjectSchema, 'Project payload is invalid.')).resolves.toEqual({
      data: { name: 'Production' },
      error: null,
    })
  })

  it('returns a validation error payload when params are invalid', () => {
    expect(parseValidatedParams({ projectId: 'not-a-uuid' }, projectIdParamsSchema, 'Project id is invalid.')).toEqual({
      data: null,
      error: expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: 'Project id is invalid.',
      }),
    })
  })
})

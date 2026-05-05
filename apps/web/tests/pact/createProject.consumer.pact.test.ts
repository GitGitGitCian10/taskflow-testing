import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'
import { PactV4, MatchersV3 } from '@pact-foundation/pact'

import { createProject } from '../../src/api/projects'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const provider = new PactV4({
  consumer: 'taskflow-frontend',
  provider: 'taskflow-api',
  dir: path.resolve(__dirname, '../../../../pacts'),
})

describe('Consumer Pact — createProject', () => {
  it('POST /projects devuelve 201 con id, name y ownerId', async () => {
    await provider
      .addInteraction()
      .given('usuario autenticado con token válido')
      .uponReceiving('una petición para crear proyecto TaskFlow MVP')
      .withRequest('POST', '/projects', (builder) => {
        builder.headers({
          'Content-Type': 'application/json',
          Authorization: MatchersV3.string('Bearer token-de-test'),
        })
        builder.jsonBody({
          name: MatchersV3.string('TaskFlow MVP'),
          description: MatchersV3.string('desc'),
        })
      })
      .willRespondWith(201, (builder) => {
        builder.headers({ 'Content-Type': 'application/json' })
        builder.jsonBody(
          MatchersV3.like({
            id: MatchersV3.string('cidexample'),
            name: MatchersV3.string('TaskFlow MVP'),
            description: MatchersV3.string('desc'),
            archived: MatchersV3.boolean(false),
            createdAt: MatchersV3.string('2026-05-05T12:00:00.000Z'),
            updatedAt: MatchersV3.string('2026-05-05T12:00:00.000Z'),
            ownerId: MatchersV3.string('pact-user-1'),
          })
        )
      })
      .executeTest(async (mockServer) => {
        const result = await createProject(mockServer.url, 'TaskFlow MVP', 'desc', 'token-de-test')
        expect(result.id).toBeDefined()
        expect(result.name).toBe('TaskFlow MVP')
      })
  })
})

// apps/web/tests/pact/createProject.consumer.pact.test.ts
// Test de CONSUMER: genera el contrato Pact para la interacción createProject.
import { describe, it, expect } from 'vitest'
import { PactV4, MatchersV3 } from '@pact-foundation/pact'
import path from 'path'
import { createProject } from '../../src/api/projects'

const provider = new PactV4({
  consumer: 'taskflow-frontend',
  provider: 'taskflow-api',
  // El contrato se guarda en pacts/ en la raíz del monorepo
  dir: path.resolve(__dirname, '../../../../pacts'),
})

describe('Consumer Pact — createProject', () => {
  it('POST /projects devuelve 201 con id, name y ownerId', async () => {
    await provider
      .addInteraction()
      .given('usuario autenticado con token válido')
      .uponReceiving('una petición para crear proyecto TaskFlow MVP')
      .withRequest('POST', '/projects', (builder) => {
        builder.headers({ 'Content-Type': 'application/json' })
        builder.jsonBody({
          name: MatchersV3.string('TaskFlow MVP'),
          description: MatchersV3.string('desc'),
        })
      })
      .willRespondWith(201, (builder) => {
        // Los IDs de TaskFlow son cuid (Prisma @default(cuid())), NO uuid v4.
        // Por eso usamos string() (type matcher) en lugar de uuid(): el contrato
        // verifica el TIPO del campo, no un valor exacto, y así sigue siendo
        // válido aunque el id cambie en cada creación.
        builder.jsonBody({
          id: MatchersV3.string('clx0proj0001'),
          name: MatchersV3.string('TaskFlow MVP'),
          ownerId: MatchersV3.string('clx0owner001'),
        })
      })
      .executeTest(async (mockServer) => {
        const result = await createProject(
          mockServer.url, 'TaskFlow MVP', 'desc', 'token-de-test'
        )
        expect(result.id).toBeDefined()
        expect(result.name).toBe('TaskFlow MVP')
      })
  })
})

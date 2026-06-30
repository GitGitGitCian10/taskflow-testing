// apps/api/tests/pact/projects.provider.pact.test.ts
// Test de PROVIDER: el backend verifica que cumple el contrato generado por el frontend.
import { Verifier } from '@pact-foundation/pact'
import path from 'path'
import { createApp } from '../../src/app'
import { PrismaClient } from '@prisma/client'
import { generateTestJWT } from '../helpers/auth.helper'
import type { AddressInfo } from 'net'
import { beforeAll, afterAll, describe, it } from 'vitest'

const app = createApp()
const prisma = new PrismaClient()

describe('Provider verification — taskflow-api', () => {
  let server: ReturnType<typeof app.listen>
  let port: number

  beforeAll(async () => {
    // Seed mínimo y limpio: el usuario que usará el JWT inyectado por el requestFilter
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
    await prisma.user.create({
      data: { id: 'pact-user-1', email: 'pact@test.com', passwordHash: 'hash' },
    })

    server = app.listen(0)
    port = (server.address() as AddressInfo).port
  })

  it('verifica el contrato del consumer taskflow-frontend', async () => {
    await new Verifier({
      provider: 'taskflow-api',
      providerBaseUrl: `http://localhost:${port}`,
      pactUrls: [
        path.resolve(__dirname, '../../../../pacts/taskflow-frontend-taskflow-api.json'),
      ],
      // Inyecta un JWT válido en cada request para pasar requireAuth
      requestFilter: (req, _res, next) => {
        req.headers['authorization'] = `Bearer ${generateTestJWT('pact-user-1')}`
        next()
      },
      stateHandlers: {
        'usuario autenticado con token válido': async () => {
          return {}
        },
      },
    }).verifyProvider()
  }, 30000)

  afterAll(async () => {
    server.close()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })
})

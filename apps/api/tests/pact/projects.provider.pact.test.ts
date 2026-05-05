import { describe, beforeAll, afterAll, it } from 'vitest'
import { Verifier } from '@pact-foundation/pact'
import path from 'path'
import type { AddressInfo } from 'net'
import bcrypt from 'bcryptjs'

import { createApp } from '../../src/app'
import { PrismaClient } from '@prisma/client'
import { generateTestJWT } from '../helpers/auth.helper'

const app = createApp()
const prisma = new PrismaClient()

describe('Provider verification — taskflow-api', () => {
  let server: ReturnType<typeof app.listen>
  let port: number

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('unused', 4)
    await prisma.user.upsert({
      where: { id: 'pact-user-1' },
      create: {
        id: 'pact-user-1',
        email: 'pact@test.com',
        passwordHash,
      },
      update: { email: 'pact@test.com' },
    })
    server = app.listen(0)
    await new Promise<void>((resolve) => {
      server.once('listening', () => resolve())
    })
    port = (server.address() as AddressInfo).port
  })

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
    await prisma.project.deleteMany({ where: { ownerId: 'pact-user-1' } })
    await prisma.user.deleteMany({ where: { id: 'pact-user-1' } })
    await prisma.$disconnect()
  })

  it('verifica el contrato del consumer taskflow-frontend', async () => {
    const pactPath = path.resolve(__dirname, '../../../../pacts/taskflow-frontend-taskflow-api.json')

    await new Verifier({
      provider: 'taskflow-api',
      providerBaseUrl: `http://127.0.0.1:${port}`,
      pactUrls: [pactPath],
      requestFilter: (req, _res, next) => {
        req.headers['authorization'] = `Bearer ${generateTestJWT('pact-user-1')}`
        next()
      },
      stateHandlers: {
        'usuario autenticado con token válido': async () => ({}),
      },
    }).verifyProvider()
  })
})

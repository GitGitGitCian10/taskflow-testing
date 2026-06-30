// apps/api/tests/projects.integration.test.ts
// Integration tests REALES contra PostgreSQL (taskflow_test) — US-03 y US-04.
// Nota: la API monta las rutas en /projects (no /api/projects) y listProjects
// devuelve un array directo (no { projects: [...] }).
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = createApp()

describe('Proyectos API — US-03 y US-04', () => {
  let token: string
  let userId: string

  beforeAll(async () => {
    // Estado limpio e idempotente (orden por foreign keys)
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'tester@test.com', password: 'Test1234!', name: 'Tester' })
    token = res.body.token
    userId = res.body.user.id
  })

  beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
  })

  afterAll(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // ── 1.1 Happy path: crear proyecto (@US-03) ──────────────────
  it('crea un proyecto y devuelve 201 con id (@US-03)', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'TaskFlow MVP', description: 'Primer sprint' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('TaskFlow MVP')
    expect(res.body.ownerId).toBe(userId)
  })

  // ── 1.2 Error: nombre vacío (@US-03) ─────────────────────────
  it('rechaza nombre vacío con 400 (@US-03)', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', description: 'Sin nombre' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/validation/i)
  })

  // ── 1.3 Error: sin autenticación (@US-03) ────────────────────
  it('rechaza petición sin token con 401 (@US-03)', async () => {
    const res = await request(app)
      .post('/projects')
      .send({ name: 'Proyecto sin auth' })

    expect(res.status).toBe(401)
  })

  // ── 2.1 US-04: solo mis proyectos (@US-04) ───────────────────
  it('solo devuelve los proyectos del usuario autenticado (@US-04)', async () => {
    // Proyecto del primer usuario
    await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto de tester1' })

    // El primer usuario ve su único proyecto
    const list1 = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${token}`)
    expect(list1.status).toBe(200)
    expect(list1.body).toHaveLength(1)

    // Segundo usuario
    const res2 = await request(app)
      .post('/auth/register')
      .send({ email: 'otro@test.com', password: 'Test1234!', name: 'Otro' })
    const token2 = res2.body.token

    // El segundo usuario no ve proyectos ajenos
    const list2 = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${token2}`)
    expect(list2.status).toBe(200)
    expect(list2.body).toHaveLength(0)
  })
})
